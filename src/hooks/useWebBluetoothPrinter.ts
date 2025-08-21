import { useState, useCallback } from 'react';
import { Order } from '@/types/pos';

interface WebBluetoothPrinterHook {
  isConnected: boolean;
  isConnecting: boolean;
  connectionType: 'bluetooth' | 'wifi' | null;
  connectAndPrint: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useWebBluetoothPrinter(): WebBluetoothPrinterHook {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionType, setConnectionType] = useState<'bluetooth' | 'wifi' | null>(null);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [printerIP, setPrinterIP] = useState<string | null>(null);

  const connectToWiFiPrinter = useCallback(async () => {
    console.log('Attempting WiFi printer connection...');
    
    // Common IP ranges for EPSON printers
    const commonIPs = [
      '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
      '192.168.0.100', '192.168.0.101', '192.168.0.102', '192.168.0.103',
      '10.0.0.100', '10.0.0.101', '10.0.0.102', '10.0.0.103'
    ];
    
    // Ask user for printer IP or try common ones
    const userIP = prompt('Enter printer IP address (or leave empty to auto-detect):');
    const ipsToTry = userIP ? [userIP] : commonIPs;
    
    for (const ip of ipsToTry) {
      try {
        console.log(`Trying printer at ${ip}...`);
        
        // Test connection with a simple HTTP request
        const response = await fetch(`http://${ip}:631/`, {
          method: 'GET',
          mode: 'no-cors',
          signal: AbortSignal.timeout(3000)
        });
        
        console.log(`Found printer at ${ip}`);
        setPrinterIP(ip);
        setConnectionType('wifi');
        setIsConnected(true);
        return;
      } catch (error) {
        console.log(`No printer found at ${ip}`);
        continue;
      }
    }
    
    throw new Error('No WiFi printer found. Make sure your EPSON printer is connected to the same network.');
  }, []);

  const printViaWiFi = useCallback(async (receiptData: string) => {
    if (!printerIP) {
      throw new Error('No WiFi printer connected');
    }

    try {
      console.log(`Printing via WiFi to ${printerIP}...`);
      
      // Try different EPSON printer endpoints
      const endpoints = [
        `http://${printerIP}:9100/`, // Raw TCP port
        `http://${printerIP}:631/printers/`, // CUPS
        `http://${printerIP}/cgi-bin/epos/service.cgi` // EPSON ePOS
      ];
      
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptData);
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.epson.epos-print',
            },
            body: data,
            signal: AbortSignal.timeout(10000)
          });
          
          if (response.ok) {
            console.log(`Successfully printed via ${endpoint}`);
            return;
          }
        } catch (e) {
          console.log(`Failed to print via ${endpoint}:`, e);
          continue;
        }
      }
      
      throw new Error('Failed to print via WiFi');
    } catch (error) {
      console.error('WiFi print failed:', error);
      throw error;
    }
  }, [printerIP]);

  const connectToPrinter = useCallback(async () => {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    setIsConnecting(true);
    
    try {
      console.log('Requesting Bluetooth device...');
      
      // Look specifically for EPSON printers
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'EPSON' },
          { name: 'TM-m30III' },
          { namePrefix: 'TM-m30' },
          { namePrefix: 'TM-' }
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer
          '0000ff00-0000-1000-8000-00805f9b34fb', // Generic service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HM-10 module
          '0000180f-0000-1000-8000-00805f9b34fb', // Battery service
          '0000180a-0000-1000-8000-00805f9b34fb', // Device info
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
          '12345678-1234-5678-9012-123456789abc'  // Custom service
        ]
      });

      console.log('Device selected:', bluetoothDevice.name);

      if (!bluetoothDevice.gatt) {
        throw new Error('GATT not available');
      }

      console.log('Connecting to GATT server...');
      const server = await bluetoothDevice.gatt.connect();
      console.log('Connected to GATT server');
      
      // Get all available services first
      console.log('Getting primary services...');
      const services = await server.getPrimaryServices();
      console.log('Available services:', services.map(s => s.uuid));

      let writeCharacteristic = null;

      // Try to find a writable characteristic in any service
      for (const service of services) {
        try {
          console.log(`Checking service: ${service.uuid}`);
          const characteristics = await service.getCharacteristics();
          console.log(`Characteristics in ${service.uuid}:`, characteristics.map(c => c.uuid));
          
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              console.log(`Found writable characteristic: ${char.uuid}`);
              writeCharacteristic = char;
              break;
            }
          }
          
          if (writeCharacteristic) break;
        } catch (e) {
          console.log(`Error checking service ${service.uuid}:`, e);
          continue;
        }
      }

      if (!writeCharacteristic) {
        throw new Error('No writable characteristic found. Available services: ' + services.map(s => s.uuid).join(', '));
      }

      setDevice(bluetoothDevice);
      setCharacteristic(writeCharacteristic);
      setConnectionType('bluetooth');
      setIsConnected(true);
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const formatReceipt = useCallback((order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    const ESC = '\x1b';
    const INIT = ESC + '@';
    const BOLD_ON = ESC + 'E' + '\x01';
    const BOLD_OFF = ESC + 'E' + '\x00';
    const CENTER = ESC + 'a' + '\x01';
    const LEFT = ESC + 'a' + '\x00';
    const CUT = ESC + 'd' + '\x05' + ESC + 'i';

    let receipt = INIT;
    
    // Header
    receipt += CENTER + BOLD_ON;
    receipt += '===============================\n';
    receipt += '         RESTAURANT\n';
    receipt += '===============================\n';
    receipt += BOLD_OFF + LEFT;
    
    // Order info
    receipt += '\n';
    receipt += `${isTakeaway ? 'AFHAAL BESTELLING' : `TAFEL ${order.tableId}`}\n`;
    receipt += `Datum: ${new Date().toLocaleDateString('nl-NL')}\n`;
    receipt += `Tijd: ${new Date().toLocaleTimeString('nl-NL')}\n`;
    receipt += '-------------------------------\n';
    
    // Items
    order.items.forEach((item) => {
      receipt += `${item.menuItem.name}\n`;
      receipt += `${item.quantity}x €${item.menuItem.price.toFixed(2)} = €${(item.quantity * item.menuItem.price).toFixed(2)}\n`;
      receipt += '-------------------------------\n';
    });

    // Totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;

    if (discountAmount > 0) {
      receipt += `Subtotaal: €${subtotal.toFixed(2)}\n`;
      receipt += `Korting (15%): -€${discountAmount.toFixed(2)}\n`;
      receipt += '-------------------------------\n';
    }
    
    receipt += BOLD_ON;
    receipt += `TOTAAL: €${total.toFixed(2)}\n`;
    receipt += BOLD_OFF;
    
    receipt += '===============================\n';
    receipt += CENTER;
    receipt += 'Bedankt voor uw bezoek!\n';
    receipt += '===============================\n';
    receipt += '\n\n\n';
    receipt += CUT;

    return receipt;
  }, []);

  const printReceipt = useCallback(async (receiptData: string) => {
    if (!characteristic) {
      throw new Error('Not connected to printer');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptData);
      
      // Send data in chunks to avoid overwhelming the printer
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between chunks
      }
    } catch (error) {
      console.error('Print failed:', error);
      throw error;
    }
  }, [characteristic]);

  const connectAndPrint = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    try {
      if (!isConnected) {
        // Try WiFi first, then Bluetooth
        try {
          console.log('Trying WiFi connection first...');
          await connectToWiFiPrinter();
        } catch (wifiError) {
          console.log('WiFi failed, trying Bluetooth...', wifiError);
          await connectToPrinter();
        }
      }
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      
      if (connectionType === 'wifi') {
        await printViaWiFi(receiptData);
      } else {
        await printReceipt(receiptData);
      }
    } catch (error) {
      console.error('Print operation failed:', error);
      throw error;
    }
  }, [isConnected, connectionType, connectToWiFiPrinter, connectToPrinter, formatReceipt, printViaWiFi, printReceipt]);

  const disconnect = useCallback(async () => {
    if (device && device.gatt && device.gatt.connected) {
      await device.gatt.disconnect();
    }
    setDevice(null);
    setCharacteristic(null);
    setPrinterIP(null);
    setConnectionType(null);
    setIsConnected(false);
  }, [device]);

  return {
    isConnected,
    isConnecting,
    connectionType,
    connectAndPrint,
    disconnect
  };
}