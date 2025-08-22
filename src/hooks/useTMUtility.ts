import { useCallback } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types/pos';

export function useTMUtility() {
  const { toast } = useToast();

  const formatReceiptForTMUtility = useCallback((order: Order, isTakeaway = false, discountApplied = false): string => {
    const subtotal = order.items.reduce((sum, item) => 
      sum + (item.menuItem.price * item.quantity), 0
    );
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;
    
    const now = new Date();
    const date = now.toLocaleDateString('nl-NL');
    const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

    let receipt = '';
    
    // ESC/POS commands for TM Utility
    // Header - Center alignment and bold
    receipt += '\x1B\x61\x01'; // Center alignment
    receipt += '\x1B\x45\x01'; // Bold on
    receipt += "PEPE'S RESTAURANT\n";
    receipt += '\x1B\x45\x00'; // Bold off
    receipt += '================================\n';
    
    // Order info - Left alignment
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
    receipt += '\x1D\x56\x00'; // Cut paper
    
    return receipt;
  }, []);

  const openTMUtility = useCallback(async (order: Order, isTakeaway = false, discountApplied = false) => {
    try {
      const receiptData = formatReceiptForTMUtility(order, isTakeaway, discountApplied);
      
      if (Capacitor.isNativePlatform()) {
        // Try to open TM Utility app directly with custom URL scheme
        const tmUtilityUrl = `tmutility://print?data=${encodeURIComponent(receiptData)}`;
        
        try {
          // Use Browser.open for custom URL schemes on mobile
          await Browser.open({ url: tmUtilityUrl });
          
          toast({
            title: "🚀 TM Utility Geopend",
            description: "Scan de QR code in TM Utility om te printen",
            duration: 5000,
          });
        } catch (error) {
          // Fallback: Open app store if TM Utility not installed
          console.log('TM Utility not installed, opening App Store');
          
          const appStoreUrl = Capacitor.getPlatform() === 'ios' 
            ? 'https://apps.apple.com/app/tm-utility/id1057973615'
            : 'https://play.google.com/store/apps/details?id=jp.co.epson.epos2.tmutility';
            
          await Browser.open({ url: appStoreUrl });
          
          toast({
            title: "📲 TM Utility Installeren",
            description: "Installeer eerst TM Utility van de app store",
            duration: 6000,
          });
        }
      } else {
        // Web version - show QR code
        await showWebQRCode(receiptData, order, isTakeaway, discountApplied);
      }
    } catch (error) {
      console.error('Error opening TM Utility:', error);
      toast({
        title: "❌ Fout",
        description: "Kon TM Utility niet openen",
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [formatReceiptForTMUtility, toast]);

  const showWebQRCode = useCallback(async (receiptData: string, order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    // For web version, create a simple QR code display
    const qrWindow = window.open('', '_blank', 'width=500,height=700,scrollbars=yes');
    if (qrWindow) {
      // Create a simple text-based "QR code" for web
      const displayData = receiptData.substring(0, 200) + '...'; // Truncate for display
      
      qrWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>TM Utility Data</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: #f5f5f5;
              text-align: center;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              max-width: 400px;
              margin: 0 auto;
            }
            .data-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              white-space: pre-line;
              margin: 20px 0;
              border: 2px solid #e0e0e0;
            }
            .instructions {
              background: #e3f2fd;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              text-align: left;
            }
            .btn {
              background: #1976d2;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              margin: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>📱 TM Utility Print Data</h2>
            
            <div class="instructions">
              <strong>Voor Mobiele App:</strong><br>
              1. Open TM Utility app<br>
              2. Scan QR code functie<br>
              3. Print direct naar Epson TM-m30III
            </div>
            
            <div class="data-box">${displayData}</div>
            
            <button class="btn" onclick="copyToClipboard()">
              📋 Copy Data
            </button>
            <button class="btn" onclick="window.print()">
              🖨️ Print Preview  
            </button>
          </div>
          
          <script>
            function copyToClipboard() {
              const data = \`${receiptData}\`;
              navigator.clipboard.writeText(data).then(() => {
                alert('Print data gekopieerd!');
              });
            }
          </script>
        </body>
        </html>
      `);
      qrWindow.document.close();
      
      toast({
        title: "📄 Print Data Getoond",
        description: "Gebruik TM Utility app om te printen",
        duration: 5000,
      });
    }
  }, [toast]);

  return {
    openTMUtility,
    formatReceiptForTMUtility
  };
}