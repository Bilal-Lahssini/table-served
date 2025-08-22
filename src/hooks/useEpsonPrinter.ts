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
  isConnecting: boolean;
  connectedPrinter: string | null;
  discoveredPrinters: any[];
  connectToPrinter: (ipAddress: string) => Promise<void>;
  printTicket: (order: Order, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
  generateOrderQR: (order: Order, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
  discoverPrinters: () => void;
  disconnect: () => void;
}

export function useEpsonPrinter(): EpsonPrinterHook {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedPrinter, setConnectedPrinter] = useState<string | null>(null);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<any[]>([]);
  const [device, setDevice] = useState<any>(null);
  const { toast } = useToast();

  // Check SDK readiness
  useEffect(() => {
    const checkSDK = () => {
      if (window.ePosPrint && window.ePosDev && window.ePosDiscovery) {
        console.log('✅ ePOS SDK ready');
        setIsSDKReady(true);
      } else {
        console.log('⏳ Waiting for ePOS SDK...');
        setTimeout(checkSDK, 500);
      }
    };

    checkSDK();
  }, []);

  // Discover printers
  const discoverPrinters = useCallback(() => {
    if (!isSDKReady) return;
    
    console.log('🔍 Discovering printers...');
    setDiscoveredPrinters([]);
    
    const discovery = new window.ePosDiscovery();
    discovery.onreceive = (deviceInfo: any) => {
      console.log('Found printer:', deviceInfo);
      setDiscoveredPrinters(prev => [...prev, deviceInfo]);
    };
    
    discovery.start();
    
    setTimeout(() => {
      discovery.stop();
    }, 10000); // Stop after 10 seconds
  }, [isSDKReady]);

  // Connect to printer
  const connectToPrinter = useCallback(async (ipAddress: string): Promise<void> => {
    if (!isSDKReady) {
      throw new Error('SDK not ready');
    }

    setIsConnecting(true);
    
    try {
      const newDevice = new window.ePosDev();
      
      return new Promise((resolve, reject) => {
        newDevice.connect(ipAddress, 9100, (result: string) => {
          if (result === 'SUCCESS' || result === 'FAIL_CONNECT') {
            // Even if connection "fails" (browser limitation), we'll store the device
            // The actual connection test will happen when we try to print
            setDevice(newDevice);
            setConnectedPrinter(ipAddress);
            console.log(`📡 Printer configured for ${ipAddress} (will test on print)`);
            
            toast({
              title: "Printer Configured",
              description: `Ready to print to ${ipAddress}`,
              duration: 3000,
            });
            
            resolve();
          } else {
            console.error(`❌ Configuration failed: ${result}`);
            
            toast({
              title: "Configuration Failed",
              description: `Could not configure printer ${ipAddress}`,
              variant: "destructive",
              duration: 4000,
            });
            
            reject(new Error(`Configuration failed: ${result}`));
          }
          setIsConnecting(false);
        });
      });
    } catch (error) {
      setIsConnecting(false);
      throw error;
    }
  }, [isSDKReady, toast]);

  // Disconnect from printer
  const disconnect = useCallback(() => {
    if (device) {
      device.disconnect();
      setDevice(null);
      setConnectedPrinter(null);
      
      toast({
        title: "Printer Losgekoppeld",
        description: "Verbinding met printer beëindigd",
        duration: 2000,
      });
    }
  }, [device, toast]);

  // Print ticket using ePOS SDK
  const printTicket = useCallback(async (order: Order, isTakeaway = false, discountApplied = false): Promise<void> => {
    if (!device || !connectedPrinter) {
      throw new Error('No printer connected');
    }

    try {
      console.log('🖨️ Creating print job...');
      
      const builder = new window.ePosPrint();
      
      // Initialize printer
      builder.addTextAlign(builder.ALIGN_CENTER);
      builder.addTextSize(2, 2);
      builder.addTextStyle(false, false, true, builder.COLOR_1);
      builder.addText("PEPE'S RESTAURANT\n");
      builder.addTextStyle(false, false, false, builder.COLOR_NONE);
      builder.addTextSize(1, 1);
      builder.addText("================================\n");
      
      // Order info
      builder.addTextAlign(builder.ALIGN_LEFT);
      const now = new Date();
      const date = now.toLocaleDateString('nl-NL');
      const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      
      builder.addText(`Datum: ${date}  Tijd: ${time}\n`);
      builder.addText(`Bestelling: ${isTakeaway ? 'AFHAAL' : `TAFEL ${order.tableId}`}\n`);
      builder.addText(`Order ID: ${order.id.substring(0, 8)}\n`);
      builder.addText('--------------------------------\n\n');
      
      // Items
      builder.addTextStyle(false, false, true, builder.COLOR_1);
      builder.addText('BESTELLING:\n');
      builder.addTextStyle(false, false, false, builder.COLOR_NONE);
      
      order.items.forEach(item => {
        const itemTotal = item.menuItem.price * item.quantity;
        builder.addText(`${item.quantity}x ${item.menuItem.name}\n`);
        builder.addText(`   €${item.menuItem.price.toFixed(2)} x ${item.quantity} = €${itemTotal.toFixed(2)}\n`);
        if (item.notes) {
          builder.addText(`   Notitie: ${item.notes}\n`);
        }
        builder.addText('\n');
      });
      
      // Totals
      const subtotal = order.items.reduce((sum, item) => 
        sum + (item.menuItem.price * item.quantity), 0
      );
      const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
      const total = subtotal - discountAmount;
      
      builder.addText('--------------------------------\n');
      if (isTakeaway && discountApplied) {
        builder.addText(`Subtotaal:          €${subtotal.toFixed(2)}\n`);
        builder.addText(`15% Korting:       -€${discountAmount.toFixed(2)}\n`);
        builder.addText('--------------------------------\n');
      }
      
      builder.addTextStyle(false, false, true, builder.COLOR_1);
      builder.addText(`TOTAAL:            €${total.toFixed(2)}\n`);
      builder.addTextStyle(false, false, false, builder.COLOR_NONE);
      
      // Footer
      builder.addFeedLine(2);
      builder.addTextAlign(builder.ALIGN_CENTER);
      builder.addText('Bedankt voor uw bezoek!\n');
      builder.addText('Tot ziens!\n');
      
      // Cut paper
      builder.addFeedLine(3);
      builder.addCut(builder.CUT_FEED);
      
      // Send to printer
      return new Promise((resolve, reject) => {
        device.send(builder, 10000, (result: any) => {
          if (result.success) {
            console.log('✅ Print successful');
            
            toast({
              title: "Print Succesvol",
              description: `Bonnetje afgedrukt op ${connectedPrinter}`,
              duration: 4000,
            });
            
            resolve();
          } else {
            console.error('❌ Print failed:', result);
            
            toast({
              title: "Print Fout", 
              description: `Print mislukt: ${result.code}`,
              variant: "destructive",
              duration: 4000,
            });
            
            reject(new Error(`Print failed: ${result.code}`));
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Print error:', error);
      toast({
        title: "Print Fout",
        description: "Er is een fout opgetreden bij het printen",
        variant: "destructive",
        duration: 4000,
      });
      throw error;
    }
  }, [device, connectedPrinter, toast]);

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
    isConnecting,
    connectedPrinter,
    discoveredPrinters,
    connectToPrinter,
    printTicket,
    generateOrderQR,
    discoverPrinters,
    disconnect
  };
}