import { Order, OrderItem } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, Bluetooth, Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';

interface OrderSummaryProps {
  order: Order | null;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCompleteOrder: () => void;
  onCancelOrder: () => void;
}

export function OrderSummary({ 
  order, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCompleteOrder, 
  onCancelOrder 
}: OrderSummaryProps) {
  const { isConnected, isConnecting, connectPrinter, disconnectPrinter, printReceipt } = useBluetoothPrinter();
  if (!order) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Bestelling Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Selecteer een tafel om een bestelling te starten
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = order.items.reduce((sum, item) => 
    sum + (item.menuItem.price * item.quantity), 0
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tafel {order.tableId} Bestelling</CardTitle>
          <Badge variant="secondary">
            {order.status === 'active' ? 'Actief' : order.status === 'completed' ? 'Voltooid' : 'Geannuleerd'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4 mb-6">
          {order.items.map((orderItem) => (
            <div key={orderItem.menuItem.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{orderItem.menuItem.name}</h4>
                <p className="text-sm text-muted-foreground">
                  €{orderItem.menuItem.price.toFixed(2)} per stuk
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(orderItem.menuItem.id, orderItem.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <span className="w-8 text-center font-medium">
                  {orderItem.quantity}
                </span>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(orderItem.menuItem.id, orderItem.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveItem(orderItem.menuItem.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Totaal:</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancelOrder}
              className="flex-1"
            >
              Annuleer Bestelling
            </Button>
            <Button 
              onClick={onCompleteOrder}
              className="flex-1"
              disabled={order.items.length === 0}
            >
              Voltooi Bestelling
            </Button>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={isConnected ? disconnectPrinter : connectPrinter}
              disabled={isConnecting}
              className="w-full flex items-center gap-2"
            >
              <Bluetooth className="h-4 w-4" />
              {isConnecting ? 'Verbinden...' : isConnected ? 'Printer Ontkoppelen' : 'Bluetooth Printer Verbinden'}
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-sm">
              {isConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Printer Verbonden</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Geen Printer Verbonden</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}