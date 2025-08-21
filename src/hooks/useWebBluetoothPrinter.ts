import { useState, useCallback } from 'react';
import { Order } from '@/types/pos';

interface WebBluetoothPrinterHook {
  isConnected: boolean;
  isConnecting: boolean;
  connectAndPrint: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useWebBluetoothPrinter(): WebBluetoothPrinterHook {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const connectToPrinter = useCallback(async () => {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    setIsConnecting(true);
    
    try {
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] // Common printer service UUID
      });

      if (!bluetoothDevice.gatt) {
        throw new Error('GATT not available');
      }

      const server = await bluetoothDevice.gatt.connect();
      
      // Try common printer service UUIDs
      const serviceUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ];

      let service;
      let writeCharacteristic;

      for (const uuid of serviceUUIDs) {
        try {
          service = await server.getPrimaryService(uuid);
          
          const characteristicUUIDs = [
            '0000ff01-0000-1000-8000-00805f9b34fb',
            '49535343-1e4d-4bd9-ba61-23c647249616',
            '000018f1-0000-1000-8000-00805f9b34fb'
          ];

          for (const charUuid of characteristicUUIDs) {
            try {
              writeCharacteristic = await service.getCharacteristic(charUuid);
              break;
            } catch (e) {
              continue;
            }
          }

          if (writeCharacteristic) break;
        } catch (e) {
          continue;
        }
      }

      if (!writeCharacteristic) {
        throw new Error('Could not find write characteristic');
      }

      setDevice(bluetoothDevice);
      setCharacteristic(writeCharacteristic);
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
        await connectToPrinter();
      }
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      await printReceipt(receiptData);
    } catch (error) {
      console.error('Print operation failed:', error);
      throw error;
    }
  }, [isConnected, connectToPrinter, formatReceipt, printReceipt]);

  const disconnect = useCallback(async () => {
    if (device && device.gatt && device.gatt.connected) {
      await device.gatt.disconnect();
    }
    setDevice(null);
    setCharacteristic(null);
    setIsConnected(false);
  }, [device]);

  return {
    isConnected,
    isConnecting,
    connectAndPrint,
    disconnect
  };
}