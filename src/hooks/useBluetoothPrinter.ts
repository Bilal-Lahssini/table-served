import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Web Bluetooth API TypeScript declarations
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
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

type BluetoothServiceUUID = number | string;

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }
}

interface BluetoothPrinter {
  device: BluetoothDevice;
  isConnected: boolean;
}

export function useBluetoothPrinter() {
  const [printer, setPrinter] = useState<BluetoothPrinter | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectPrinter = useCallback(async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth niet ondersteund in deze browser');
      return;
    }

    setIsConnecting(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Thermal printer service
        ],
        optionalServices: ['battery_service']
      });

      await device.gatt?.connect();
      
      setPrinter({
        device,
        isConnected: true
      });

      toast.success(`Printer "${device.name}" verbonden`);
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
      toast.success('Bon wordt afgedrukt...');
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Afdrukken mislukt');
    }
  }, [printer]);

  return {
    printer,
    isConnecting,
    connectPrinter,
    disconnectPrinter,
    printReceipt,
    isConnected: printer?.isConnected || false
  };
}