
import { Order } from '@/types/pos';

export interface PrinterConnection {
  id: string;
  name: string;
  type: 'wifi' | 'bluetooth';
  address: string;
  port?: number;
}

export class PrinterService {
  private connection: PrinterConnection | null = null;
  private static instance: PrinterService;

  static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  async discoverPrinters(): Promise<PrinterConnection[]> {
    console.log('🔍 Searching for EpsonAC5565 printer...');
    const discovered: PrinterConnection[] = [];

    // Try Wi-Fi discovery first
    try {
      const wifiPrinters = await this.discoverWiFiPrinters();
      discovered.push(...wifiPrinters);
    } catch (error) {
      console.log('Wi-Fi discovery failed:', error);
    }

    // Try Bluetooth discovery
    try {
      const bluetoothPrinters = await this.discoverBluetoothPrinters();
      discovered.push(...bluetoothPrinters);
    } catch (error) {
      console.log('Bluetooth discovery failed:', error);
    }

    return discovered;
  }

  private async discoverWiFiPrinters(): Promise<PrinterConnection[]> {
    const found: PrinterConnection[] = [];
    const commonRanges = ['192.168.1', '192.168.0', '10.0.0'];
    const epsonPorts = [9100, 8008, 631];

    for (const range of commonRanges) {
      for (let i = 1; i <= 50; i++) {
        const ip = `${range}.${i}`;
        
        for (const port of epsonPorts) {
          try {
            // Use a more direct approach for printer detection
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 1000);

            // Try to connect to the printer port
            const response = await fetch(`http://${ip}:${port}/`, {
              method: 'HEAD',
              signal: controller.signal,
              mode: 'no-cors'
            });

            console.log(`✓ Found printer at ${ip}:${port}`);
            found.push({
              id: `wifi-${ip}-${port}`,
              name: `Epson Printer (${ip})`,
              type: 'wifi',
              address: ip,
              port: port
            });
          } catch (error) {
            // Silent fail for discovery
          }
        }
      }
    }

    return found;
  }

  private async discoverBluetoothPrinters(): Promise<PrinterConnection[]> {
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth not supported');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Epson' },
          { namePrefix: 'TM-' },
          { name: 'EpsonAC5565' }
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      if (device.name?.includes('EpsonAC5565') || device.name?.includes('Epson')) {
        console.log(`✓ Found Bluetooth printer: ${device.name}`);
        return [{
          id: `bluetooth-${device.id}`,
          name: device.name || 'Epson Bluetooth Printer',
          type: 'bluetooth',
          address: device.id
        }];
      }
    } catch (error) {
      console.log('Bluetooth discovery error:', error);
    }

    return [];
  }

  async connectToPrinter(printer: PrinterConnection): Promise<void> {
    console.log(`🔗 Connecting to ${printer.name} via ${printer.type}`);
    
    if (printer.type === 'wifi') {
      await this.connectWiFi(printer);
    } else {
      await this.connectBluetooth(printer);
    }
    
    this.connection = printer;
    localStorage.setItem('selected_printer', JSON.stringify(printer));
    console.log(`✅ Connected to ${printer.name}`);
  }

  private async connectWiFi(printer: PrinterConnection): Promise<void> {
    // Test the connection
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);

    await fetch(`http://${printer.address}:${printer.port}/`, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors'
    });
  }

  private async connectBluetooth(printer: PrinterConnection): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth not supported');
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: printer.name }],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    const server = await device.gatt?.connect();
    if (!server) {
      throw new Error('Failed to connect to Bluetooth device');
    }
  }

  async printOrder(order: Order, isTakeaway: boolean, discountApplied: boolean): Promise<void> {
    if (!this.connection) {
      throw new Error('No printer connected');
    }

    const receiptData = this.formatESCPOSReceipt(order, isTakeaway, discountApplied);
    
    if (this.connection.type === 'wifi') {
      await this.printViaWiFi(receiptData);
    } else {
      await this.printViaBluetooth(receiptData);
    }
  }

  private async printViaWiFi(receiptData: string): Promise<void> {
    if (!this.connection || this.connection.type !== 'wifi') {
      throw new Error('No Wi-Fi printer connected');
    }

    const response = await fetch(`http://${this.connection.address}:${this.connection.port}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: receiptData,
    });

    if (!response.ok) {
      throw new Error(`Printer error: ${response.status}`);
    }
  }

  private async printViaBluetooth(receiptData: string): Promise<void> {
    if (!this.connection || this.connection.type !== 'bluetooth') {
      throw new Error('No Bluetooth printer connected');
    }

    // This would require the Bluetooth printer to be connected
    // For now, we'll throw an error as full Bluetooth printing requires more setup
    throw new Error('Bluetooth printing requires additional setup');
  }

  private formatESCPOSReceipt(order: Order, isTakeaway: boolean, discountApplied: boolean): string {
    const ESC = '\x1B';
    const GS = '\x1D';
    
    const commands = {
      INIT: ESC + '@',
      BOLD_ON: ESC + 'E' + '\x01',
      BOLD_OFF: ESC + 'E' + '\x00',
      CENTER: ESC + 'a' + '\x01',
      LEFT: ESC + 'a' + '\x00',
      CUT: GS + 'V' + 'A' + '\x03'
    };

    let receipt = commands.INIT;
    
    // Header
    receipt += commands.CENTER + commands.BOLD_ON;
    receipt += "PEPE'S RESTAURANT\n";
    receipt += "================================\n";
    receipt += commands.BOLD_OFF + commands.LEFT;
    
    // Order details
    receipt += `${isTakeaway ? 'AFHAAL BESTELLING' : `TAFEL ${order.tableId}`}\n`;
    receipt += `Datum: ${new Date().toLocaleDateString('nl-NL')}\n`;
    receipt += `Tijd: ${new Date().toLocaleTimeString('nl-NL')}\n`;
    receipt += "--------------------------------\n";
    
    // Items
    order.items.forEach((item) => {
      receipt += `${item.menuItem.name}\n`;
      receipt += `  ${item.quantity}x €${item.menuItem.price.toFixed(2)} = €${(item.quantity * item.menuItem.price).toFixed(2)}\n`;
      receipt += "--------------------------------\n";
    });
    
    // Totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;
    
    if (discountAmount > 0) {
      receipt += `Subtotaal: €${subtotal.toFixed(2)}\n`;
      receipt += `15% Korting: -€${discountAmount.toFixed(2)}\n`;
      receipt += "--------------------------------\n";
    }
    
    receipt += commands.BOLD_ON;
    receipt += `TOTAAL: €${total.toFixed(2)}\n`;
    receipt += commands.BOLD_OFF;
    
    receipt += "================================\n";
    receipt += commands.CENTER + "Bedankt voor uw bezoek!\n";
    receipt += commands.LEFT + "\n\n\n";
    receipt += commands.CUT;
    
    return receipt;
  }

  getConnection(): PrinterConnection | null {
    return this.connection;
  }

  loadSavedConnection(): void {
    const saved = localStorage.getItem('selected_printer');
    if (saved) {
      try {
        this.connection = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load saved printer:', error);
        localStorage.removeItem('selected_printer');
      }
    }
  }
}
