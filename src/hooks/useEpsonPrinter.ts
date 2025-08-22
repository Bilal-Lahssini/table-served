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
    generateOrderQR
  };
}