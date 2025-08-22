
import { useState, useEffect, useCallback } from 'react';
import { PrinterService, PrinterConnection } from '@/services/printerService';
import { Order } from '@/types/pos';

interface UsePrinterServiceReturn {
  isDiscovering: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  connectedPrinter: PrinterConnection | null;
  discoveredPrinters: PrinterConnection[];
  discoverPrinters: () => Promise<void>;
  connectToPrinter: (printer: PrinterConnection) => Promise<void>;
  printOrder: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
}

export function usePrinterService(): UsePrinterServiceReturn {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPrinter, setConnectedPrinter] = useState<PrinterConnection | null>(null);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<PrinterConnection[]>([]);

  const printerService = PrinterService.getInstance();

  useEffect(() => {
    // Load saved connection on mount
    printerService.loadSavedConnection();
    const connection = printerService.getConnection();
    if (connection) {
      setConnectedPrinter(connection);
      setIsConnected(true);
    } else {
      // Auto-discover if no saved connection
      discoverPrinters();
    }
  }, []);

  const discoverPrinters = useCallback(async () => {
    console.log('🔍 Starting discovery for EpsonAC5565...');
    setIsDiscovering(true);
    
    try {
      const printers = await printerService.discoverPrinters();
      setDiscoveredPrinters(printers);
      
      // Auto-connect to first EpsonAC5565 or any Epson printer found
      const epsonPrinter = printers.find(p => 
        p.name.includes('EpsonAC5565') || p.name.includes('Epson')
      );
      
      if (epsonPrinter && !isConnected) {
        console.log(`🎯 Found target printer: ${epsonPrinter.name}`);
        await connectToPrinter(epsonPrinter);
      }
      
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setIsDiscovering(false);
    }
  }, [isConnected]);

  const connectToPrinter = useCallback(async (printer: PrinterConnection) => {
    setIsConnecting(true);
    
    try {
      await printerService.connectToPrinter(printer);
      setConnectedPrinter(printer);
      setIsConnected(true);
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const printOrder = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    if (!isConnected) {
      await discoverPrinters();
      if (!isConnected) {
        throw new Error('No printer connected');
      }
    }

    try {
      await printerService.printOrder(order, isTakeaway, discountApplied);
      console.log('✅ Order printed successfully');
    } catch (error) {
      console.error('Print failed:', error);
      // Reset connection on print failure
      setIsConnected(false);
      setConnectedPrinter(null);
      throw error;
    }
  }, [isConnected, discoverPrinters]);

  return {
    isDiscovering,
    isConnecting,
    isConnected,
    connectedPrinter,
    discoveredPrinters,
    discoverPrinters,
    connectToPrinter,
    printOrder
  };
}
