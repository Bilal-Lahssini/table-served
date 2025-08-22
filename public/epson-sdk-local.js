// Local Epson ePOS SDK Implementation
// This avoids ad blocker issues with external CDNs

(function() {
  console.log('📦 Loading local Epson SDK implementation...');
  
  // Basic ePOS Print implementation
  window.ePosPrint = function() {
    const printer = {
      // Text formatting constants
      TXT_ALIGN_LEFT: 0,
      TXT_ALIGN_CENTER: 1,
      TXT_ALIGN_RIGHT: 2,
      
      // Cut constants
      CUT_NO_FEED: 0,
      CUT_FEED: 1,
      
      // Internal content buffer
      _content: '',
      
      // Add text with formatting
      addText: function(text) {
        this._content += text;
        return this;
      },
      
      // Add line feed
      addFeedLine: function(lines = 1) {
        this._content += '\n'.repeat(lines);
        return this;
      },
      
      // Add paper cut
      addCut: function(type = this.CUT_FEED) {
        this._content += '\x1D\x56\x00'; // ESC/POS cut command
        return this;
      },
      
      // Get the content for sending
      getContent: function() {
        return this._content;
      },
      
      // Clear content
      clear: function() {
        this._content = '';
        return this;
      }
    };
    
    return printer;
  };
  
  // Basic ePOS Device implementation
  window.ePosDev = function() {
    const device = {
      // Connect to printer
      connect: function(ipAddress, port, callback) {
        console.log(`🔌 Attempting connection to ${ipAddress}:${port}`);
        
        // Simulate connection attempt
        setTimeout(() => {
          // For web browsers, we can't actually connect to TCP sockets
          // This will always fail in browsers due to security restrictions
          callback('FAIL_CONNECT');
        }, 1000);
      },
      
      // Send data to printer
      send: function(printer, timeout, callback) {
        console.log('📤 Attempting to send data to printer...');
        
        // In web browsers, this will fail due to CORS and security restrictions
        setTimeout(() => {
          callback({ 
            success: false, 
            code: 'ERR_NETWORK',
            message: 'Direct printer connection not supported in web browsers'
          });
        }, 500);
      },
      
      // Disconnect from printer
      disconnect: function() {
        console.log('🔌 Disconnected from printer');
      }
    };
    
    return device;
  };
  
  console.log('✅ Local Epson SDK loaded successfully');
  window.epsonSDKReady = true;
  
})();