import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, Wifi } from 'lucide-react';
import { useEpsonPrinter } from '@/hooks/useEpsonPrinter';
import { useMobilePrinter } from '@/hooks/useMobilePrinter';
import { PrinterNetworkScanner } from './PrinterNetworkScanner';
import { MobilePrinterStatus } from './MobilePrinterStatus';
import { PrinterDiagnostics } from './PrinterDiagnostics';

interface PrinterSetupProps {
  onSetupComplete?: () => void;
}

export function PrinterSetup({ onSetupComplete }: PrinterSetupProps) {
  const [ipAddress, setIpAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  
  const {
    isConnecting,
    isConfigured,
    printerIP,
    isMobile,
    setPrinterIP,
    testConnection,
    clearConfiguration
  } = useMobilePrinter();

  const handleSetup = async () => {
    if (!ipAddress.trim()) {
      setError('Please enter a valid IP address');
      return;
    }

    setError(null);
    
    try {
      await setPrinterIP(ipAddress.trim());
      onSetupComplete?.();
    } catch (error) {
      setError('Printer not reachable, check Wi-Fi or IP address');
    }
  };

  const handleTest = async () => {
    setError(null);
    
    try {
      const result = await testConnection();
      if (!result) {
        setError('Printer not reachable, check Wi-Fi or IP address');
      }
    } catch (error) {
      setError('Printer not reachable, check Wi-Fi or IP address');
    }
  };

  const handleClear = () => {
    clearConfiguration();
    setIpAddress('');
    setError(null);
  };

  const handlePrinterFound = (ip: string) => {
    setIpAddress(ip);
    setShowScanner(false);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <MobilePrinterStatus />
      
      {!isConfigured && (
        <PrinterDiagnostics />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Epson TM-m30III Setup {isMobile ? '(Mobile)' : '(Web)'}
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured ? (
          <div className="space-y-4">
            <Alert>
              <Wifi className="h-4 w-4" />
              <AlertDescription>
                Printer configured: {printerIP}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTest}
                disabled={isConnecting}
                variant="outline"
                className="flex-1"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test Connection'
                )}
              </Button>
              
              <Button 
                onClick={handleClear}
                variant="outline"
                className="flex-1"
              >
                Reconfigure
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {showScanner ? (
              <PrinterNetworkScanner onPrinterFound={handlePrinterFound} />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ip-address">Printer IP Address</Label>
                  <Input
                    id="ip-address"
                    type="text"
                    placeholder="e.g., 192.168.0.156"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSetup()}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your printer's IP address or scan the network to find it
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSetup}
                    disabled={isConnecting || !ipAddress.trim()}
                    className="flex-1"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect to Printer'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => setShowScanner(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    Scan Network
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Ensure your printer is on the same Wi-Fi network</p>
          <p>• Default port 8008 will be used</p>
          <p>• IP address will be saved for future use</p>
          <p>• {isMobile ? 'Using mobile HTTP requests' : 'Using Epson ePOS SDK'}</p>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}