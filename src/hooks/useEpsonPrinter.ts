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
      console.log('🖨️ Preparing receipt for:', `${printerConfig.ipAddress}:${printerConfig.port}`);
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      
      // Web browsers cannot directly connect to printer TCP sockets
      // Provide alternative printing methods
      
      toast({
        title: "Web Browser Beperkingen",
        description: "Directe printer verbinding niet mogelijk. Alternatieve opties worden getoond.",
        duration: 5000,
      });
      
      // Create a printable receipt window
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        const cleanReceiptData = receiptData
          .replace(/\x1B\x61\x01/g, '') // Remove center alignment
          .replace(/\x1B\x61\x00/g, '') // Remove left alignment  
          .replace(/\x1B\x45\x01/g, '') // Remove bold on
          .replace(/\x1B\x45\x00/g, '') // Remove bold off
          .replace(/\x1B\[[0-9;]*[mGKH]/g, ''); // Remove any other escape sequences
          
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Receipt - ${order.id.substring(0, 8)}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  margin: 20px; 
                  line-height: 1.2;
                }
                .receipt { 
                  max-width: 300px; 
                  margin: 0 auto; 
                  border: 1px solid #ccc;
                  padding: 10px;
                  background: white;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .actions {
                  margin: 20px 0;
                  text-align: center;
                }
                .btn {
                  background: #007bff;
                  color: white;
                  border: none;
                  padding: 12px 20px;
                  margin: 5px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                }
                .btn:hover {
                  background: #0056b3;
                }
                .info {
                  background: #f8f9fa;
                  border: 1px solid #dee2e6;
                  border-radius: 4px;
                  padding: 10px;
                  margin: 10px 0;
                  font-size: 11px;
                }
                @media print {
                  .actions, .info { display: none; }
                  .receipt { border: none; box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <div class="receipt">
                <pre>${cleanReceiptData}</pre>
              </div>
              
              <div class="actions">
                <button class="btn" onclick="window.print()">
                  🖨️ Print via Browser
                </button>
                <button class="btn" onclick="copyToClipboard()">
                  📋 Copy Receipt
                </button>
                <button class="btn" onclick="openPrinterInterface()">
                  🌐 Printer Web Interface
                </button>
              </div>
              
              <div class="info">
                <strong>Print Opties:</strong><br>
                • <strong>Print via Browser:</strong> Gebruik je browser's print functie<br>
                • <strong>Copy Receipt:</strong> Kopieer naar klembord voor printer app<br>
                • <strong>Printer Web Interface:</strong> Open printer's web interface (als beschikbaar)<br><br>
                <strong>Printer IP:</strong> ${printerConfig.ipAddress}:${printerConfig.port}
              </div>
              
              <script>
                function copyToClipboard() {
                  const text = \`${cleanReceiptData}\`;
                  navigator.clipboard.writeText(text).then(() => {
                    alert('Receipt gekopieerd naar klembord!');
                  }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Receipt gekopieerd naar klembord!');
                  });
                }
                
                function openPrinterInterface() {
                  const printerUrl = 'http://${printerConfig.ipAddress}';
                  window.open(printerUrl, '_blank');
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Focus the new window
        printWindow.focus();
        
        toast({
          title: "Receipt Gereed",
          description: "Receipt geopend in nieuw venster. Kies je print methode.",
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('❌ Print preparation error:', error);
      toast({
        title: "Print Fout",
        description: "Kon receipt niet voorbereiden.",
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