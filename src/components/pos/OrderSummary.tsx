import { useState } from 'react';
import { Order, OrderItem } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useEpsonPrinter } from '@/hooks/useEpsonPrinter';
import { useToast } from '@/hooks/use-toast';

interface OrderSummaryProps {
  order: Order | null;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCompleteOrder: () => void;
  onCancelOrder: () => void;
  isTakeaway?: boolean;
  discountApplied?: boolean;
  onToggleDiscount?: () => void;
}

export function OrderSummary({ 
  order, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCompleteOrder, 
  onCancelOrder,
  isTakeaway = false,
  discountApplied = false,
  onToggleDiscount
}: OrderSummaryProps) {
  const { toast } = useToast();
  const { isSDKReady, printTicket } = useEpsonPrinter();
  
  const handlePrintTicket = async () => {
    try {
      await printTicket(order, isTakeaway, discountApplied);
    } catch (error) {
      console.error('Print error:', error);
    }
  };

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

  const subtotal = order.items.reduce((sum, item) => 
    sum + (item.menuItem.price * item.quantity), 0
  );
  
  const discountAmount = isTakeaway && discountApplied ? subtotal * 0.15 : 0;
  const total = subtotal - discountAmount;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{isTakeaway ? 'Afhaal Bestelling' : `Tafel ${order.tableId} Bestelling`}</CardTitle>
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
          {isTakeaway && discountApplied && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotaal:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>15% Korting:</span>
                <span>-€{discountAmount.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Totaal:</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>

        {isTakeaway && onToggleDiscount && (
          <div className="mt-4">
            <Button 
              variant={discountApplied ? "default" : "outline"}
              onClick={onToggleDiscount}
              className="w-full"
            >
              {discountApplied ? '15% Korting Toegepast ✓' : '15% Korting Toepassen'}
            </Button>
          </div>
        )}

        {/* Print Options */}
        <div className="mt-6">
          <Button 
            onClick={handlePrintTicket}
            disabled={order.items.length === 0}
            className="w-full flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>

        <div className="flex gap-2 mt-4">
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
      </CardContent>
    </Card>
  );
}