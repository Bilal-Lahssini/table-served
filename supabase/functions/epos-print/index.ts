import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EPOSPrintRequest {
  printerIP: string;
  printData: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { printerIP, printData }: EPOSPrintRequest = await req.json();
    
    console.log(`🖨️ ePOS Print request to ${printerIP}`);
    console.log(`📄 Data length: ${printData.length} bytes`);
    
    // Connect to printer via TCP/IP on port 9100
    try {
      const conn = await Deno.connect({
        hostname: printerIP,
        port: 9100,
      });
      
      console.log(`✅ Connected to ${printerIP}:9100`);
      
      // Send the print data directly (ePOS commands)
      const encoder = new TextEncoder();
      await conn.write(encoder.encode(printData));
      
      console.log('📤 Print data sent');
      
      // Close connection
      conn.close();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Print job sent successfully',
          printerIP,
          dataSize: printData.length
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
          error: 'Printer connection failed',
          message: `Could not connect to printer at ${printerIP}:9100 - ${printerError.message}`,
          printerIP
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
    console.error('❌ ePOS Print Error:', error);
    
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