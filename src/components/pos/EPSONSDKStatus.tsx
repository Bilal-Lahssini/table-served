import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Wifi } from 'lucide-react';
import { epsonSDK } from '@/utils/epsonSDK';
import { useToast } from '@/hooks/use-toast';

export function EPSONSDKStatus() {
  const [sdkStatus, setSDKStatus] = useState(epsonSDK.getSDKStatus());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = () => {
      setSDKStatus(epsonSDK.getSDKStatus());
    };

    // Check status every 2 seconds
    const interval = setInterval(checkStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleManualLoad = async () => {
    setIsLoading(true);
    try {
      await epsonSDK.loadSDKManually();
      await epsonSDK.waitForSDK();
      
      toast({
        title: "SDK Geladen",
        description: "Epson ePOS SDK is succesvol handmatig geladen",
      });
      
      setSDKStatus(epsonSDK.getSDKStatus());
    } catch (error) {
      toast({
        title: "SDK Laad Fout",
        description: `Kon SDK niet laden: ${error instanceof Error ? error.message : 'Onbekende fout'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (sdkStatus.available) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (sdkStatus.error) return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (sdkStatus.available) return "SDK Beschikbaar";
    if (sdkStatus.error) return "SDK Laad Fout";
    if (sdkStatus.loaded) return "SDK Geladen (wachten...)";
    return "SDK Niet Geladen";
  };

  const getStatusColor = () => {
    if (sdkStatus.available) return "default";
    if (sdkStatus.error) return "destructive";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wifi className="h-4 w-4" />
          Epson ePOS SDK Status
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm">{getStatusText()}</span>
          </div>
          <Badge variant={getStatusColor() as any} className="text-xs">
            {sdkStatus.available ? 'OK' : sdkStatus.error ? 'FOUT' : 'WACHT'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Geladen:</span>
            <span>{sdkStatus.loaded ? '✅' : '❌'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Window.epos:</span>
            <span>{sdkStatus.windowEpos ? '✅' : '❌'}</span>
          </div>
        </div>

        {sdkStatus.error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Het Epson ePOS SDK kon niet worden geladen van de CDN. 
              Dit kan komen door netwerk problemen of firewall blokkering.
            </AlertDescription>
          </Alert>
        )}

        {!sdkStatus.available && (
          <Button
            onClick={handleManualLoad}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'SDK Laden...' : 'Handmatig Laden'}
          </Button>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>WiFi Printing:</strong></p>
          <p>• Epson SDK vereist voor WiFi printing</p>
          <p>• Alternatief: gebruik Bluetooth printing</p>
        </div>
      </CardContent>
    </Card>
  );
}