import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wifi, CheckCircle, XCircle } from 'lucide-react';

interface PrinterCandidate {
  ip: string;
  status: 'scanning' | 'found' | 'failed';
}

interface PrinterNetworkScannerProps {
  onPrinterFound: (ip: string) => void;
}

export function PrinterNetworkScanner({ onPrinterFound }: PrinterNetworkScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [candidates, setCandidates] = useState<PrinterCandidate[]>([]);
  const [foundPrinters, setFoundPrinters] = useState<string[]>([]);

  // Check if SDK is loaded
  const isSDKLoaded = () => {
    return typeof window !== 'undefined' && 
           !!window.epson && 
           !!window.epson.ePOSPrint;
  };

  // Test a single IP address
  const testPrinterIP = useCallback(async (ip: string): Promise<boolean> => {
    if (!isSDKLoaded()) return false;

    return new Promise((resolve) => {
      try {
        const printer = new window.epson.ePOSPrint(`http://${ip}:8008/cgi-bin/epos/service.cgi?devid=local_printer&timeout=3000`);
        
        printer.timeout = 3000;
        let resolved = false;
        
        const cleanup = () => {
          if (!resolved) {
            resolved = true;
            try {
              printer.close();
            } catch {}
          }
        };
        
        printer.onreceive = (response) => {
          cleanup();
          resolve(response.success || false);
        };
        
        printer.onerror = () => {
          cleanup();
          resolve(false);
        };

        // Timeout fallback
        setTimeout(() => {
          cleanup();
          resolve(false);
        }, 3500);

        printer.open();
        printer.send();
      } catch {
        resolve(false);
      }
    });
  }, []);

  // Generate IP addresses to scan based on current network
  const generateScanIPs = (): string[] => {
    const ips: string[] = [];
    
    // Get current IP range (assuming 192.168.0.x or 192.168.1.x)
    const commonRanges = ['192.168.0', '192.168.1', '10.0.0', '172.16.0'];
    
    commonRanges.forEach(range => {
      // Scan common printer IP addresses
      for (let i = 100; i <= 200; i++) {
        ips.push(`${range}.${i}`);
      }
    });
    
    // Add user's mentioned IPs
    ips.push('172.16.10.1', '192.168.0.156');
    
    return ips;
  };

  const scanNetwork = useCallback(async () => {
    if (!isSDKLoaded()) {
      alert('Epson SDK not loaded. Please refresh the page.');
      return;
    }

    setIsScanning(true);
    setCandidates([]);
    setFoundPrinters([]);

    const ipsToScan = generateScanIPs();
    const initialCandidates = ipsToScan.map(ip => ({ ip, status: 'scanning' as const }));
    setCandidates(initialCandidates);

    // Scan in batches to avoid overwhelming the network
    const batchSize = 10;
    const found: string[] = [];

    for (let i = 0; i < ipsToScan.length; i += batchSize) {
      const batch = ipsToScan.slice(i, i + batchSize);
      
      const promises = batch.map(async (ip) => {
        try {
          const result = await testPrinterIP(ip);
          
          setCandidates(prev => 
            prev.map(candidate => 
              candidate.ip === ip 
                ? { ...candidate, status: result ? 'found' : 'failed' }
                : candidate
            )
          );

          if (result) {
            found.push(ip);
            setFoundPrinters(prev => [...prev, ip]);
          }
        } catch (error) {
          setCandidates(prev => 
            prev.map(candidate => 
              candidate.ip === ip 
                ? { ...candidate, status: 'failed' }
                : candidate
            )
          );
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < ipsToScan.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsScanning(false);
  }, [testPrinterIP]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Network Printer Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSDKLoaded() && (
          <Alert variant="destructive">
            <AlertDescription>
              Epson ePOS SDK not loaded. Please refresh the page.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Button 
            onClick={scanNetwork}
            disabled={isScanning || !isSDKLoaded()}
            className="w-full"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning Network...
              </>
            ) : (
              'Scan for Epson Printers'
            )}
          </Button>

          {foundPrinters.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Found Printers:</h4>
              {foundPrinters.map(ip => (
                <div key={ip} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-mono">{ip}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onPrinterFound(ip)}
                  >
                    Use This Printer
                  </Button>
                </div>
              ))}
            </div>
          )}

          {isScanning && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <h4 className="font-medium text-sm">Scanning Progress:</h4>
              {candidates.filter(c => c.status !== 'failed').map(candidate => (
                <div key={candidate.ip} className="flex items-center gap-2 text-sm">
                  {candidate.status === 'scanning' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {candidate.status === 'found' && <CheckCircle className="h-3 w-3 text-green-500" />}
                  <span className="font-mono">{candidate.ip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• This will scan common IP ranges for Epson printers</p>
          <p>• Make sure your printer is powered on and connected to Wi-Fi</p>
          <p>• The scan may take a few minutes to complete</p>
        </div>
      </CardContent>
    </Card>
  );
}