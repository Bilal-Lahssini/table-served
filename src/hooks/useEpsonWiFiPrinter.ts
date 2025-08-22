import { useState, useCallback, useEffect } from 'react';
import { Order } from '@/types/pos';

interface EpsonPrinter {
  ip: string;
  port: number;
  deviceId?: string;
  status?: string;
}

interface EpsonWiFiPrinterHook {
  isConnected: boolean;
  isConnecting: boolean;
  isDiscovering: boolean;
  connectedPrinter: EpsonPrinter | null;
  discoveredPrinters: EpsonPrinter[];
  connectAndPrint: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
  discoverPrinters: () => Promise<void>;
  connectToPrinter: (printer: EpsonPrinter) => Promise<void>;
}

export function useEpsonWiFiPrinter(): EpsonWiFiPrinterHook {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [connectedPrinter, setConnectedPrinter] = useState<EpsonPrinter | null>(null);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<EpsonPrinter[]>([]);

  // Auto-discover printers on first load
  useEffect(() => {
    const startDiscovery = async () => {
      console.log('=== Starting Epson Printer Discovery ===');
      setIsDiscovering(true);
      const found: EpsonPrinter[] = [];
      
      try {
        const ranges = [
          '192.168.1', '192.168.0', '192.168.2', '192.168.100',
          '10.0.0', '10.0.1', '172.16.0', '172.16.1'
        ];
        
        const ips: string[] = [];
        ranges.forEach(range => {
          for (let i = 1; i < 50; i++) {
            ips.push(`${range}.${i}`);
          }
        });
        
        const commonPorts = [8008, 9100, 631];
        console.log(`Scanning ${ips.length} IP addresses with ports:`, commonPorts);
        
        const batchSize = 5;
        let totalTested = 0;
        
        for (let i = 0; i < ips.length; i += batchSize) {
          const batch = ips.slice(i, i + batchSize);
          console.log(`Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(ips.length/batchSize)}: ${batch.join(', ')}`);
          
          const promises = batch.flatMap(ip =>
            commonPorts.map(async port => {
              console.log(`Testing ${ip}:${port}...`);
              
              // Simple connection test
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                await fetch(`http://${ip}:${port}/`, { 
                  method: 'GET',
                  signal: controller.signal,
                  mode: 'no-cors'
                });
                
                clearTimeout(timeoutId);
                console.log(`✓ FOUND PRINTER at ${ip}:${port}`);
                totalTested++;
                return { ip, port };
              } catch (error) {
                totalTested++;
                return null;
              }
            })
          );
          
          const results = await Promise.all(promises);
          results.forEach(result => {
            if (result && !found.some(p => p.ip === result.ip && p.port === result.port)) {
              found.push(result);
            }
          });
          
          // Auto-connect to first found printer
          if (found.length > 0 && !isConnected) {
            const firstPrinter = found[0];
            console.log(`🔗 Auto-connecting to first found printer: ${firstPrinter.ip}:${firstPrinter.port}`);
            
            setConnectedPrinter(firstPrinter);
            setIsConnected(true);
            localStorage.setItem('epson_printer', JSON.stringify(firstPrinter));
            console.log(`Connected to printer: ${firstPrinter.ip}:${firstPrinter.port}`);
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        setDiscoveredPrinters(found);
        console.log(`=== Discovery Complete ===`);
        console.log(`Tested: ${totalTested} connections`);
        console.log(`Found: ${found.length} printers`);
        
        if (found.length === 0) {
          console.log('No printers found. Make sure your Epson TM-m30III is connected to the same Wi-Fi network.');
        }
        
      } catch (error) {
        console.error('=== Discovery Failed ===', error);
      } finally {
        setIsDiscovering(false);
      }
    };
    
    const savedPrinter = localStorage.getItem('epson_printer');
    if (savedPrinter) {
      try {
        const printer = JSON.parse(savedPrinter) as EpsonPrinter;
        setConnectedPrinter(printer);
        setIsConnected(true);
        console.log('Loaded saved printer:', printer);
      } catch (error) {
        console.error('Failed to load saved printer:', error);
        localStorage.removeItem('epson_printer');
        startDiscovery();
      }
    } else {
      console.log('No saved printer found, starting discovery...');
      startDiscovery();
    }
  }, []);

  const testPrinterConnection = useCallback(async (ip: string, port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const timeout = 2000;
      
      // For Epson printers, try to connect via fetch with a simple request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Try common Epson printer endpoints
      const testEndpoints = [
        `http://${ip}:${port}/`,
        `http://${ip}:${port}/status`,
        `http://${ip}:${port}/cgi-bin/epos/service.cgi`
      ];
      
      Promise.race(
        testEndpoints.map(endpoint =>
          fetch(endpoint, { 
            method: 'GET',
            signal: controller.signal,
            mode: 'no-cors' // Allow cross-origin for printer detection
          }).then(() => true).catch(() => false)
        )
      ).then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      }).catch(() => {
        clearTimeout(timeoutId);
        resolve(false);
      });
    });
  }, []);

  const getLocalIPRange = useCallback((): string[] => {
    // Generate common IP ranges for scanning
    const ranges = [
      '192.168.1', '192.168.0', '192.168.2', '192.168.100',
      '10.0.0', '10.0.1', '172.16.0', '172.16.1'
    ];
    
    const ips: string[] = [];
    ranges.forEach(range => {
      // Scan a smaller range for faster discovery
      for (let i = 1; i < 50; i++) {
        ips.push(`${range}.${i}`);
      }
    });
    
    return ips;
  }, []);

  const discoverPrinters = useCallback(async () => {
    console.log('=== Starting Epson Printer Discovery ===');
    setIsDiscovering(true);
    const found: EpsonPrinter[] = [];
    
    try {
      const ips = getLocalIPRange();
      const commonPorts = [8008, 9100, 631]; // Epson TM-m30III uses port 8008
      
      console.log(`Scanning ${ips.length} IP addresses with ports:`, commonPorts);
      
      // Test connections in smaller batches for better performance
      const batchSize = 5;
      let totalTested = 0;
      
      for (let i = 0; i < ips.length; i += batchSize) {
        const batch = ips.slice(i, i + batchSize);
        console.log(`Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(ips.length/batchSize)}: ${batch.join(', ')}`);
        
        const promises = batch.flatMap(ip =>
          commonPorts.map(async port => {
            console.log(`Testing ${ip}:${port}...`);
            const isReachable = await testPrinterConnection(ip, port);
            totalTested++;
            
            if (isReachable) {
              console.log(`✓ FOUND PRINTER at ${ip}:${port}`);
              return { ip, port };
            }
            return null;
          })
        );
        
        const results = await Promise.all(promises);
        results.forEach(result => {
          if (result && !found.some(p => p.ip === result.ip && p.port === result.port)) {
            found.push(result);
          }
        });
        
        // Auto-connect to first found printer if none is connected
        if (found.length > 0 && !isConnected) {
          const firstPrinter = found[0];
          console.log(`🔗 Auto-connecting to first found printer: ${firstPrinter.ip}:${firstPrinter.port}`);
          
          // Set the printer directly without the circular dependency
          setConnectedPrinter(firstPrinter);
          setIsConnected(true);
          localStorage.setItem('epson_printer', JSON.stringify(firstPrinter));
          console.log(`Connected to printer: ${firstPrinter.ip}:${firstPrinter.port}`);
          break;
        }
        
        // Short delay between batches to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setDiscoveredPrinters(found);
      console.log(`=== Discovery Complete ===`);
      console.log(`Tested: ${totalTested} connections`);
      console.log(`Found: ${found.length} printers`);
      
      if (found.length === 0) {
        console.log('No printers found. Make sure your Epson TM-m30III is connected to the same Wi-Fi network.');
      }
      
    } catch (error) {
      console.error('=== Discovery Failed ===', error);
    } finally {
      setIsDiscovering(false);
    }
  }, [getLocalIPRange, testPrinterConnection, isConnected]);

  const connectToPrinter = useCallback(async (printer: EpsonPrinter) => {
    setIsConnecting(true);
    
    try {
      // Test connection before setting as active
      const isReachable = await testPrinterConnection(printer.ip, printer.port);
      
      if (!isReachable) {
        throw new Error(`Printer at ${printer.ip}:${printer.port} is not reachable`);
      }
      
      setConnectedPrinter(printer);
      setIsConnected(true);
      
      // Save to localStorage for future use
      localStorage.setItem('epson_printer', JSON.stringify(printer));
      
      console.log(`Connected to printer: ${printer.ip}:${printer.port}`);
      
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [testPrinterConnection]);

  const formatESCPOSReceipt = useCallback((order: Order, isTakeaway: boolean, discountApplied: boolean): string => {
    const ESC = '\x1B';
    const GS = '\x1D';
    
    // ESC/POS Commands
    const INIT = ESC + '@'; // Initialize printer
    const BOLD_ON = ESC + 'E' + '\x01';
    const BOLD_OFF = ESC + 'E' + '\x00';
    const CENTER = ESC + 'a' + '\x01';
    const LEFT = ESC + 'a' + '\x00';
    const CUT = GS + 'V' + 'A' + '\x03'; // Partial cut
    
    let receipt = INIT;
    
    // Header
    receipt += CENTER + BOLD_ON;
    receipt += 'ORDER OVERVIEW\n';
    receipt += '================================\n';
    receipt += BOLD_OFF + LEFT;
    
    // Order details
    receipt += '\n';
    receipt += `${isTakeaway ? 'TAKEAWAY ORDER' : `TABLE ${order.tableId}`}\n`;
    receipt += `Date: ${new Date().toLocaleDateString()}\n`;
    receipt += `Time: ${new Date().toLocaleTimeString()}\n`;
    receipt += '--------------------------------\n';
    
    // Items
    order.items.forEach((item) => {
      receipt += `${item.menuItem.name}\n`;
      receipt += `  ${item.quantity}x €${item.menuItem.price.toFixed(2)} = €${(item.quantity * item.menuItem.price).toFixed(2)}\n`;
      receipt += '--------------------------------\n';
    });
    
    // Totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;
    
    if (discountAmount > 0) {
      receipt += `Subtotal: €${subtotal.toFixed(2)}\n`;
      receipt += `Discount (15%): -€${discountAmount.toFixed(2)}\n`;
      receipt += '--------------------------------\n';
    }
    
    receipt += BOLD_ON;
    receipt += `TOTAL: €${total.toFixed(2)}\n`;
    receipt += BOLD_OFF;
    
    receipt += '================================\n';
    receipt += CENTER + 'Thank you!\n';
    receipt += LEFT + '\n\n\n';
    receipt += CUT;
    
    return receipt;
  }, []);

  const sendToPrinter = useCallback(async (receiptData: string, printer: EpsonPrinter) => {
    try {
      // Use raw socket connection for ESC/POS printing
      const response = await fetch(`http://${printer.ip}:${printer.port}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: receiptData,
      });
      
      if (!response.ok) {
        throw new Error(`Printer responded with status: ${response.status}`);
      }
      
      console.log('Receipt sent successfully');
      
    } catch (error) {
      console.error('Failed to send to printer:', error);
      
      // Fallback: Try alternative printing method
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`<pre>${receiptData.replace(/\x1B|\x1D/g, '')}</pre>`);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }
      } catch (fallbackError) {
        console.error('Fallback printing failed:', fallbackError);
        throw new Error('Printer not reachable, check Wi-Fi or IP');
      }
    }
  }, []);

  const connectAndPrint = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    if (!connectedPrinter) {
      // Try to discover and connect automatically
      await discoverPrinters();
      
      if (!connectedPrinter) {
        throw new Error('No printer found. Please ensure Epson printer is connected to Wi-Fi.');
      }
    }
    
    try {
      const receiptData = formatESCPOSReceipt(order, isTakeaway, discountApplied);
      await sendToPrinter(receiptData, connectedPrinter);
      
    } catch (error) {
      // If printing fails, try to reconnect
      setIsConnected(false);
      setConnectedPrinter(null);
      localStorage.removeItem('epson_printer');
      
      console.error('Print operation failed:', error);
      throw error;
    }
  }, [connectedPrinter, discoverPrinters, formatESCPOSReceipt, sendToPrinter]);

  return {
    isConnected,
    isConnecting,
    isDiscovering,
    connectedPrinter,
    discoveredPrinters,
    connectAndPrint,
    discoverPrinters,
    connectToPrinter,
  };
}