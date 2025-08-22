import { useState, useCallback, useEffect } from 'react';
import { Order } from '@/types/pos';
import { useWebBluetoothPrinter } from './useWebBluetoothPrinter';
import { useNativeBLEPrinter } from './useNativeBLEPrinter';
import { Capacitor } from '@capacitor/core';
import { BleDevice } from '@capacitor-community/bluetooth-le';

interface UnifiedPrinterHook {
  isConnected: boolean;
  isConnecting: boolean;
  connectAndPrint: (order: Order, isTakeaway: boolean, discountApplied: boolean, selectedDevice?: BleDevice) => Promise<void>;
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
      // Try Epson ePOS SDK first if available
      if (platform === 'web' && typeof window !== 'undefined' && (window as any).epos) {
        const epos = (window as any).epos;
        const device = new epos.Device();
        
        device.connect(`http://${printerIP}`, 8008, () => {
          const printer = device.createPrinter(device.ASB_NO_RESPONSE, 60000, 'TM-m30III');
          
          printer.addTextAlign(printer.ALIGN_CENTER);
          printer.addText('===============================\n');
          printer.addText('         RESTAURANT\n');
          printer.addText('===============================\n');
          printer.addTextAlign(printer.ALIGN_LEFT);
          
          const lines = receiptText.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              printer.addText(line + '\n');
            }
          });
          
          printer.addCut(printer.CUT_FEED);
          printer.send();
          
          device.disconnect();
          console.log('WiFi print successful via ePOS SDK');
        });
        return;
      }
      
      // Fallback: Try direct HTTP (will likely fail due to CORS in browser)
      if (platform !== 'web') {
        // For mobile platforms, try HTTP request
        const response = await fetch(`http://${printerIP}:8008/`, {
          method: 'GET',
          mode: 'no-cors',
        });
        console.log('Printer reachable, but printing requires native implementation');
        throw new Error('Voor mobiele apparaten gebruik de Bluetooth optie of installeer de native app');
      } else {
        throw new Error('Epson ePOS SDK niet geladen. Herlaad de pagina of gebruik Bluetooth printing.');
      }
    } catch (error) {
      console.error('WiFi print error:', error);
      throw new Error(`WiFi print mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  }, [formatReceiptForWiFi, platform]);

  const connectAndPrint = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean, selectedDevice?: BleDevice) => {
    if (platform === 'web' && supportsBluetooth) {
      return webBluetooth.connectAndPrint(order, isTakeaway, discountApplied);
    } else if (platform !== 'web') {
      return nativeBLE.connectAndPrint(order, isTakeaway, discountApplied, selectedDevice);
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