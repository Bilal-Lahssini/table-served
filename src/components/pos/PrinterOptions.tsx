import { useState } from 'react';
import { Order } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bluetooth, Wifi, Smartphone, Monitor, Printer } from 'lucide-react';
import { useUnifiedPrinter } from '@/hooks/useUnifiedPrinter';
import { useToast } from '@/hooks/use-toast';
import { EPSONBLEScanner } from './EPSONBLEScanner';
import { EPSONSDKStatus } from './EPSONSDKStatus';
import { BleDevice } from '@capacitor-community/bluetooth-le';


interface PrinterOptionsProps {
  order: Order;
  isTakeaway?: boolean;
  discountApplied?: boolean;
}

export function PrinterOptions({ order, isTakeaway = false, discountApplied = false }: PrinterOptionsProps) {
  const [printerIP, setPrinterIP] = useState('192.168.1.100');
  const [isWiFiPrinting, setIsWiFiPrinting] = useState(false);
  const [selectedBLEDevice, setSelectedBLEDevice] = useState<BleDevice | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  
  const {
    connectAndPrint,
    printViaWiFi,
    isConnected,
    isConnecting,
    platform,
    supportsBluetooth,
    supportsWiFi
  } = useUnifiedPrinter();

  const handleBluetoothPrint = async () => {
    try {
      await connectAndPrint(order, isTakeaway, discountApplied, selectedBLEDevice);
      toast({
        title: "Print succesvol",
        description: "Bestelling is afgedrukt via EPSON Bluetooth printer",
      });
    } catch (error) {
      toast({
        title: "Print fout",
        description: `EPSON Bluetooth print mislukt: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleWiFiPrint = async () => {
    if (!printerIP.trim()) {
      toast({
        title: "IP-adres vereist",
        description: "Voer het IP-adres van de printer in",
        variant: "destructive",
      });
      return;
    }

    setIsWiFiPrinting(true);
    try {
      await printViaWiFi(order, isTakeaway, discountApplied, printerIP);
      toast({
        title: "Print succesvol",
        description: "Bestelling is afgedrukt via WiFi",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      toast({
        title: "Print fout",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsWiFiPrinting(false);
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
        return <Smartphone className="h-4 w-4" />;
      case 'android':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'ios':
        return 'iPhone';
      case 'android':
        return 'Android';
      default:
        return 'Web Browser';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Opties
          </CardTitle>
          <div className="flex items-center gap-2">
            {getPlatformIcon()}
            <Badge variant="secondary">{getPlatformName()}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Bluetooth Printing */}
          {supportsBluetooth && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bluetooth className="h-4 w-4" />
                  <Label className="font-medium">EPSON Bluetooth Printing</Label>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected && <Badge variant="default" className="text-xs">Verbonden</Badge>}
                  {selectedBLEDevice && (
                    <Badge variant="outline" className="text-xs">
                      {selectedBLEDevice.name || 'EPSON Printer'}
                    </Badge>
                  )}
                </div>
              </div>
              
              {platform !== 'web' && (
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowScanner(!showScanner)}
                    variant="outline"
                    className="w-full"
                  >
                    {showScanner ? 'Verberg Scanner' : 'Toon EPSON Scanner'}
                  </Button>
                  
                  {showScanner && (
                    <EPSONBLEScanner 
                      onPrinterSelected={setSelectedBLEDevice}
                      selectedDevice={selectedBLEDevice}
                    />
                  )}
                </div>
              )}
              
              <Button 
                onClick={handleBluetoothPrint}
                disabled={order.items.length === 0 || isConnecting}
                className="w-full flex items-center gap-2"
              >
                <Bluetooth className="h-4 w-4" />
                {isConnecting ? 'Verbinding maken...' : isConnected ? 'Print via EPSON Bluetooth' : 'Verbind & Print EPSON'}
              </Button>
            </div>
          )}

          {supportsBluetooth && supportsWiFi && <Separator />}

          {/* WiFi Printing */}
          {supportsWiFi && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <Label className="font-medium">WiFi Printing (Epson ePOS)</Label>
              </div>
              
              {platform === 'web' && (
                <EPSONSDKStatus />
              )}
              
              <div className="space-y-2">
                <div>
                  <Label htmlFor="printer-ip" className="text-sm">Printer IP-adres</Label>
                  <Input
                    id="printer-ip"
                    value={printerIP}
                    onChange={(e) => setPrinterIP(e.target.value)}
                    placeholder="192.168.1.100"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleWiFiPrint}
                  disabled={order.items.length === 0 || isWiFiPrinting}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <Wifi className="h-4 w-4" />
                  {isWiFiPrinting ? 'Printen...' : 'Print via WiFi'}
                </Button>
              </div>
            </div>
          )}

          {!supportsBluetooth && !supportsWiFi && (
            <div className="text-center py-4 text-muted-foreground">
              <p>Geen print opties beschikbaar op dit platform</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}