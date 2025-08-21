import { useState, useCallback, useRef } from 'react';
import { Order } from '@/types/pos';
import { useToast } from "@/hooks/use-toast";

interface EpsonPrinterHook {
  isConnected: boolean;
  isConnecting: boolean;
  printerIP: string | null;
  connectAndPrint: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
  setPrinterIP: (ip: string) => void;
  disconnect: () => void;
}

// Declare ePOS types for TypeScript
declare global {
  interface Window {
    epson: {
      ePOSDevice: any;
      ePOSPrint: any;
    };
  }
}

export function useEpsonPrinter(): EpsonPrinterHook {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [printerIP, setPrinterIPState] = useState<string | null>(() => {
    return localStorage.getItem('epson_printer_ip');
  });
  
  const deviceRef = useRef<any>(null);
  const printerRef = useRef<any>(null);
  const { toast } = useToast();

  const setPrinterIP = useCallback((ip: string) => {
    localStorage.setItem('epson_printer_ip', ip);
    setPrinterIPState(ip);
    setIsConnected(false);
  }, []);

  const loadEpsonSDK = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.epson) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = '/epos-2.27.0.js'; // You'll need to add this to public folder
      script.onload = () => {
        if (window.epson) {
          resolve();
        } else {
          reject(new Error('ePOS SDK failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load ePOS SDK'));
      document.head.appendChild(script);
    });
  }, []);

  const connectToPrinter = useCallback(async () => {
    if (!printerIP) {
      const ip = prompt('Enter your Epson TM-m30III IP address:');
      if (!ip) {
        throw new Error('Printer IP address is required');
      }
      setPrinterIP(ip);
      return connectToPrinter();
    }

    if (isConnected && deviceRef.current && printerRef.current) {
      return; // Already connected
    }

    setIsConnecting(true);

    try {
      await loadEpsonSDK();
      
      const { ePOSDevice, ePOSPrint } = window.epson;
      
      // Create device connection
      const device = new ePOSDevice();
      const printer = new ePOSPrint();

      // Connect to printer
      await new Promise<void>((resolve, reject) => {
        device.connect(printerIP, 8008, (data: any) => {
          if (data === 'OK') {
            console.log('Connected to Epson printer');
            deviceRef.current = device;
            printerRef.current = printer;
            setIsConnected(true);
            resolve();
          } else {
            console.error('Connection failed:', data);
            reject(new Error(`Printer not reachable, check Wi-Fi or IP. Error: ${data}`));
          }
        });
      });

    } catch (error) {
      console.error('Epson connection error:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [printerIP, isConnected, loadEpsonSDK, setPrinterIP]);

  const formatOrderTicket = useCallback((order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    const printer = printerRef.current;
    if (!printer) return;

    // Initialize printer
    printer.addTextAlign(printer.ALIGN_CENTER);
    printer.addTextStyle(false, false, true, printer.COLOR_1); // Bold
    printer.addTextSize(2, 2);
    printer.addText('Order Overview\n');
    printer.addTextSize(1, 1);
    printer.addText('================================\n');
    
    // Order details
    printer.addTextAlign(printer.ALIGN_LEFT);
    printer.addTextStyle(false, false, false, printer.COLOR_1); // Normal
    printer.addText(`${isTakeaway ? 'TAKEAWAY ORDER' : `TABLE ${order.tableId}`}\n`);
    printer.addText(`Date: ${new Date().toLocaleDateString()}\n`);
    printer.addText(`Time: ${new Date().toLocaleTimeString()}\n`);
    printer.addText('--------------------------------\n');

    // Items
    order.items.forEach((item) => {
      printer.addText(`${item.menuItem.name}\n`);
      printer.addText(`${item.quantity}x €${item.menuItem.price.toFixed(2)} = €${(item.quantity * item.menuItem.price).toFixed(2)}\n`);
      printer.addText('--------------------------------\n');
    });

    // Totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;

    if (discountAmount > 0) {
      printer.addText(`Subtotal: €${subtotal.toFixed(2)}\n`);
      printer.addText(`Discount (15%): -€${discountAmount.toFixed(2)}\n`);
      printer.addText('--------------------------------\n');
    }

    printer.addTextStyle(false, false, true, printer.COLOR_1); // Bold
    printer.addTextSize(1, 2);
    printer.addText(`TOTAL: €${total.toFixed(2)}\n`);
    printer.addTextSize(1, 1);
    printer.addTextStyle(false, false, false, printer.COLOR_1); // Normal
    
    printer.addText('================================\n');
    printer.addTextAlign(printer.ALIGN_CENTER);
    printer.addText('Thank you for your visit!\n');
    printer.addText('================================\n');
    printer.addFeedLine(3);
    printer.addCut();

    return printer;
  }, []);

  const printOrder = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    const device = deviceRef.current;
    const printer = formatOrderTicket(order, isTakeaway, discountApplied);
    
    if (!device || !printer) {
      throw new Error('Printer not connected');
    }

    return new Promise<void>((resolve, reject) => {
      device.send(printer, (data: any) => {
        if (data.success) {
          console.log('Print successful');
          resolve();
        } else {
          console.error('Print failed:', data);
          reject(new Error(`Print failed: ${data.code || 'Unknown error'}`));
        }
      });
    });
  }, [formatOrderTicket]);

  const connectAndPrint = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    try {
      await connectToPrinter();
      await printOrder(order, isTakeaway, discountApplied);
      
      toast({
        title: "Print Successful",
        description: "Order ticket printed successfully",
      });
    } catch (error) {
      console.error('Print operation failed:', error);
      
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [connectToPrinter, printOrder, toast]);

  const disconnect = useCallback(() => {
    if (deviceRef.current) {
      deviceRef.current.disconnect();
      deviceRef.current = null;
      printerRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    printerIP,
    connectAndPrint,
    setPrinterIP,
    disconnect
  };
}