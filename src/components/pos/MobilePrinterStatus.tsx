import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Globe } from 'lucide-react';

export function MobilePrinterStatus() {
  const [platformInfo, setPlatformInfo] = useState({
    platform: 'unknown',
    isNative: false,
    userAgent: 'unknown'
  });

  useEffect(() => {
    setPlatformInfo({
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      userAgent: navigator.userAgent
    });
  }, []);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {platformInfo.isNative ? (
            <Smartphone className="h-5 w-5" />
          ) : (
            <Globe className="h-5 w-5" />
          )}
          Platform Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Platform:</span>
            <Badge variant={platformInfo.isNative ? "default" : "secondary"}>
              {platformInfo.platform}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Environment:</span>
            <Badge variant={platformInfo.isNative ? "default" : "outline"}>
              {platformInfo.isNative ? 'Mobile App' : 'Web Browser'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {platformInfo.userAgent.substring(0, 60)}...
          </div>
        </div>
      </CardContent>
    </Card>
  );
}