import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PrintRequest {
  printerIP: string;
  receiptData: string;
  qrContent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { printerIP, receiptData, qrContent }: PrintRequest = await req.json();
    
    console.log(`🖨️ Attempting TCP/IP print to ${printerIP}`);
    
    // Create ESC/POS commands
    let escPosCommands = '';
    
    // Initialize printer
    escPosCommands += '\x1B\x40'; // ESC @ - Initialize printer
    
    // Print header
    escPosCommands += '\x1B\x61\x01'; // Center alignment
    escPosCommands += '\x1B\x45\x01'; // Bold on
    escPosCommands += 'QR Scan Receipt 🎉\n';
    escPosCommands += '\x1B\x45\x00'; // Bold off
    escPosCommands += '================================\n\n';
    
    // If QR content provided, print it
    if (qrContent) {
      escPosCommands += '\x1B\x61\x00'; // Left alignment
      escPosCommands += '\x1B\x45\x01QR CONTENT:\x1B\x45\x00\n';
      escPosCommands += '--------------------------------\n';
      escPosCommands += qrContent + '\n';
      escPosCommands += '--------------------------------\n\n';
    }
    
    // Add receipt data (order info)
    escPosCommands += receiptData;
    
    // Paper cut
    escPosCommands += '\n\n\n';
    escPosCommands += '\x1D\x56\x42\x00'; // GS V B - Partial cut
    
    // Connect to printer via TCP/IP
    try {
      const conn = await Deno.connect({
        hostname: printerIP,
        port: 9100, // Standard ESC/POS port
      });
      
      console.log(`✅ Connected to printer at ${printerIP}:9100`);
      
      // Send ESC/POS commands
      const encoder = new TextEncoder();
      await conn.write(encoder.encode(escPosCommands));
      
      // Close connection
      conn.close();
      
      console.log('🎉 Print job sent successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Print job sent successfully',
          printerIP 
        }),
        { 
          headers: { 
            ...CORS_HEADERS, 
            'Content-Type': 'application/json' 
          } 
        }
      );
      
    } catch (printerError) {
      console.error(`❌ Printer connection error:`, printerError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Printer unavailable',
          message: `Could not connect to printer at ${printerIP}:9100`,
          details: printerError.message
        }),
        { 
          status: 502,
          headers: { 
            ...CORS_HEADERS, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
  } catch (error) {
    console.error('❌ TCP Print Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...CORS_HEADERS, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});