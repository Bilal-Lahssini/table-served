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
    if (!isSDKReady || !window.ePosPrint || !window.ePosDev) {
      toast({
        title: "SDK Niet Geladen",
        description: "Epson ePOS SDK wordt geladen... Probeer opnieuw over een paar seconden.",
        variant: "destructive",
      });
      return;
    }

    // Check if running on mobile browser
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile browsers, try alternative printing methods
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      
      // Try to open printer's web interface
      const printerWebUrl = `http://${printerConfig.ipAddress}/cgi-bin/epos/service.cgi`;
      
      try {
        // First, try to fetch the printer's web interface to check if it's accessible
        const response = await fetch(printerWebUrl, { 
          method: 'GET',
          mode: 'no-cors'
        });
        
        // If we can reach the printer, show instructions for manual printing
        toast({
          title: "Mobiel Afdrukken",
          description: `Open in nieuwe tab: http://${printerConfig.ipAddress} en gebruik de web interface om af te drukken.`,
          duration: 10000,
        });
        
        // Open printer web interface in new tab
        window.open(`http://${printerConfig.ipAddress}`, '_blank');
        
      } catch (error) {
        console.error('❌ Printer web interface not accessible:', error);
        
        // Fallback: Show receipt content for manual printing or sharing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Receipt - ${order.id.substring(0, 8)}</title>
                <style>
                  body { font-family: monospace; font-size: 12px; margin: 20px; }
                  .receipt { max-width: 300px; margin: 0 auto; }
                  .center { text-align: center; }
                  .bold { font-weight: bold; }
                </style>
              </head>
              <body>
                <div class="receipt">
                  <pre>${receiptData.replace(/\x1B\[[0-9;]*[mGKH]/g, '')}</pre>
                  <br>
                  <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">
                    🖨️ Print via Browser
                  </button>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
        
        toast({
          title: "Alternatief Afdrukken",
          description: "Receipt geopend in nieuwe tab. Gebruik browser print functie of kopieer naar printer app.",
          duration: 8000,
        });
      }
      
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
  }, [printerConfig, formatReceipt, toast, isSDKReady]);

  return {
    isConnected,
    isSDKReady,
    printerConfig,
    setPrinterConfig,
    printTicket
  };
}