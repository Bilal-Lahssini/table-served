import { useState, useCallback } from 'react';
import { Order } from '@/types/pos';
import { toast } from '@/hooks/use-toast';
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';

interface NativeBLEPrinterHook {
  isConnected: boolean;
  isConnecting: boolean;
  connectAndPrint: (order: Order, isTakeaway: boolean, discountApplied: boolean, selectedDevice?: BleDevice) => Promise<void>;
  connectToPrinter: (selectedDevice?: BleDevice) => Promise<void>;
  disconnect: () => Promise<void>;
  connectedDevice: BleDevice | null;
}

export function useNativeBLEPrinter(): NativeBLEPrinterHook {
  const [device, setDevice] = useState<BleDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ESC/POS commands for thermal printers
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

  const connectToPrinter = useCallback(async (selectedDevice?: BleDevice): Promise<void> => {
    try {
      setIsConnecting(true);
      
      // Initialize BLE
      await BleClient.initialize();
      
      let device: BleDevice;
      
      if (selectedDevice) {
        // Use pre-selected device
        device = selectedDevice;
      } else {
        // Request device scan with improved EPSON filtering
        device = await BleClient.requestDevice({
          namePrefix: 'EPSON',
          optionalServices: [
            '000018f0-0000-1000-8000-00805f9b34fb', // Epson thermal printer service
            '0000ff00-0000-1000-8000-00805f9b34fb', // Generic service  
            '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HM-10 BLE module
            '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART service
            '000018f0-0000-1000-8000-00805f9b34fb'  // Epson service
          ],
        });
      }

      console.log('Connecting to EPSON printer:', device.name, device.deviceId);
      
      // Connect to device
      await BleClient.connect(device.deviceId);
      
      setDevice(device);
      setIsConnected(true);
      
      toast({
        title: "EPSON Printer verbonden",
        description: `Verbonden met ${device.name || 'EPSON BLE printer'}`,
      });
      
    } catch (error) {
      console.error('BLE connection error:', error);
      toast({
        title: "Verbinding mislukt",
        description: "Kon niet verbinden met de EPSON printer. Controleer of Bluetooth is ingeschakeld en de printer in pairing mode staat.",
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
    if (!device) {
      throw new Error('No printer connected');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(receiptData);
      
      // Convert to DataView for BLE transmission
      const dataView = new DataView(data.buffer);
      
      // Send data in chunks (BLE has packet size limitations)
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, data.length);
        const chunk = data.slice(i, end);
        
        await BleClient.write(
          device.deviceId,
          '000018f0-0000-1000-8000-00805f9b34fb', // Service UUID
          '00002af1-0000-1000-8000-00805f9b34fb', // Characteristic UUID
          new DataView(chunk.buffer)
        );
        
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      toast({
        title: "Ticket afgedrukt",
        description: "Het ticket is succesvol verzonden naar de BLE printer.",
      });
      
    } catch (error) {
      console.error('BLE print error:', error);
      toast({
        title: "Print fout",
        description: "Er is een fout opgetreden tijdens het afdrukken via BLE.",
        variant: "destructive"
      });
      throw error;
    }
  }, [device]);

  const connectAndPrint = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean, selectedDevice?: BleDevice): Promise<void> => {
    try {
      if (!isConnected) {
        await connectToPrinter(selectedDevice);
      }
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      await printReceipt(receiptData);
    } catch (error) {
      console.error('Connect and print error:', error);
      throw error;
    }
  }, [isConnected, connectToPrinter, formatReceipt, printReceipt]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (device && isConnected) {
      try {
        await BleClient.disconnect(device.deviceId);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    
    setDevice(null);
    setIsConnected(false);
    
    toast({
      title: "Printer losgekoppeld",
      description: "BLE verbinding met de printer is verbroken.",
    });
  }, [device, isConnected]);

  return {
    isConnected,
    isConnecting,
    connectAndPrint,
    connectToPrinter,
    disconnect,
    connectedDevice: device
  };
}