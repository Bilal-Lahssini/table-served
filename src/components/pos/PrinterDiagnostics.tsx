import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Network, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { CapacitorHttp, Capacitor } from '@capacitor/core';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function PrinterDiagnostics() {
  const [testIP, setTestIP] = useState('192.168.0.156');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Platform Detection
      addResult({
        test: 'Platform Detection',
        status: 'success',
        message: `Running on ${Capacitor.getPlatform()} (${Capacitor.isNativePlatform() ? 'Native' : 'Web'})`
      });

      // Test 2: Network Connectivity (basic)
      try {
        const response = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        addResult({
          test: 'Internet Connectivity',
          status: 'success',
          message: `Connected (${response.status})`
        });
      } catch (error) {
        addResult({
          test: 'Internet Connectivity',
          status: 'error',
          message: `No internet: ${(error as Error).message}`
        });
      }

      // Test 3: Test different printer ports
      const ports = ['8008', '80', '631', '9100'];
      for (const port of ports) {
        try {
          console.log(`Testing ${testIP}:${port}`);
          
          if (Capacitor.isNativePlatform()) {
            // Use Capacitor HTTP for mobile
            const response = await CapacitorHttp.get({
              url: `http://${testIP}:${port}`,
              headers: {},
              connectTimeout: 3000,
              readTimeout: 3000
            });
            
            addResult({
              test: `Port ${port} Test`,
              status: 'success',
              message: `Connected! Status: ${response.status}`,
              details: response.headers
            });
          } else {
            // Use fetch for web (will likely fail due to CORS)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`http://${testIP}:${port}`, {
              method: 'GET',
              signal: controller.signal,
              mode: 'no-cors'
            });
            
            clearTimeout(timeoutId);
            
            addResult({
              test: `Port ${port} Test`,
              status: 'success',
              message: `Response received (${response.type})`
            });
          }
        } catch (error) {
          const errorMsg = (error as Error).message;
          const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('aborted');
          
          addResult({
            test: `Port ${port} Test`,
            status: isTimeout ? 'warning' : 'error',
            message: isTimeout ? 'Timeout (printer may be there)' : `Failed: ${errorMsg}`
          });
        }
      }

      // Test 4: Test Epson specific endpoints
      const epsonEndpoints = [
        '/cgi-bin/epos/service.cgi?devid=local_printer',
        '/cgi-bin/epos/service.cgi',
        '/status',
        '/'
      ];

      for (const endpoint of epsonEndpoints) {
        try {
          const url = `http://${testIP}:8008${endpoint}`;
          console.log(`Testing Epson endpoint: ${url}`);
          
          if (Capacitor.isNativePlatform()) {
            const response = await CapacitorHttp.get({
              url,
              headers: { 'User-Agent': 'ePOS SDK' },
              connectTimeout: 3000,
              readTimeout: 3000
            });
            
            addResult({
              test: `Epson Endpoint ${endpoint}`,
              status: 'success',
              message: `Response: ${response.status}`,
              details: { 
                status: response.status, 
                data: typeof response.data === 'string' ? response.data.substring(0, 100) + '...' : response.data
              }
            });
          } else {
            // For web, we can't test due to CORS
            addResult({
              test: `Epson Endpoint ${endpoint}`,
              status: 'warning',
              message: 'Cannot test from web (CORS restrictions)'
            });
          }
        } catch (error) {
          addResult({
            test: `Epson Endpoint ${endpoint}`,
            status: 'error',
            message: `Failed: ${(error as Error).message}`
          });
        }
      }

      // Test 5: Network info
      try {
        addResult({
          test: 'Local Network Info',
          status: 'success',
          message: `Testing IP: ${testIP}`,
          details: {
            userAgent: navigator.userAgent.substring(0, 100),
            language: navigator.language,
            onLine: navigator.onLine
          }
        });
      } catch (error) {
        addResult({
          test: 'Local Network Info',
          status: 'error',
          message: `Error: ${(error as Error).message}`
        });
      }

    } catch (error) {
      addResult({
        test: 'Diagnostic Error',
        status: 'error',
        message: `Unexpected error: ${(error as Error).message}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default">✓ Pass</Badge>;
      case 'warning':
        return <Badge variant="secondary">⚠ Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">✗ Fail</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Printer Network Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="diagnostic-ip">Printer IP Address</Label>
          <Input
            id="diagnostic-ip"
            value={testIP}
            onChange={(e) => setTestIP(e.target.value)}
            placeholder="192.168.0.156"
          />
        </div>

        <Button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            'Run Network Diagnostics'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Diagnostic Results:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-2 p-2 border rounded text-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.test}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-muted-foreground break-words">{result.message}</p>
                    {result.details && (
                      <pre className="text-xs bg-muted p-1 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This diagnostic will test various network endpoints and ports to identify connectivity issues with your printer.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}