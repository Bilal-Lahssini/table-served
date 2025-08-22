import { Order } from '@/types/pos';

declare global {
  interface Window {
    epson: {
      ePOSPrint: {
        new(address: string): EpsonPrinter;
        FONT_A: number;
        FONT_B: number;
        ALIGN_CENTER: number;
        ALIGN_LEFT: number;
        TRUE: number;
        FALSE: number;
        CUT_FEED: number;
      };
    };
  }
}

interface EpsonPrinter {
  timeout: number;
  onreceive: (response: any) => void;
  onerror: (error: any) => void;
  addTextAlign(align: number): void;
  addTextFont(font: number): void;
  addTextStyle(reverse: boolean, ul: boolean, em: boolean, color: number): void;
  addText(text: string): void;
  addFeedLine(lines: number): void;
  addCut(type: number): void;
  send(): void;
  open(): void;
  close(): void;
}

export class EpsonPrinterService {
  private static instance: EpsonPrinterService;
  private printerIP: string | null = null;
  private readonly PRINTER_PORT = '8008';

  static getInstance(): EpsonPrinterService {
    if (!EpsonPrinterService.instance) {
      EpsonPrinterService.instance = new EpsonPrinterService();
    }
    return EpsonPrinterService.instance;
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

  private isSDKLoaded(): boolean {
    return typeof window !== 'undefined' && 
           !!window.epson && 
           !!window.epson.ePOSPrint;
  }

  async testConnection(ip?: string): Promise<boolean> {
    const testIP = ip || this.printerIP;
    if (!testIP) {
      throw new Error('No printer IP configured');
    }

    if (!this.isSDKLoaded()) {
      throw new Error('Epson ePOS SDK not loaded');
    }

    return new Promise((resolve) => {
      try {
        const printer = new window.epson.ePOSPrint(`http://${testIP}:${this.PRINTER_PORT}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`);
        
        printer.timeout = 5000;
        
        printer.onreceive = (response) => {
          printer.close();
          resolve(response.success);
        };
        
        printer.onerror = () => {
          printer.close();
          resolve(false);
        };

        // Send a simple status check
        printer.open();
        printer.send();
      } catch (error) {
        resolve(false);
      }
    });
  }

  async printReceipt(order: Order, isTakeaway: boolean, discountApplied: boolean): Promise<void> {
    if (!this.printerIP) {
      throw new Error('Printer IP not configured. Please set up the printer first.');
    }

    if (!this.isSDKLoaded()) {
      throw new Error('Epson ePOS SDK not loaded. Please refresh the page.');
    }

    return new Promise((resolve, reject) => {
      try {
        const printer = new window.epson.ePOSPrint(`http://${this.printerIP}:${this.PRINTER_PORT}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`);
        
        printer.timeout = 10000;
        
        printer.onreceive = (response) => {
          printer.close();
          if (response.success) {
            resolve();
          } else {
            reject(new Error(`Print failed: ${response.code} - ${response.status}`));
          }
        };
        
        printer.onerror = (error) => {
          printer.close();
          reject(new Error('Printer not reachable, check Wi-Fi or IP'));
        };

        // Build receipt content
        this.buildReceipt(printer, order, isTakeaway, discountApplied);
        
        printer.open();
        printer.send();
      } catch (error) {
        reject(new Error('Failed to connect to printer: ' + (error as Error).message));
      }
    });
  }

  private buildReceipt(printer: EpsonPrinter, order: Order, isTakeaway: boolean, discountApplied: boolean): void {
    const ePOS = window.epson.ePOSPrint;
    
    // Header
    printer.addTextAlign(ePOS.ALIGN_CENTER);
    printer.addTextFont(ePOS.FONT_A);
    printer.addTextStyle(false, false, true, 0);
    printer.addText("PEPE'S RESTAURANT\n");
    printer.addText("================================\n");
    
    // Order info
    printer.addTextAlign(ePOS.ALIGN_LEFT);
    printer.addTextStyle(false, false, false, 0);
    printer.addText(`${isTakeaway ? 'AFHAAL BESTELLING' : `TAFEL ${order.tableId}`}\n`);
    printer.addText(`Datum: ${new Date().toLocaleDateString('nl-NL')}\n`);
    printer.addText(`Tijd: ${new Date().toLocaleTimeString('nl-NL')}\n`);
    printer.addText("--------------------------------\n");
    
    // Items
    order.items.forEach((item) => {
      printer.addText(`${item.menuItem.name}\n`);
      printer.addText(`  ${item.quantity}x €${item.menuItem.price.toFixed(2)} = €${(item.quantity * item.menuItem.price).toFixed(2)}\n`);
      printer.addText("--------------------------------\n");
    });
    
    // Totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
    const total = subtotal - discountAmount;
    
    if (discountAmount > 0) {
      printer.addText(`Subtotaal: €${subtotal.toFixed(2)}\n`);
      printer.addText(`15% Korting: -€${discountAmount.toFixed(2)}\n`);
      printer.addText("--------------------------------\n");
    }
    
    printer.addTextStyle(false, false, true, 0);
    printer.addText(`TOTAAL: €${total.toFixed(2)}\n`);
    printer.addTextStyle(false, false, false, 0);
    
    // Footer
    printer.addText("================================\n");
    printer.addTextAlign(ePOS.ALIGN_CENTER);
    printer.addText("Bedankt voor uw bezoek!\n");
    printer.addFeedLine(3);
    
    // Cut paper
    printer.addCut(ePOS.CUT_FEED);
  }
}