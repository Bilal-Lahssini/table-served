import { useState, useCallback } from 'react';
import { Order } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

interface TCPPrinterHook {
  isConnecting: boolean;
  printViaESCPOS: (
    order: Order, 
    isTakeaway?: boolean, 
    discountApplied?: boolean,
    qrContent?: string,
    printerIP?: string
  ) => Promise<void>;
}

export function useTCPPrinter(): TCPPrinterHook {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const formatReceiptForTCP = useCallback((order: Order, isTakeaway = false, discountApplied = false): string => {
    const subtotal = order.items.reduce((sum, item) => 
      sum + (item.menuItem.price * item.quantity), 0
    );
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;
    
    const now = new Date();
    const date = now.toLocaleDateString('nl-NL');
    const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

    let receipt = '';
    
    // Order info (left aligned)
    receipt += '\x1B\x61\x00'; // Left alignment
    receipt += `Datum: ${date}  Tijd: ${time}\n`;
    receipt += `Bestelling: ${isTakeaway ? 'AFHAAL' : `TAFEL ${order.tableId}`}\n`;
    receipt += `Order ID: ${order.id.substring(0, 8)}\n`;
    receipt += '--------------------------------\n\n';
    
    // Items
    receipt += '\x1B\x45\x01BESTELLING:\x1B\x45\x00\n';
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
    
    return receipt;
  }, []);

  const printViaESCPOS = useCallback(async (
    order: Order, 
    isTakeaway = false, 
    discountApplied = false,
    qrContent?: string,
    printerIP = '192.168.0.156'
  ): Promise<void> => {
    setIsConnecting(true);
    
    try {
      console.log(`🖨️ Sending TCP/IP print job to ${printerIP}...`);
      
      const receiptData = formatReceiptForTCP(order, isTakeaway, discountApplied);
      
      // Call Supabase Edge Function for TCP printing
      const response = await fetch('/functions/v1/tcp-print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerIP,
          receiptData,
          qrContent
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ TCP Print successful:', result.message);
        toast({
          title: "Print Succesvol",
          description: `Bonnetje verzonden naar printer ${printerIP}`,
          duration: 4000,
        });
      } else {
        console.error('❌ TCP Print failed:', result.error);
        
        let errorMessage = result.message || 'Unknown error occurred';
        if (result.error === 'Printer unavailable') {
          errorMessage = `Printer niet bereikbaar op ${printerIP}:9100. Controleer netwerk verbinding en printer status.`;
        }
        
        toast({
          title: "Print Fout",
          description: errorMessage,
          variant: "destructive",
          duration: 6000,
        });
      }
      
    } catch (error) {
      console.error('❌ TCP Print request error:', error);
      toast({
        title: "Netwerk Fout",
        description: "Kon print server niet bereiken. Controleer internetverbinding.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [formatReceiptForTCP, toast]);

  return {
    isConnecting,
    printViaESCPOS
  };
}