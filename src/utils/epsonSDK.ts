// Utility for managing Epson ePOS SDK loading and availability

declare global {
  interface Window {
    epos?: any;
    epsonSDKLoaded?: boolean;
    epsonSDKError?: boolean;
  }
}

export class EPSONSDKManager {
  private static instance: EPSONSDKManager;
  private checkInterval?: NodeJS.Timeout;
  private maxCheckTime = 10000; // 10 seconds max wait time

  static getInstance(): EPSONSDKManager {
    if (!EPSONSDKManager.instance) {
      EPSONSDKManager.instance = new EPSONSDKManager();
    }
    return EPSONSDKManager.instance;
  }

  /**
   * Check if Epson ePOS SDK is available
   */
  isSDKAvailable(): boolean {
    return !!(typeof window !== 'undefined' && 
              window.epos && 
              window.epsonSDKLoaded && 
              !window.epsonSDKError);
  }

  /**
   * Check if SDK failed to load
   */
  hasSDKError(): boolean {
    return !!(typeof window !== 'undefined' && window.epsonSDKError);
  }

  /**
   * Wait for SDK to load with timeout
   */
  async waitForSDK(): Promise<boolean> {
    if (typeof window === 'undefined') {
      throw new Error('Epson SDK is alleen beschikbaar in browsers');
    }

    // If already loaded, return immediately
    if (this.isSDKAvailable()) {
      console.log('✅ Epson SDK already loaded');
      return true;
    }

    // If there was an error, don't wait
    if (this.hasSDKError()) {
      throw new Error('Epson SDK kon niet worden geladen van de CDN');
    }

    // Wait for SDK to load
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        if (this.isSDKAvailable()) {
          console.log('✅ Epson SDK loaded successfully after', elapsed, 'ms');
          clearInterval(this.checkInterval);
          resolve(true);
        } else if (this.hasSDKError()) {
          clearInterval(this.checkInterval);
          reject(new Error('Epson SDK loading failed'));
        } else if (elapsed > this.maxCheckTime) {
          clearInterval(this.checkInterval);
          reject(new Error(`Epson SDK loading timeout after ${this.maxCheckTime}ms. Check your internet connection.`));
        }
      }, 100);
    });
  }

  /**
   * Get the Epson epos object if available
   */
  getEPOS(): any {
    if (!this.isSDKAvailable()) {
      throw new Error('Epson ePOS SDK is not available');
    }
    return window.epos;
  }

  /**
   * Get SDK status information
   */
  getSDKStatus(): {
    available: boolean;
    error: boolean;
    loaded: boolean;
    windowEpos: boolean;
  } {
    return {
      available: this.isSDKAvailable(),
      error: this.hasSDKError(),
      loaded: !!(typeof window !== 'undefined' && window.epsonSDKLoaded),
      windowEpos: !!(typeof window !== 'undefined' && window.epos)
    };
  }

  /**
   * Manual SDK loading fallback
   */
  async loadSDKManually(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Manual loading is only available in browsers');
    }

    return new Promise((resolve, reject) => {
      // Remove any existing script
      const existingScript = document.querySelector('script[src*="epos"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script element
      const script = document.createElement('script');
      script.src = 'https://cdn.epson.com/epos/v2.27.0/epos-2.27.0.js';
      script.onload = () => {
        console.log('✅ Epson SDK loaded manually');
        window.epsonSDKLoaded = true;
        window.epsonSDKError = false;
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Manual Epson SDK loading failed');
        window.epsonSDKError = true;
        reject(new Error('Failed to load Epson SDK manually'));
      };

      document.head.appendChild(script);
    });
  }
}

export const epsonSDK = EPSONSDKManager.getInstance();