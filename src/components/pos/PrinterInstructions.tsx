import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, WifiIcon, BluetoothIcon, SmartphoneIcon, MonitorIcon } from 'lucide-react';

interface PrinterInstructionsProps {
  platform: 'web' | 'ios' | 'android';
}

export function PrinterInstructions({ platform }: PrinterInstructionsProps) {
  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
        return <SmartphoneIcon className="h-4 w-4" />;
      case 'android':
        return <SmartphoneIcon className="h-4 w-4" />;
      default:
        return <MonitorIcon className="h-4 w-4" />;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'ios':
        return 'iPhone/iPad';
      case 'android':
        return 'Android';
      default:
        return 'Web Browser';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5" />
          Printer Setup Instructies
        </CardTitle>
        <div className="flex items-center gap-2">
          {getPlatformIcon()}
          <Badge variant="outline">{getPlatformName()}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {platform === 'web' && (
          <>
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Voor web browsers zijn er beperkingen door beveiligingsredenen. Voor de beste ervaring gebruik de native app.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BluetoothIcon className="h-4 w-4" />
                  <span className="font-medium">Bluetooth Printing</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  • Alleen beschikbaar op HTTPS websites<br/>
                  • Mogelijk geblokkeerd in sandbox omgevingen<br/>
                  • Werkt met Epson TM-m30III en compatibele printers
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <WifiIcon className="h-4 w-4" />
                  <span className="font-medium">WiFi Printing</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  • Vereist Epson ePOS SDK (herlaad pagina als niet geladen)<br/>
                  • Printer en apparaat moeten op hetzelfde netwerk zitten<br/>
                  • Gebruik het lokale IP-adres van de printer (bijv. 192.168.1.100)
                </p>
              </div>
            </div>
          </>
        )}

        {platform === 'ios' && (
          <>
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Op iPhone/iPad is Bluetooth Low Energy de beste optie voor thermal printers.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BluetoothIcon className="h-4 w-4" />
                  <span className="font-medium">Bluetooth LE Printing</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  • Zorg dat Bluetooth is ingeschakeld<br/>
                  • Printer moet in pairing mode staan<br/>
                  • Ondersteunt Epson TM-m30III en vergelijkbare BLE printers
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <WifiIcon className="h-4 w-4" />
                  <span className="font-medium">WiFi Printing</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  • Experimenteel - gebruik Bluetooth voor beste resultaten<br/>
                  • Beide apparaten moeten op hetzelfde WiFi netwerk zitten
                </p>
              </div>
            </div>
          </>
        )}

        {platform === 'android' && (
          <>
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Android ondersteunt zowel Bluetooth als WiFi printing goed.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BluetoothIcon className="h-4 w-4" />
                  <span className="font-medium">Bluetooth LE Printing</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  • Zorg dat locatie en Bluetooth permissies zijn toegestaan<br/>
                  • Printer moet zichtbaar zijn voor andere apparaten<br/>
                  • Ondersteunt de meeste BLE thermal printers
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <WifiIcon className="h-4 w-4" />
                  <span className="font-medium">WiFi Printing</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  • Beide apparaten moeten op hetzelfde netwerk zitten<br/>
                  • Vind het IP-adres van de printer in de netwerk instellingen
                </p>
              </div>
            </div>
          </>
        )}

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Tip:</strong> Voor de beste ervaring installeer de native app via de export functie en gebruik Capacitor voor volledige printer ondersteuning.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}