import { useState, useCallback, useEffect } from 'react';
import { Order } from '@/types/pos';
import { useWebBluetoothPrinter } from './useWebBluetoothPrinter';
import { useNativeBLEPrinter } from './useNativeBLEPrinter';
import { Capacitor } from '@capacitor/core';

interface UnifiedPrinterHook {
  isConnected: boolean;
  isConnecting: boolean;
  connectAndPrint: (order: Order, isTakeaway: boolean, discountApplied: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  printViaWiFi: (order: Order, isTakeaway: boolean, discountApplied: boolean, printerIP: string) => Promise<void>;
  platform: 'web' | 'ios' | 'android';
  supportsBluetooth: boolean;
  supportsWiFi: boolean;
}

export function useUnifiedPrinter(): UnifiedPrinterHook {
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');
  const [supportsBluetooth, setSupportsBluetooth] = useState(false);
  const [supportsWiFi] = useState(true); // WiFi printing always supported via HTTP

  const webBluetooth = useWebBluetoothPrinter();
  const nativeBLE = useNativeBLEPrinter();

  useEffect(() => {
    const currentPlatform = Capacitor.getPlatform();
    setPlatform(currentPlatform as 'web' | 'ios' | 'android');
    
    // Check Bluetooth support
    if (currentPlatform === 'web') {
      setSupportsBluetooth('bluetooth' in navigator);
    } else {
      setSupportsBluetooth(true); // Native apps support BLE
    }
  }, []);

  const formatReceiptForWiFi = useCallback((order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    const lines = [];
    
    lines.push('===============================');
    lines.push('         RESTAURANT');
    lines.push('===============================');
    lines.push('');
    lines.push(isTakeaway ? 'AFHAAL BESTELLING' : `TAFEL ${order.tableId}`);
    lines.push(`Datum: ${new Date().toLocaleDateString('nl-NL')}`);
    lines.push(`Tijd: ${new Date().toLocaleTimeString('nl-NL')}`);
    lines.push('-------------------------------');
    
    order.items.forEach((item) => {
      lines.push(item.menuItem.name);
      lines.push(`${item.quantity}x €${item.menuItem.price.toFixed(2)} = €${(item.quantity * item.menuItem.price).toFixed(2)}`);
      lines.push('-------------------------------');
    });

    const subtotal = order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;

    if (discountAmount > 0) {
      lines.push(`Subtotaal: €${subtotal.toFixed(2)}`);
      lines.push(`Korting (15%): -€${discountAmount.toFixed(2)}`);
      lines.push('-------------------------------');
    }
    
    lines.push(`TOTAAL: €${total.toFixed(2)}`);
    lines.push('===============================');
    lines.push('Bedankt voor uw bezoek!');
    lines.push('===============================');
    
    return lines.join('\n');
  }, []);

  const printViaWiFi = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean, printerIP: string) => {
    const receiptText = formatReceiptForWiFi(order, isTakeaway, discountApplied);
    
    try {
      const response = await fetch(`http://${printerIP}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SOAPAction': '"http://www.epson-pos.com/schemas/2011/03/epos-print/Service/Print"',
        },
        body: JSON.stringify({
          "param": {
            "devid": "local_printer",
            "timeout": 10000
          },
          "data": receiptText
        })
      });

      if (!response.ok) {
        throw new Error(`WiFi print failed: ${response.status} ${response.statusText}`);
      }

      console.log('WiFi print successful');
    } catch (error) {
      console.error('WiFi print error:', error);
      throw error;
    }
  }, [formatReceiptForWiFi]);

  const connectAndPrint = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean) => {
    if (platform === 'web' && supportsBluetooth) {
      return webBluetooth.connectAndPrint(order, isTakeaway, discountApplied);
    } else if (platform !== 'web') {
      return nativeBLE.connectAndPrint(order, isTakeaway, discountApplied);
    } else {
      throw new Error('Bluetooth not supported on this platform');
    }
  }, [platform, supportsBluetooth, webBluetooth, nativeBLE]);

  const disconnect = useCallback(async () => {
    if (platform === 'web' && supportsBluetooth) {
      return webBluetooth.disconnect();
    } else if (platform !== 'web') {
      return nativeBLE.disconnect();
    }
  }, [platform, supportsBluetooth, webBluetooth, nativeBLE]);

  const isConnected = platform === 'web' ? webBluetooth.isConnected : nativeBLE.isConnected;
  const isConnecting = platform === 'web' ? webBluetooth.isConnecting : nativeBLE.isConnecting;

  return {
    isConnected,
    isConnecting,
    connectAndPrint,
    disconnect,
    printViaWiFi,
    platform,
    supportsBluetooth,
    supportsWiFi
  };
}