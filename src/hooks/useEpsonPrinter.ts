import { useState, useEffect, useCallback } from 'react';
import { EpsonPrinterService } from '@/services/epsonPrinterService';
import { Order } from '@/types/pos';

interface UseEpsonPrinterReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  printerIP: string | null;
  isConfigured: boolean;
  testConnection: (ip?: string) => Promise<boolean>;
  setPrinterIP: (ip: string) => Promise<void>;
  printOrder: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
  clearConfiguration: () => void;
}

export function useEpsonPrinter(): UseEpsonPrinterReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerIP, setPrinterIPState] = useState<string | null>(null);

  const printerService = EpsonPrinterService.getInstance();

  useEffect(() => {
    const savedIP = printerService.getPrinterIP();
    setPrinterIPState(savedIP);
    
    if (savedIP) {
      // Test connection on mount if IP is configured
      testConnection().catch(() => {
        // Silent fail on mount
      });
    }
  }, []);

  const testConnection = useCallback(async (ip?: string): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      const result = await printerService.testConnection(ip);
      setIsConnected(result);
      return result;
    } catch (error) {
      setIsConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const setPrinterIP = useCallback(async (ip: string): Promise<void> => {
    setIsConnecting(true);
    
    try {
      const connectionTest = await printerService.testConnection(ip);
      if (!connectionTest) {
        throw new Error('Could not connect to printer at this IP address');
      }
      
      printerService.setPrinterIP(ip);
      setPrinterIPState(ip);
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const printOrder = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean): Promise<void> => {
    setIsPrinting(true);
    
    try {
      await printerService.printReceipt(order, isTakeaway, discountApplied);
    } catch (error) {
      // Reset connection status on print failure
      setIsConnected(false);
      throw error;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  const clearConfiguration = useCallback(() => {
    printerService.clearPrinterIP();
    setPrinterIPState(null);
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    isConnecting,
    isPrinting,
    printerIP,
    isConfigured: !!printerIP,
    testConnection,
    setPrinterIP,
    printOrder,
    clearConfiguration
  };
}