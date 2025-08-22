import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bluetooth, Scan, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface EPSONBLEScannerProps {
  onPrinterSelected: (device: BleDevice) => void;
  selectedDevice?: BleDevice | null;
}

export function EPSONBLEScanner({ onPrinterSelected, selectedDevice }: EPSONBLEScannerProps) {
  const [availablePrinters, setAvailablePrinters] = useState<BleDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const { toast } = useToast();

  const isNativePlatform = Capacitor.getPlatform() !== 'web';

  const scanForEPSONPrinters = useCallback(async () => {
    if (!isNativePlatform) {
      setScanError('BLE scanning is only available on mobile devices');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setAvailablePrinters([]);

    try {
      // Initialize BLE if needed
      await BleClient.initialize();

      // Start scanning for EPSON devices
      const scanResults: BleDevice[] = [];
      
      await BleClient.requestLEScan(
        {
          namePrefix: 'EPSON',
          allowDuplicates: false
        },
        (result) => {
          // Filter for EPSON thermal printers
          if (result.device?.name) {
            const name = result.device.name.toUpperCase();
            if (name.includes('EPSON') || name.includes('TM-') || 
                name.includes('M30') || name.includes('M10') || 
                name.includes('M50')) {
              
              // Check if device already exists
              const exists = scanResults.some(d => d.deviceId === result.device.deviceId);
              if (!exists) {
                scanResults.push(result.device);
                setAvailablePrinters([...scanResults]);
                
                console.log('Found EPSON printer:', result.device.name, result.device.deviceId);
              }
            }
          }
        }
      );

      // Scan for 10 seconds
      setTimeout(async () => {
        try {
          await BleClient.stopLEScan();
          setIsScanning(false);
          
          if (scanResults.length === 0) {
            setScanError('Geen EPSON printers gevonden. Zorg ervoor dat de printer aan staat en in pairing mode.');
            toast({
              title: "Geen printers gevonden",
              description: "Controleer of de EPSON printer is ingeschakeld en zichtbaar is voor andere apparaten.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Scan voltooid",
              description: `${scanResults.length} EPSON printer(s) gevonden`,
            });
          }
        } catch (error) {
          console.error('Error stopping scan:', error);
          setIsScanning(false);
        }
      }, 10000);

    } catch (error) {
      console.error('BLE scan error:', error);
      setScanError(`Scan fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
      setIsScanning(false);
      
      toast({
        title: "Scan mislukt",
        description: "Controleer of Bluetooth en locatie permissies zijn toegestaan.",
        variant: "destructive"
      });
    }
  }, [isNativePlatform, toast]);

  const handlePrinterSelect = useCallback((device: BleDevice) => {
    onPrinterSelected(device);
    toast({
      title: "Printer geselecteerd",
      description: `${device.name || 'EPSON Printer'} is geselecteerd`,
    });
  }, [onPrinterSelected, toast]);

  const getPrinterIcon = (deviceName: string) => {
    const name = deviceName.toUpperCase();
    if (name.includes('M30')) return '🖨️ TM-m30';
    if (name.includes('M10')) return '🖨️ TM-m10';  
    if (name.includes('M50')) return '🖨️ TM-m50';
    if (name.includes('TM-')) return '🖨️ TM Series';
    return '🖨️ EPSON';
  };

  const getSignalStrength = () => {
    return 'BLE Signal';
  };

  if (!isNativePlatform) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            EPSON BLE Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>BLE scanning is alleen beschikbaar op mobiele apparaten.</p>
            <p className="text-sm mt-2">Gebruik Web Bluetooth voor browser printing.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bluetooth className="h-5 w-5" />
          EPSON BLE Printer Scanner
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={scanForEPSONPrinters}
            disabled={isScanning}
            className="flex items-center gap-2"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Scan className="h-4 w-4" />
            )}
            {isScanning ? 'Scannen...' : 'Scan voor EPSON Printers'}
          </Button>
        </div>

        {scanError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {scanError}
          </div>
        )}

        {availablePrinters.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Beschikbare EPSON Printers:</p>
              {availablePrinters.map((device) => (
                <div
                  key={device.deviceId}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDevice?.deviceId === device.deviceId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handlePrinterSelect(device)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getPrinterIcon(device.name || '')} {device.name || 'EPSON Printer'}
                        </span>
                        {selectedDevice?.deviceId === device.deviceId && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>ID: {device.deviceId.substring(0, 8)}...</span>
                        <Badge variant="outline" className="text-xs">
                          {getSignalStrength()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {isScanning && (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Zoeken naar EPSON printers... (10 seconden)
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Zorg dat de EPSON printer is ingeschakeld</li>
            <li>Zet de printer in pairing/discoverable mode</li>
            <li>Sta dicht bij de printer (binnen 5 meter)</li>
            <li>Zorg dat Bluetooth en locatie permissies zijn toegestaan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}