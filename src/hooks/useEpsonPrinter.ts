import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ePosDev?: any;
    ePosPrint?: any;
    ePosDiscovery?: any;
  }
}

interface PrinterConfig {
  ipAddress: string;
  port: number;
}

interface EpsonPrinterHook {
  isConnected: boolean;
  isSDKReady: boolean;
  printerConfig: PrinterConfig;
  setPrinterConfig: (config: PrinterConfig) => void;
  printTicket: (order: Order, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
}

export function useEpsonPrinter(): EpsonPrinterHook {
  const [isConnected, setIsConnected] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [printerConfig, setPrinterConfigState] = useState<PrinterConfig>({
    ipAddress: '192.168.1.150',
    port: 8008
  });
  const { toast } = useToast();

  // Check SDK readiness
  useEffect(() => {
    const checkSDK = () => {
      const ready = !!(window.ePosPrint && window.ePosDev);
      setIsSDKReady(ready);
      
      if (ready) {
        console.log('✅ Epson SDK is ready for use');
      } else {
        console.log('⏳ Waiting for Epson SDK to load...');
      }
    };

    // Check immediately
    checkSDK();

    // Check periodically if not ready
    const interval = setInterval(() => {
      if (!isSDKReady) {
        checkSDK();
      } else {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isSDKReady]);

  // Load saved printer config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('epson-printer-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setPrinterConfigState(config);
        console.log('🔄 Loaded saved printer config:', config.ipAddress, config.port);
      } catch (error) {
        console.error('Error loading saved printer config:', error);
        localStorage.removeItem('epson-printer-config');
      }
    }
  }, []);

  const setPrinterConfig = useCallback((config: PrinterConfig) => {
    setPrinterConfigState(config);
    localStorage.setItem('epson-printer-config', JSON.stringify(config));
    console.log('💾 Saved printer config:', config.ipAddress, config.port);
  }, []);

  const formatReceipt = useCallback((order: Order, isTakeaway = false, discountApplied = false): string => {
    const subtotal = order.items.reduce((sum, item) => 
      sum + (item.menuItem.price * item.quantity), 0
    );
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;
    
    const now = new Date();
    const date = now.toLocaleDateString('nl-NL');
    const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

    let receipt = '';
    
    // Header
    receipt += '\x1B\x61\x01'; // Center alignment
    receipt += '\x1B\x45\x01'; // Bold on
    receipt += "PEPE'S RESTAURANT\n";
    receipt += '\x1B\x45\x00'; // Bold off
    receipt += '================================\n';
    
    // Order info
    receipt += '\x1B\x61\x00'; // Left alignment
    receipt += `Datum: ${date}  Tijd: ${time}\n`;
    receipt += `Bestelling: ${isTakeaway ? 'AFHAAL' : `TAFEL ${order.tableId}`}\n`;
    receipt += `Order ID: ${order.id.substring(0, 8)}\n`;
    receipt += '--------------------------------\n\n';
    
    // Items
    receipt += '\x1B\x45\x01BESTELLING:\x1B\x45\x00\n'; // Bold "BESTELLING"
    order.items.forEach(item => {
      const itemTotal = item.menuItem.price * item.quantity;
      receipt += `${item.quantity}x ${item.menuItem.name}\n`;
      receipt += `   €${item.menuItem.price.toFixed(2)} x ${item.quantity} = €${itemTotal.toFixed(2)}\n`;
      if (item.notes) {
        receipt += `   Notitie: ${item.notes}\n`;
      }
      receipt += '\n';
    });
    
    // Totals
    receipt += '--------------------------------\n';
    if (isTakeaway && discountApplied) {
      receipt += `Subtotaal:          €${subtotal.toFixed(2)}\n`;
      receipt += `15% Korting:       -€${discountAmount.toFixed(2)}\n`;
      receipt += '--------------------------------\n';
    }
    receipt += '\x1B\x45\x01'; // Bold on
    receipt += `TOTAAL:            €${total.toFixed(2)}\n`;
    receipt += '\x1B\x45\x00'; // Bold off
    
    // Footer
    receipt += '\n\n';
    receipt += '\x1B\x61\x01'; // Center alignment
    receipt += 'Bedankt voor uw bezoek!\n';
    receipt += 'Tot ziens!\n';
    receipt += '\n\n';
    
    return receipt;
  }, []);

  const printTicket = useCallback(async (order: Order, isTakeaway = false, discountApplied = false): Promise<void> => {
    if (!isSDKReady) {
      toast({
        title: "SDK Niet Geladen",
        description: "Printer SDK wordt geladen... Probeer opnieuw.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🖨️ Preparing receipt for printing...');
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      
      // For web browsers, use system print dialog which can access USB printers
      const printContent = receiptData
        .replace(/\x1B\x61\x01/g, '') // Remove center alignment ESC codes
        .replace(/\x1B\x61\x00/g, '') // Remove left alignment ESC codes
        .replace(/\x1B\x45\x01/g, '') // Remove bold on ESC codes
        .replace(/\x1B\x45\x00/g, '') // Remove bold off ESC codes
        .replace(/\x1B\[[0-9;]*[mGKH]/g, ''); // Remove any other ESC codes
      
      // Create a hidden iframe for printing
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-10000px';
      printFrame.style.left = '-10000px';
      printFrame.style.width = '1px';
      printFrame.style.height = '1px';
      document.body.appendChild(printFrame);
      
      const printDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (printDoc) {
        printDoc.open();
        printDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Receipt</title>
              <style>
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.1;
                  margin: 0;
                  padding: 5mm;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
                .center {
                  text-align: center;
                }
                .bold {
                  font-weight: bold;
                }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printDoc.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          
          // Clean up after printing
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
          
          toast({
            title: "Print Dialoog Geopend",
            description: "Selecteer je USB printer in het print dialoog.",
            duration: 4000,
          });
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Print preparation error:', error);
      toast({
        title: "Print Fout",
        description: "Kon print dialoog niet openen.",
        variant: "destructive",
      });
    }
  }, [formatReceipt, toast, isSDKReady]);

  return {
    isConnected,
    isSDKReady,
    printerConfig,
    setPrinterConfig,
    printTicket
  };
}