import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Bluetooth Web API type definitions
declare global {
  interface Navigator {
    bluetooth?: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
  }
  
  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: (number | string)[];
  }
  
  interface BluetoothLEScanFilter {
    services?: (number | string)[];
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
  }
}

interface BluetoothPrinter {
  device: BluetoothDevice;
  isConnected: boolean;
}

export function useBluetoothPrinter() {
  const [printer, setPrinter] = useState<BluetoothPrinter | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanForPrinters = useCallback(async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth niet ondersteund in deze browser');
      return;
    }

    setIsScanning(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Thermal printer service
          { namePrefix: 'Printer' },
          { namePrefix: 'Receipt' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'POS' }
        ],
        optionalServices: ['battery_service']
      });

      // Since Web Bluetooth API only allows connecting to one device at a time,
      // we'll directly connect to the selected device
      await connectToDevice(device);
    } catch (error) {
      console.error('Bluetooth scan failed:', error);
      if (error instanceof Error && error.name !== 'NotFoundError') {
        toast.error('Kon niet scannen naar printers');
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  const connectToDevice = useCallback(async (device: BluetoothDevice) => {
    setIsConnecting(true);
    try {
      await device.gatt?.connect();
      
      setPrinter({
        device,
        isConnected: true
      });

      toast.success(`Printer "${device.name || 'Onbekend'}" verbonden`);
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      toast.error('Kon niet verbinden met printer');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectPrinter = useCallback(async () => {
    if (printer?.device.gatt?.connected) {
      printer.device.gatt.disconnect();
    }
    setPrinter(null);
    toast.success('Printer ontkoppeld');
  }, [printer]);

  const printReceipt = useCallback(async (orderData: any) => {
    if (!printer?.isConnected) {
      toast.error('Geen printer verbonden');
      return;
    }

    try {
      // Basic receipt printing logic would go here
      // This is a simplified implementation
      console.log('Printing receipt:', orderData);
      toast.success('Bon wordt afgedrukt...');
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Afdrukken mislukt');
    }
  }, [printer]);

  const sendTestPrint = useCallback(async () => {
    if (!printer?.isConnected) {
      toast.error('Geen printer verbonden');
      return;
    }

    try {
      // Test print functionality
      console.log('Sending test print...');
      toast.success('Test bon wordt afgedrukt...');
    } catch (error) {
      console.error('Test print failed:', error);
      toast.error('Test afdrukken mislukt');
    }
  }, [printer]);

  return {
    printer,
    isConnecting,
    isScanning,
    availableDevices,
    scanForPrinters,
    connectToDevice,
    disconnectPrinter,
    printReceipt,
    sendTestPrint,
    isConnected: printer?.isConnected || false
  };
}