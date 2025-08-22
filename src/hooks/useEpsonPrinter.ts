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

interface EpsonPrinterHook {
  isSDKReady: boolean;
  printTicket: (order: Order, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
  generateOrderQR: (order: Order, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
}

export function useEpsonPrinter(): EpsonPrinterHook {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const { toast } = useToast();

  // Check SDK readiness
  useEffect(() => {
    const checkSDK = () => {
      setIsSDKReady(true); // Always ready for browser printing
    };

    checkSDK();
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
    try {
      console.log('🖨️ Preparing receipt for printing...');
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
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
          
          toast({
            title: "AirPrint Geopend",
            description: "Selecteer je printer voor afdrukken.",
            duration: 3000,
          });
        }
        
      } else {
        // Desktop/Android: Use iframe printing for system printers
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
              title: "Print Dialog Geopend",
              description: "Selecteer je printer in het dialoog.",
              duration: 4000,
            });
          }, 100);
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
  }, [formatReceipt, toast]);

  const generateOrderQR = useCallback(async (order: Order, isTakeaway = false, discountApplied = false): Promise<void> => {
    try {
      console.log('📱 Generating TM Utility compatible QR code...');
      
      const receiptData = formatReceipt(order, isTakeaway, discountApplied);
      
      // TM Utility expects plain ESC/POS commands as text in the QR code
      // The app will interpret these commands and send them to the printer
      const qrData = receiptData;
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Display QR code in a popup window
      const qrWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      if (qrWindow) {
        qrWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Order QR Code</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  color: white;
                }
                .container {
                  background: white;
                  padding: 30px;
                  border-radius: 16px;
                  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                  text-align: center;
                  max-width: 500px;
                  color: #333;
                }
                .qr-code {
                  margin: 20px 0;
                  border: 3px solid #f0f0f0;
                  border-radius: 12px;
                  padding: 15px;
                  background: white;
                }
                .order-info {
                  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 12px;
                  margin-bottom: 20px;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .instructions {
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 12px;
                  border-left: 4px solid #28a745;
                  margin-top: 20px;
                }
                .steps {
                  text-align: left;
                  margin-top: 15px;
                }
                .step {
                  margin: 12px 0;
                  padding: 8px 0;
                  border-bottom: 1px solid #eee;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                }
                .step-number {
                  background: #28a745;
                  color: white;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: bold;
                }
                h1 {
                  margin-bottom: 10px;
                  color: #333;
                }
                h2 {
                  margin-bottom: 10px;
                  font-size: 18px;
                }
                h3 {
                  color: #28a745;
                  margin-bottom: 10px;
                }
                .demo-note {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  color: #856404;
                  padding: 15px;
                  border-radius: 8px;
                  margin-top: 15px;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>📱 Order QR Code</h1>
                
                 <div class="order-info">
                   <h2>Order #${order.id.substring(0, 8)}</h2>
                   <div>${isTakeaway ? '🥡 Afhaal Bestelling' : '🪑 Tafel ' + order.tableId}</div>
                   <div>📦 ${order.items.length} items - €${(order.items.reduce((sum, item) => {
                     const subtotal = sum + (item.menuItem.price * item.quantity);
                     const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
                     return subtotal - discountAmount;
                   }, 0)).toFixed(2)}</div>
                   ${discountApplied ? '<div>🏷️ 15% Korting Toegepast</div>' : ''}
                 </div>
                 
                 <img src="${qrCodeDataUrl}" alt="Order QR Code" class="qr-code" />
                 
                 <div class="instructions">
                   <h3>🖨️ TM Utility Compatible QR Code</h3>
                   <div class="steps">
                     <div class="step">
                       <div class="step-number">1</div>
                       <div>Open de TM Utility app op je telefoon</div>
                     </div>
                     <div class="step">
                       <div class="step-number">2</div>
                       <div>Scan deze QR code met de TM Utility app</div>
                     </div>
                     <div class="step">
                       <div class="step-number">3</div>
                       <div>Selecteer je Epson printer in de app</div>
                     </div>
                     <div class="step">
                       <div class="step-number">4</div>
                       <div>De bonnetje wordt direct naar de printer gestuurd</div>
                     </div>
                   </div>
                   
                   <div class="demo-note">
                     🖨️ <strong>TM Utility:</strong> Deze QR code bevat ESC/POS printer commando's die de TM Utility app direct kan verwerken en naar de printer sturen!
                   </div>
                </div>
              </div>
            </body>
          </html>
        `);
        qrWindow.document.close();
        
        toast({
          title: "Order QR Code Gegenereerd",
          description: "QR code bevat volledige order informatie voor demonstratie.",
          duration: 5000,
        });
      }
      
    } catch (error) {
      console.error('❌ QR code generation error:', error);
      toast({
        title: "QR Code Fout",
        description: "Kon order QR code niet genereren.",
        variant: "destructive",
      });
    }
  }, [formatReceipt, toast]);

  return {
    isSDKReady,
    printTicket,
    generateOrderQR
  };
}