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

  const printViaWiFi = useCallback(async (order: Order, isTakeaway: boolean, discountApplied: boolean, printerIP: string): Promise<void> => {
    const receiptText = formatReceiptForWiFi(order, isTakeaway, discountApplied);
    
    try {
      // Import SDK manager
      const { epsonSDK } = await import('@/utils/epsonSDK');
      
      // For web platform, try Epson ePOS SDK
      if (platform === 'web') {
        try {
          console.log('🔄 Checking Epson SDK availability...');
          const sdkStatus = epsonSDK.getSDKStatus();
          console.log('📊 SDK Status:', sdkStatus);
          
          // Try to wait for SDK or load manually
          let sdkReady = false;
          if (!epsonSDK.isSDKAvailable()) {
            console.log('⏳ Waiting for Epson SDK to load...');
            try {
              await epsonSDK.waitForSDK();
              sdkReady = true;
            } catch (error) {
              console.log('🔄 Trying manual SDK loading...');
              await epsonSDK.loadSDKManually();
              await epsonSDK.waitForSDK();
              sdkReady = true;
            }
          } else {
            sdkReady = true;
          }
          
          if (sdkReady) {
            console.log('✅ Epson SDK ready, attempting WiFi print...');
            const epos = epsonSDK.getEPOS();
            
            await new Promise<void>((resolve, reject) => {
              const device = new epos.Device();
              
              device.connect(`http://${printerIP}`, 8008, () => {
                console.log('🔗 Connected to printer via WiFi');
                const printer = device.createPrinter(device.ASB_NO_RESPONSE, 60000, 'TM-m30III');
                
                // Format receipt for Epson printer
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
                
                printer.send(() => {
                  console.log('✅ WiFi print successful via ePOS SDK');
                  device.disconnect();
                  resolve();
                });
              });
              
              // Connection timeout
              setTimeout(() => {
                device.disconnect();
                reject(new Error(`Kan geen verbinding maken met printer op ${printerIP}:8008. Controleer het IP-adres en netwerk.`));
              }, 5000);
            });
            return;
          }
        } catch (sdkError) {
          console.error('❌ Epson SDK error:', sdkError);
          throw new Error(`Epson ePOS SDK fout: ${sdkError instanceof Error ? sdkError.message : 'Onbekende SDK fout'}. Probeer de pagina te herladen.`);
        }
      } else {
        // For mobile platforms, use native HTTP approach
        console.log('📱 Mobile platform detected, using HTTP approach...');
        const response = await fetch(`http://${printerIP}:8008/`, {
          method: 'GET',
          mode: 'no-cors',
        });
        console.log('🖨️ Printer reachable via HTTP');
        throw new Error('Voor mobiele apparaten gebruik de Bluetooth optie of installeer de native app voor volledige WiFi print ondersteuning');
      }
    } catch (error) {
      console.error('❌ WiFi print error:', error);
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