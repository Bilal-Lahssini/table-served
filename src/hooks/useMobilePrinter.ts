import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { MobilePrinterService } from '@/services/mobilePrinterService';
import { EpsonPrinterService } from '@/services/epsonPrinterService';
import { Order } from '@/types/pos';

interface UseMobilePrinterReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  printerIP: string | null;
  isConfigured: boolean;
  isMobile: boolean;
  testConnection: (ip?: string) => Promise<boolean>;
  setPrinterIP: (ip: string) => Promise<void>;
  printOrder: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
  clearConfiguration: () => void;
}

export function useMobilePrinter(): UseMobilePrinterReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerIP, setPrinterIPState] = useState<string | null>(null);

  const isMobile = Capacitor.isNativePlatform();
  const printerService = isMobile 
    ? MobilePrinterService.getInstance()
    : EpsonPrinterService.getInstance();

  useEffect(() => {
    console.log(`Initializing printer service - Platform: ${isMobile ? 'Mobile' : 'Web'}`);
    
    const savedIP = printerService.getPrinterIP();
    setPrinterIPState(savedIP);
    
    if (savedIP) {
      // Test connection on mount if IP is configured
      if (isMobile) {
        // For mobile, test immediately
        testConnection().catch(() => {
          console.log('Initial connection test failed (silent)');
        });
      } else {
        // For web, wait for SDK to load
        const checkSDKAndConnect = () => {
          if (typeof window !== 'undefined' && window.epson && window.epson.ePOSPrint) {
            testConnection().catch(() => {
              console.log('Initial connection test failed (silent)');
            });
          } else {
            setTimeout(checkSDKAndConnect, 500);
          }
        };
        checkSDKAndConnect();
      }
    }
  }, [isMobile]);

  const testConnection = useCallback(async (ip?: string): Promise<boolean> => {
    console.log(`Testing connection - Platform: ${isMobile ? 'Mobile' : 'Web'}`);
    setIsConnecting(true);
    
    try {
      const result = await printerService.testConnection(ip);
      setIsConnected(result);
      console.log(`Connection test result: ${result}`);
      return result;
    } catch (error) {
      console.error('Connection test error:', error);
      setIsConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [printerService, isMobile]);

  const setPrinterIP = useCallback(async (ip: string): Promise<void> => {
    console.log(`Setting printer IP: ${ip} - Platform: ${isMobile ? 'Mobile' : 'Web'}`);
    setIsConnecting(true);
    
    try {
      const connectionTest = await printerService.testConnection(ip);
      if (!connectionTest) {
        throw new Error('Could not connect to printer at this IP address');
      }
      
      printerService.setPrinterIP(ip);
      setPrinterIPState(ip);
      setIsConnected(true);
      console.log('Printer IP set successfully');
    } catch (error) {
      console.error('Failed to set printer IP:', error);
      setIsConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [printerService, isMobile]);

  const printOrder = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean): Promise<void> => {
    console.log(`Printing order - Platform: ${isMobile ? 'Mobile' : 'Web'}`);
    setIsPrinting(true);
    
    try {
      await printerService.printReceipt(order, isTakeaway, discountApplied);
      console.log('Order printed successfully');
    } catch (error) {
      console.error('Print failed:', error);
      // Reset connection status on print failure
      setIsConnected(false);
      throw error;
    } finally {
      setIsPrinting(false);
    }
  }, [printerService, isMobile]);

  const clearConfiguration = useCallback(() => {
    console.log(`Clearing printer configuration - Platform: ${isMobile ? 'Mobile' : 'Web'}`);
    printerService.clearPrinterIP();
    setPrinterIPState(null);
    setIsConnected(false);
  }, [printerService, isMobile]);

  return {
    isConnected,
    isConnecting,
    isPrinting,
    printerIP,
    isConfigured: !!printerIP,
    isMobile,
    testConnection,
    setPrinterIP,
    printOrder,
    clearConfiguration
  };
}