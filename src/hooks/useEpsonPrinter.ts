import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

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
  generatePrintQR: (order: Order, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
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
      
      // Try TM Utility integration first
      const tryTMUtility = async (): Promise<boolean> => {
        try {
          console.log('🔌 Attempting TM Utility integration...');
          
          // TM Utility usually runs a local web server on port 8080 or 8008
          const tmUtilityPorts = [8080, 8008, 8888, 9100];
          
          for (const port of tmUtilityPorts) {
            try {
              const tmUtilityUrl = `http://localhost:${port}/cgi-bin/epos/service.cgi`;
              
              // Create ESC/POS commands for TM Utility
              const escPosData = receiptData
                .replace(/\n/g, '\x0A') // Line feed
                .replace(/================================/g, '--------------------------------'); // Adjust separator
              
              // Try to send print command to TM Utility
              const response = await fetch(tmUtilityUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  'devid': 'local_printer',
                  'timeout': '10000',
                  'data': escPosData + '\x1D\x56\x00' // Add cut command
                }),
                signal: AbortSignal.timeout(3000)
              });
              
              if (response.ok) {
                console.log(`✅ TM Utility found on port ${port}`);
                toast({
                  title: "TM Utility Print Succesvol",
                  description: "Receipt verzonden via Epson TM Utility.",
                });
                return true;
              }
            } catch (portError) {
              console.log(`❌ TM Utility not found on port ${port}`);
            }
          }
          
          return false;
        } catch (error) {
          console.error('❌ TM Utility integration failed:', error);
          return false;
        }
      };
      
      // Try direct printer communication via TM Utility
      const tmUtilitySuccess = await tryTMUtility();
      
      if (!tmUtilitySuccess) {
        console.log('📋 TM Utility not available, falling back to browser printing...');
        
        toast({
          title: "TM Utility Niet Gevonden",
          description: "Start Epson TM Utility voor directe printer toegang. Gebruik nu browser print.",
          duration: 5000,
        });
        
        // Fallback to browser printing
        const cleanReceiptData = receiptData
          .replace(/\x1B\x61\x01/g, '') // Remove center alignment ESC codes
          .replace(/\x1B\x61\x00/g, '') // Remove left alignment ESC codes
          .replace(/\x1B\x45\x01/g, '') // Remove bold on ESC codes
          .replace(/\x1B\x45\x00/g, '') // Remove bold off ESC codes
          .replace(/\x1B\[[0-9;]*[mGKH]/g, ''); // Remove any other ESC codes
        
        // Detect iPhone/iPad
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
          // iPhone/iPad: Use AirPrint
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Receipt</title>
                  <style>
                    @page { size: auto; margin: 0.5cm; }
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Courier New', monospace;
                      font-size: 14px;
                      line-height: 1.2;
                      margin: 0;
                      padding: 10px;
                      background: white;
                    }
                    .receipt {
                      max-width: 300px;
                      margin: 0 auto;
                      background: white;
                      padding: 15px;
                      border: 1px solid #ddd;
                      border-radius: 8px;
                    }
                    .actions {
                      position: fixed;
                      bottom: 0;
                      left: 0;
                      right: 0;
                      background: white;
                      padding: 15px;
                      border-top: 1px solid #ddd;
                      display: flex;
                      gap: 10px;
                    }
                    .btn {
                      flex: 1;
                      background: #007AFF;
                      color: white;
                      border: none;
                      padding: 12px;
                      border-radius: 8px;
                      font-size: 16px;
                      cursor: pointer;
                    }
                    .btn:active { background: #005BB5; }
                    .btn.secondary { background: #8E8E93; }
                    @media print {
                      .actions { display: none; }
                      .receipt { border: none; border-radius: 0; }
                    }
                  </style>
                </head>
                <body>
                  <div class="receipt">
                    <pre>${cleanReceiptData}</pre>
                  </div>
                  
                  <div class="actions">
                    <button class="btn" onclick="window.print()">
                      🖨️ AirPrint
                    </button>
                    <button class="btn secondary" onclick="shareReceipt()">
                      📤 Share
                    </button>
                  </div>
                  
                  <script>
                    function shareReceipt() {
                      const text = \`${cleanReceiptData}\`;
                      
                      if (navigator.share) {
                        navigator.share({
                          title: 'Receipt',
                          text: text
                        }).catch(console.log);
                      } else {
                        navigator.clipboard.writeText(text).then(() => {
                          alert('Receipt copied to clipboard!');
                        });
                      }
                    }
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          }
          
        } else {
          // Desktop/Android: Use iframe printing for USB/system printers
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
                  </style>
                </head>
                <body>${cleanReceiptData}</body>
              </html>
            `);
            printDoc.close();
            
            setTimeout(() => {
              printFrame.contentWindow?.focus();
              printFrame.contentWindow?.print();
              
              setTimeout(() => {
                document.body.removeChild(printFrame);
              }, 1000);
              
              toast({
                title: "Browser Print Geopend",
                description: "Selecteer je printer in het dialoog.",
                duration: 4000,
              });
            }, 100);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Print preparation error:', error);
      toast({
        title: "Print Fout",
        description: "Kon print functie niet starten.",
        variant: "destructive",
      });
    }
  }, [formatReceipt, toast, isSDKReady]);

  const generatePrintQR = useCallback(async (order: Order, isTakeaway = false, discountApplied = false): Promise<void> => {
    try {
      console.log('📱 Generating QR code for TM Utility...');
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      
      // Create TM Utility compatible data structure
      const tmUtilityData = {
        type: 'TM_UTILITY_PRINT',
        printerIp: printerConfig.ipAddress,
        port: printerConfig.port,
        data: receiptData,
        cut: true,
        timestamp: new Date().toISOString(),
        orderId: order.id
      };
      
      // Convert to JSON string for QR code
      const qrData = JSON.stringify(tmUtilityData);
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Display QR code in a popup window
      const qrWindow = window.open('', '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
      if (qrWindow) {
        qrWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Print QR Code</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: #f5f5f5;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .container {
                  background: white;
                  padding: 30px;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 400px;
                }
                .qr-code {
                  margin: 20px 0;
                  border: 2px solid #e0e0e0;
                  border-radius: 8px;
                  padding: 10px;
                  background: white;
                }
                .instructions {
                  margin-top: 20px;
                  padding: 15px;
                  background: #e8f4fd;
                  border-radius: 8px;
                  border-left: 4px solid #2196f3;
                }
                .steps {
                  text-align: left;
                  margin-top: 15px;
                }
                .step {
                  margin: 8px 0;
                  padding: 5px 0;
                  border-bottom: 1px solid #eee;
                }
                .order-info {
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 6px;
                  margin-bottom: 15px;
                  font-size: 14px;
                }
                h1 {
                  color: #333;
                  margin-bottom: 10px;
                }
                h3 {
                  color: #2196f3;
                  margin-bottom: 10px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🖨️ Print QR Code</h1>
                
                <div class="order-info">
                  <strong>Order ${order.id.substring(0, 8)}</strong><br>
                  ${isTakeaway ? 'Afhaal' : 'Tafel ' + order.tableId} - ${order.items.length} items<br>
                  Printer: ${printerConfig.ipAddress}:${printerConfig.port}
                </div>
                
                <img src="${qrCodeDataUrl}" alt="Print QR Code" class="qr-code" />
                
                <div class="instructions">
                  <h3>📱 Hoe te gebruiken:</h3>
                  <div class="steps">
                    <div class="step">1️⃣ Open <strong>Epson TM Utility</strong> app</div>
                    <div class="step">2️⃣ Ga naar <strong>QR Code Scanner</strong></div>
                    <div class="step">3️⃣ Scan deze QR code</div>
                    <div class="step">4️⃣ De printer zal automatisch de receipt afdrukken</div>
                  </div>
                </div>
                
                <div style="margin-top: 20px; font-size: 12px; color: #666;">
                  💡 Zorg dat je printer verbonden is en TM Utility draait
                </div>
              </div>
            </body>
          </html>
        `);
        qrWindow.document.close();
        
        toast({
          title: "QR Code Gegenereerd",
          description: "Scan met TM Utility app om af te drukken.",
          duration: 5000,
        });
      }
      
    } catch (error) {
      console.error('❌ QR code generation error:', error);
      toast({
        title: "QR Code Fout",
        description: "Kon QR code niet genereren.",
        variant: "destructive",
      });
    }
  }, [printerConfig, formatReceipt, toast]);

  return {
    isConnected,
    isSDKReady,
    printerConfig,
    setPrinterConfig,
    printTicket,
    generatePrintQR
  };
}