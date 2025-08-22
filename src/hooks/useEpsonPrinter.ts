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
  printerConfig: PrinterConfig;
  setPrinterConfig: (config: PrinterConfig) => void;
  printTicket: (order: Order, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
}

export function useEpsonPrinter(): EpsonPrinterHook {
  const [isConnected, setIsConnected] = useState(false);
  const [printerConfig, setPrinterConfigState] = useState<PrinterConfig>({
    ipAddress: '192.168.1.150',
    port: 8008
  });
  const { toast } = useToast();

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
    if (!window.ePosPrint || !window.ePosDev) {
      toast({
        title: "SDK Niet Geladen",
        description: "Epson ePOS SDK is niet geladen. Herlaad de pagina.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🖨️ Attempting to print to:', `${printerConfig.ipAddress}:${printerConfig.port}`);
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      
      // Create device and printer objects
      const device = new window.ePosDev();
      const printer = new window.ePosPrint();
      
      // Add receipt content
      printer.addText(receiptData);
      printer.addCut(printer.CUT_FEED);
      
      // Connect and print
      device.connect(printerConfig.ipAddress, printerConfig.port, (data: any) => {
        if (data === 'OK' || data === 'SSL_CONNECT_OK') {
          console.log('✅ Connected to printer');
          setIsConnected(true);
          
          device.send(printer, 60000, (result: any) => {
            if (result.success) {
              console.log('✅ Print successful');
              toast({
                title: "Print Succesvol",
                description: "Ticket is afgedrukt",
              });
            } else {
              console.error('❌ Print failed:', result);
              toast({
                title: "Print Fout",
                description: `Print mislukt: ${result.code || 'Onbekende fout'}`,
                variant: "destructive",
              });
            }
            
            device.disconnect();
            setIsConnected(false);
          });
        } else {
          console.error('❌ Connection failed:', data);
          setIsConnected(false);
          toast({
            title: "Verbinding Mislukt",
            description: "Printer not reachable, check Wi-Fi or printer status.",
            variant: "destructive",
          });
        }
      });

    } catch (error) {
      console.error('❌ Print error:', error);
      setIsConnected(false);
      toast({
        title: "Print Fout",
        description: "Printer not reachable, check Wi-Fi or printer status.",
        variant: "destructive",
      });
    }
  }, [printerConfig, formatReceipt, toast]);

  return {
    isConnected,
    printerConfig,
    setPrinterConfig,
    printTicket
  };
}