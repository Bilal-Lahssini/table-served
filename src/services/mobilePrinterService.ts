import { CapacitorHttp, Capacitor } from '@capacitor/core';
import { Order } from '@/types/pos';

export class MobilePrinterService {
  private static instance: MobilePrinterService;
  private printerIP: string | null = null;
  private readonly PRINTER_PORT = '8008';

  static getInstance(): MobilePrinterService {
    if (!MobilePrinterService.instance) {
      MobilePrinterService.instance = new MobilePrinterService();
    }
    return MobilePrinterService.instance;
  }

  constructor() {
    this.loadSavedIP();
  }

  private loadSavedIP(): void {
    const savedIP = localStorage.getItem('epson_printer_ip');
    if (savedIP) {
      this.printerIP = savedIP;
    }
  }

  setPrinterIP(ip: string): void {
    this.printerIP = ip;
    localStorage.setItem('epson_printer_ip', ip);
  }

  getPrinterIP(): string | null {
    return this.printerIP;
  }

  clearPrinterIP(): void {
    this.printerIP = null;
    localStorage.removeItem('epson_printer_ip');
  }

  async testConnection(ip?: string): Promise<boolean> {
    const testIP = ip || this.printerIP;
    if (!testIP) {
      throw new Error('No printer IP configured');
    }

    try {
      console.log(`Testing connection to printer at ${testIP}:${this.PRINTER_PORT}`);
      console.log('Request details:', {
        url: `http://${testIP}:${this.PRINTER_PORT}/cgi-bin/epos/service.cgi?devid=local_printer`,
        timeout: 3000
      });
      
      const response = await CapacitorHttp.get({
        url: `http://${testIP}:${this.PRINTER_PORT}/cgi-bin/epos/service.cgi?devid=local_printer`,
        headers: {
          'User-Agent': 'ePOS SDK Mobile'
        },
        connectTimeout: 3000,
        readTimeout: 3000
      });

      console.log('Printer connection test response:', {
        status: response.status,
        headers: response.headers,
        dataType: typeof response.data,
        dataLength: response.data ? response.data.toString().length : 0
      });
      
      // Accept various status codes that indicate the printer is reachable
      const isReachable = response.status === 200 || 
                         response.status === 404 || 
                         response.status === 400 ||
                         response.status === 405; // Method not allowed is also OK
      
      return isReachable;
    } catch (error) {
      console.error('Printer connection test failed:', {
        error: (error as Error).message,
        ip: testIP,
        port: this.PRINTER_PORT
      });
      return false;
    }
  }

  async printReceipt(order: Order, isTakeaway: boolean, discountApplied: boolean): Promise<void> {
    if (!this.printerIP) {
      throw new Error('Printer IP not configured. Please set up the printer first.');
    }

    try {
      console.log('Preparing receipt for printing...');
      const receiptData = this.buildReceiptData(order, isTakeaway, discountApplied);
      
      const response = await CapacitorHttp.post({
        url: `http://${this.printerIP}:${this.PRINTER_PORT}/cgi-bin/epos/service.cgi?devid=local_printer`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: receiptData
      });

      if (response.status !== 200) {
        throw new Error(`Print failed with status: ${response.status}`);
      }

      console.log('Receipt printed successfully');
    } catch (error) {
      console.error('Print failed:', error);
      throw new Error('Printer not reachable, check Wi-Fi or IP');
    }
  }

  private buildReceiptData(order: Order, isTakeaway: boolean, discountApplied: boolean): any {
    // Build ESC/POS commands manually for mobile printing
    const commands = [];
    
    // Header
    commands.push({
      type: 'text',
      data: "PEPE'S RESTAURANT\n",
      align: 'center',
      font: 'A',
      emphasis: true
    });
    
    commands.push({
      type: 'text',
      data: "================================\n",
      align: 'center'
    });
    
    // Order info
    commands.push({
      type: 'text',
      data: `${isTakeaway ? 'AFHAAL BESTELLING' : `TAFEL ${order.tableId}`}\n`,
      align: 'left'
    });
    
    commands.push({
      type: 'text',
      data: `Datum: ${new Date().toLocaleDateString('nl-NL')}\n`,
      align: 'left'
    });
    
    commands.push({
      type: 'text',
      data: `Tijd: ${new Date().toLocaleTimeString('nl-NL')}\n`,
      align: 'left'
    });
    
    commands.push({
      type: 'text',
      data: "--------------------------------\n",
      align: 'left'
    });
    
    // Items
    order.items.forEach((item) => {
      commands.push({
        type: 'text',
        data: `${item.menuItem.name}\n`,
        align: 'left'
      });
      
      commands.push({
        type: 'text',
        data: `  ${item.quantity}x €${item.menuItem.price.toFixed(2)} = €${(item.quantity * item.menuItem.price).toFixed(2)}\n`,
        align: 'left'
      });
      
      commands.push({
        type: 'text',
        data: "--------------------------------\n",
        align: 'left'
      });
    });
    
    // Totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;
    
    if (discountAmount > 0) {
      commands.push({
        type: 'text',
        data: `Subtotaal: €${subtotal.toFixed(2)}\n`,
        align: 'left'
      });
      
      commands.push({
        type: 'text',
        data: `15% Korting: -€${discountAmount.toFixed(2)}\n`,
        align: 'left'
      });
      
      commands.push({
        type: 'text',
        data: "--------------------------------\n",
        align: 'left'
      });
    }
    
    commands.push({
      type: 'text',
      data: `TOTAAL: €${total.toFixed(2)}\n`,
      align: 'left',
      emphasis: true
    });
    
    // Footer
    commands.push({
      type: 'text',
      data: "================================\n",
      align: 'center'
    });
    
    commands.push({
      type: 'text',
      data: "Bedankt voor uw bezoek!\n",
      align: 'center'
    });
    
    commands.push({
      type: 'feed',
      lines: 3
    });
    
    commands.push({
      type: 'cut'
    });
    
    return { commands };
  }
}