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

interface EpsonPrinterHook {
  isSDKReady: boolean;
  isConnecting: boolean;
  connectedPrinter: string | null;
  discoveredPrinters: any[];
  connectToPrinter: (ipAddress: string) => Promise<void>;
  printTicket: (order: Order | null, isTakeaway?: boolean, discountApplied?: boolean) => Promise<void>;
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
  const printTicket = useCallback(async (order: Order | null, isTakeaway = false, discountApplied = false): Promise<void> => {
    if (!device || !connectedPrinter) {
      throw new Error('No printer connected');
    }

    if (!order) {
      throw new Error('No order data');
    }

    try {
      console.log('🖨️ Creating print job...');
      
      const builder = new window.ePosPrint();
      
      // Initialize printer - Same format as copy receipt
      builder.addTextAlign(builder.ALIGN_CENTER);
      builder.addText("================================\n");
      builder.addTextStyle(false, false, true, builder.COLOR_1);
      builder.addText("         RESTAURANT RECEIPT\n");
      builder.addTextStyle(false, false, false, builder.COLOR_NONE);
      builder.addText("================================\n");
      
      // Order info
      builder.addTextAlign(builder.ALIGN_LEFT);
      const now = new Date();
      
      builder.addText(`${isTakeaway ? 'TAKEAWAY ORDER' : `TABLE ${order.tableId}`}\n`);
      builder.addText(`Date: ${now.toLocaleDateString()}\n`);
      builder.addText(`Time: ${now.toLocaleTimeString()}\n`);
      builder.addText('--------------------------------\n');
      
      // Items - Same format as copy receipt
      order.items.forEach(item => {
        builder.addText(`${item.menuItem.name}\n`);
        builder.addText(`  ${item.quantity} x €${item.menuItem.price.toFixed(2)} = €${(item.quantity * item.menuItem.price).toFixed(2)}\n`);
      });
      
      // Totals
      const subtotal = order.items.reduce((sum, item) => 
        sum + (item.menuItem.price * item.quantity), 0
      );
      const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
      const total = subtotal - discountAmount;
      
      builder.addText('--------------------------------\n');
      
      // Totals - Same format as copy receipt
      if (isTakeaway && discountApplied) {
        builder.addText(`Subtotal:           €${subtotal.toFixed(2)}\n`);
        builder.addText(`15% Discount:      -€${discountAmount.toFixed(2)}\n`);
        builder.addText('--------------------------------\n');
      }
      
      builder.addTextStyle(false, false, true, builder.COLOR_1);
      builder.addText(`TOTAL:              €${total.toFixed(2)}\n`);
      builder.addTextStyle(false, false, false, builder.COLOR_NONE);
      builder.addText("================================\n");
      
      // Footer
      builder.addTextAlign(builder.ALIGN_CENTER);
      builder.addText("        Thank you!\n");
      builder.addText("================================\n");
      
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

  return {
    isSDKReady,
    isConnecting,
    connectedPrinter,
    discoveredPrinters,
    connectToPrinter,
    printTicket,
    discoverPrinters,
    disconnect,
  };
}