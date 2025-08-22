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

interface PrinterInfo {
  deviceId: string;
  deviceType: string;
  ipAddress: string;
  macAddress: string;
  deviceName: string;
}

interface EpsonPrinterHook {
  isConnected: boolean;
  discoveredPrinter: PrinterInfo | null;
  isDiscovering: boolean;
  printTicket: (order: Order, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
  rediscoverPrinter: () => void;
}

export function useEpsonPrinter(): EpsonPrinterHook {
  const [isConnected, setIsConnected] = useState(false);
  const [discoveredPrinter, setDiscoveredPrinter] = useState<PrinterInfo | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const { toast } = useToast();

  // Load saved printer from localStorage
  useEffect(() => {
    const savedPrinter = localStorage.getItem('epson-printer');
    if (savedPrinter) {
      try {
        const printer = JSON.parse(savedPrinter);
        setDiscoveredPrinter(printer);
        console.log('🔄 Loaded saved printer:', printer.deviceName, printer.ipAddress);
      } catch (error) {
        console.error('Error loading saved printer:', error);
        localStorage.removeItem('epson-printer');
      }
    }
  }, []);

  // Auto-discover printers on component mount
  useEffect(() => {
    if (!discoveredPrinter) {
      discoverPrinters();
    }
  }, []);

  const discoverPrinters = useCallback(() => {
    if (typeof window === 'undefined' || !window.ePosDiscovery) {
      console.log('⚠️ Epson Discovery SDK not loaded');
      return;
    }

    setIsDiscovering(true);
    console.log('🔍 Starting printer discovery...');

    try {
      const discovery = new window.ePosDiscovery();
      
      discovery.onReceive = (deviceInfo: any) => {
        console.log('🖨️ Discovered printer:', deviceInfo);
        
        // Look specifically for TM-m30III or similar Epson thermal printers
        if (deviceInfo.deviceName && 
            (deviceInfo.deviceName.includes('TM-m30') || 
             deviceInfo.deviceName.includes('TM-') ||
             deviceInfo.deviceType === 'printer')) {
          
          const printerInfo: PrinterInfo = {
            deviceId: deviceInfo.deviceId || '',
            deviceType: deviceInfo.deviceType || 'printer',
            ipAddress: deviceInfo.ipAddress || '',
            macAddress: deviceInfo.macAddress || '',
            deviceName: deviceInfo.deviceName || 'Epson Printer'
          };

          setDiscoveredPrinter(printerInfo);
          setIsDiscovering(false);

          // Save to localStorage
          localStorage.setItem('epson-printer', JSON.stringify(printerInfo));
          
          console.log('✅ Printer found and saved:', printerInfo.deviceName, printerInfo.ipAddress);
          
          toast({
            title: "Printer Gevonden",
            description: `${printerInfo.deviceName} (${printerInfo.ipAddress})`,
          });

          // Stop discovery
          discovery.stop();
        }
      };

      discovery.onError = (error: any) => {
        console.error('❌ Discovery error:', error);
        setIsDiscovering(false);
        toast({
          title: "Discovery Fout",
          description: "Kon geen printers vinden. Controleer WiFi verbinding.",
          variant: "destructive",
        });
      };

      // Start discovery
      discovery.start();

      // Stop discovery after 10 seconds if no printer found
      setTimeout(() => {
        if (isDiscovering) {
          discovery.stop();
          setIsDiscovering(false);
          console.log('⏰ Discovery timeout - no printer found');
        }
      }, 10000);

    } catch (error) {
      console.error('❌ Discovery initialization error:', error);
      setIsDiscovering(false);
      toast({
        title: "Discovery Fout",
        description: "Kon printer discovery niet starten.",
        variant: "destructive",
      });
    }
  }, [isDiscovering, toast]);

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
    if (!discoveredPrinter) {
      toast({
        title: "Geen Printer",
        description: "Geen printer gevonden. Probeer opnieuw te zoeken.",
        variant: "destructive",
      });
      return;
    }

    if (!window.ePosPrint || !window.ePosDev) {
      toast({
        title: "SDK Niet Geladen",
        description: "Epson ePOS SDK is niet geladen. Herlaad de pagina.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🖨️ Attempting to print to:', discoveredPrinter.ipAddress);
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      
      // Create device and printer objects
      const device = new window.ePosDev();
      const printer = new window.ePosPrint();
      
      // Add receipt content
      printer.addText(receiptData);
      printer.addCut(printer.CUT_FEED);
      
      // Connect and print
      device.connect(discoveredPrinter.ipAddress, 8008, (data: any) => {
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
  }, [discoveredPrinter, formatReceipt, toast]);

  const rediscoverPrinter = useCallback(() => {
    localStorage.removeItem('epson-printer');
    setDiscoveredPrinter(null);
    setIsConnected(false);
    discoverPrinters();
  }, [discoverPrinters]);

  return {
    isConnected,
    discoveredPrinter,
    isDiscovering,
    printTicket,
    rediscoverPrinter
  };
}