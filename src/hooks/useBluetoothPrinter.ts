import { useState, useCallback } from 'react';
import { Order } from '@/types/pos';
import { toast } from '@/hooks/use-toast';

// Web Bluetooth API type declarations
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  }
  
  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: BluetoothServiceUUID[];
  }
  
  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
  }
  
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }
  
  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  }
  
  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  }
  
  interface BluetoothRemoteGATTCharacteristic {
    writeValue(value: BufferSource): Promise<void>;
  }
  
  type BluetoothServiceUUID = string;
}

interface BluetoothPrinterHook {
  isConnected: boolean;
  isConnecting: boolean;
  connectAndPrint: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useBluetoothPrinter(): BluetoothPrinterHook {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ESC/POS commands for Epson TM-m30III
  const ESC = '\x1B';
  const GS = '\x1D';
  
  const commands = {
    init: ESC + '@',           // Initialize printer
    center: ESC + 'a' + '\x01', // Center alignment
    left: ESC + 'a' + '\x00',   // Left alignment
    bold: ESC + 'E' + '\x01',   // Bold on
    boldOff: ESC + 'E' + '\x00', // Bold off
    underline: ESC + '-' + '\x01', // Underline on
    underlineOff: ESC + '-' + '\x00', // Underline off
    doubleWidth: GS + '!' + '\x20', // Double width
    normal: GS + '!' + '\x00',   // Normal size
    cut: GS + 'V' + 'A' + '\x00', // Cut paper
    lineFeed: '\n',
    doubleFeed: '\n\n'
  };

  const connectToPrinter = useCallback(async (): Promise<void> => {
    if (!navigator.bluetooth) {
      toast({
        title: "Bluetooth niet ondersteund",
        description: "Deze browser ondersteunt geen Web Bluetooth API.",
        variant: "destructive"
      });
      throw new Error('Bluetooth not supported');
    }

    try {
      setIsConnecting(true);
      
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Epson service
          { namePrefix: 'TM-' }, // Epson TM series
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const char = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      setDevice(device);
      setCharacteristic(char);
      setIsConnected(true);
      
      toast({
        title: "Printer verbonden",
        description: `Verbonden met ${device.name || 'Bluetooth printer'}`,
      });
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      toast({
        title: "Verbinding mislukt",
        description: "Kon niet verbinden met de printer. Controleer of Bluetooth is ingeschakeld.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const formatReceipt = useCallback((order: Order, isTakeaway: boolean, discountApplied: boolean): string => {
    const subtotal = order.items.reduce((sum, item) => 
      sum + (item.menuItem.price * item.quantity), 0
    );
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;
    
    const now = new Date();
    const date = now.toLocaleDateString('nl-NL');
    const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

    let receipt = commands.init;
    
    // Header
    receipt += commands.center + commands.bold + commands.doubleWidth;
    receipt += "PEPE'S RESTAURANT" + commands.lineFeed;
    receipt += commands.normal + commands.boldOff;
    receipt += "--------------------------------" + commands.lineFeed;
    
    // Order info
    receipt += commands.left;
    receipt += `Datum: ${date}  Tijd: ${time}` + commands.lineFeed;
    receipt += `Bestelling: ${isTakeaway ? 'AFHAAL' : `TAFEL ${order.tableId}`}` + commands.lineFeed;
    receipt += `Order ID: ${order.id.substring(0, 8)}` + commands.lineFeed;
    receipt += "--------------------------------" + commands.lineFeed + commands.lineFeed;
    
    // Items
    receipt += commands.bold + "BESTELLING:" + commands.boldOff + commands.lineFeed;
    order.items.forEach(item => {
      const itemTotal = item.menuItem.price * item.quantity;
      receipt += `${item.quantity}x ${item.menuItem.name}` + commands.lineFeed;
      receipt += `   €${item.menuItem.price.toFixed(2)} x ${item.quantity} = €${itemTotal.toFixed(2)}` + commands.lineFeed;
      if (item.notes) {
        receipt += `   Notitie: ${item.notes}` + commands.lineFeed;
      }
      receipt += commands.lineFeed;
    });
    
    // Totals
    receipt += "--------------------------------" + commands.lineFeed;
    if (isTakeaway && discountApplied) {
      receipt += `Subtotaal:          €${subtotal.toFixed(2)}` + commands.lineFeed;
      receipt += `15% Korting:       -€${discountAmount.toFixed(2)}` + commands.lineFeed;
      receipt += "--------------------------------" + commands.lineFeed;
    }
    receipt += commands.bold + commands.doubleWidth;
    receipt += `TOTAAL:            €${total.toFixed(2)}` + commands.lineFeed;
    receipt += commands.normal + commands.boldOff;
    
    // Footer
    receipt += commands.doubleFeed;
    receipt += commands.center;
    receipt += "Bedankt voor uw bezoek!" + commands.lineFeed;
    receipt += "Tot ziens!" + commands.lineFeed;
    receipt += commands.doubleFeed;
    
    // Cut paper
    receipt += commands.cut;
    
    return receipt;
  }, [commands]);

  const printReceipt = useCallback(async (receiptData: string): Promise<void> => {
    if (!characteristic) {
      throw new Error('No printer connected');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptData);
      
      // Split data into chunks of 20 bytes (BLE limitation)
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      toast({
        title: "Ticket afgedrukt",
        description: "Het ticket is succesvol verzonden naar de printer.",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print fout",
        description: "Er is een fout opgetreden tijdens het afdrukken.",
        variant: "destructive"
      });
      throw error;
    }
  }, [characteristic]);

  const connectAndPrint = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean): Promise<void> => {
    try {
      if (!isConnected) {
        await connectToPrinter();
      }
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      await printReceipt(receiptData);
    } catch (error) {
      console.error('Connect and print error:', error);
      throw error;
    }
  }, [isConnected, connectToPrinter, formatReceipt, printReceipt]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setCharacteristic(null);
    setIsConnected(false);
    
    toast({
      title: "Printer losgekoppeld",
      description: "De verbinding met de printer is verbroken.",
    });
  }, [device]);

  return {
    isConnected,
    isConnecting,
    connectAndPrint,
    disconnect
  };
}