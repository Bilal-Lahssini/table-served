import { useState } from 'react';
import { Order, OrderItem } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, Copy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface OrderSummaryProps {
  order: Order | null;
  onUpdateQuantity: (itemIndex: number, quantity: number) => void;
  onRemoveItem: (itemIndex: number) => void;
  onCompleteOrder: () => void;
  onCancelOrder: () => void;
  isTakeaway?: boolean;
  isDelivery?: boolean;
  discountApplied?: boolean;
  onToggleDiscount?: () => void;
  deliveryAddress?: string;
  onDeliveryAddressChange?: (address: string) => void;
}

export function OrderSummary({ 
  order, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCompleteOrder, 
  onCancelOrder,
  isTakeaway = false,
  isDelivery = false,
  discountApplied = false,
  onToggleDiscount,
  deliveryAddress = '',
  onDeliveryAddressChange
}: OrderSummaryProps) {
  const { toast } = useToast();
  
  
  const handlePrintTicket = async () => {
    try {
      console.log('Print functionality removed - use copy receipt instead');
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const handleConnect = async (ipAddress: string) => {
    try {
      console.log('Connect functionality removed - use copy receipt instead');
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const formatReceiptForTMUtility = () => {
    if (!order) return '';
    
    const now = new Date();
    const date = now.toLocaleDateString('nl-NL');
    const time = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    let receipt = '';
    
    // Header
    receipt += '----------------------------------------\n';
    receipt += "PEPE'S RESTAURANT\n";
    receipt += '================================\n';
    receipt += `Datum: ${date} Tijd: ${time}\n`;
    
    if (isDelivery) {
      receipt += `Bestelling: LEVERING\n`;
      if (deliveryAddress.trim()) {
        receipt += `**ADRES: ${deliveryAddress.trim()}**\n`;
      }
    } else {
      receipt += `Bestelling: ${isTakeaway ? 'AFHAAL' : `TAFEL ${order.tableId}`}\n`;
    }
    
    receipt += `Order ID: ${order.id.substring(0, 8)}\n`;
    receipt += '--------------------------------\n';
    receipt += '\n';
    
    // Items section
    receipt += 'BESTELLING:\n';
    order.items.forEach((item) => {
      const itemPrice = item.menuItem.price + (item.sizePrice || 0);
      const itemTotal = itemPrice * item.quantity;
      let itemName = item.menuItem.name;
      if (item.size) itemName += ` (${item.size})`;
      if (item.pastaType && item.menuItem.category === 'pasta') itemName += ` - ${item.pastaType}`;
      receipt += `${item.quantity}x ${itemName}\n`;
      receipt += `€${itemPrice.toFixed(2)} x ${item.quantity} = €${itemTotal.toFixed(2)}\n`;
      receipt += '\n';
    });
    
    // Totals
    receipt += '--------------------------------\n';
    
    if ((isTakeaway || isDelivery) && discountApplied) {
      receipt += `Subtotaal: €${subtotal.toFixed(2)}\n`;
      receipt += `15% Korting: -€${discountAmount.toFixed(2)}\n`;
      receipt += '--------------------------------\n';
    }
    
    receipt += `TOTAAL: €${total.toFixed(2)}\n`;
    receipt += '\n';
    receipt += 'Bedankt voor uw bezoek!\n';
    receipt += 'Tot ziens!\n';
    receipt += '\n';
    receipt += '--- CUT HERE ---\n';
    receipt += '----------------------------------------\n';
    
    return receipt;
  };

  const handleCopyReceipt = async () => {
    try {
      const receiptText = formatReceiptForTMUtility();
      await navigator.clipboard.writeText(receiptText);
      toast({
        title: "Receipt Copied!",
        description: "Receipt text copied to clipboard. You can now paste it in TM Utility.",
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive"
      });
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
    sum + ((item.menuItem.price + (item.sizePrice || 0)) * item.quantity), 0
  );
  
  const discountAmount = (isTakeaway || isDelivery) && discountApplied ? subtotal * 0.15 : 0;
  const total = subtotal - discountAmount;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {isDelivery ? 'Levering Bestelling' : 
             isTakeaway ? 'Afhaal Bestelling' : 
             `Tafel ${order.tableId} Bestelling`}
          </CardTitle>
          <Badge variant="secondary">
            {order.status === 'active' ? 'Actief' : order.status === 'completed' ? 'Voltooid' : 'Geannuleerd'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Delivery Address Input */}
        {isDelivery && onDeliveryAddressChange && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <label htmlFor="delivery-address" className="text-sm font-medium block mb-2">
              Leveradres *
            </label>
            <Input
              id="delivery-address"
              placeholder="Voer het leveradres in..."
              value={deliveryAddress}
              onChange={(e) => onDeliveryAddressChange(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        <div className="flex-1 space-y-4 mb-6">
          {order.items.map((orderItem, index) => {
            const itemPrice = orderItem.menuItem.price + (orderItem.sizePrice || 0);
            return (
              <div key={`${orderItem.menuItem.id}-${orderItem.size || 'default'}-${orderItem.pastaType || 'default'}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">
                    {orderItem.menuItem.name}
                    {orderItem.size && (
                      <span className="text-sm text-muted-foreground ml-2">({orderItem.size})</span>
                    )}
                    {orderItem.pastaType && (
                      <span className="text-sm text-muted-foreground ml-2">- {orderItem.pastaType}</span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    €{itemPrice.toFixed(2)} per stuk
                    {orderItem.sizePrice && orderItem.sizePrice > 0 && (
                      <span className="ml-1">(+€{orderItem.sizePrice.toFixed(2)} maat)</span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(index, orderItem.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="w-8 text-center font-medium">
                    {orderItem.quantity}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(index, orderItem.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Separator />
          {(isTakeaway || isDelivery) && discountApplied && (
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

        {(isTakeaway || isDelivery) && onToggleDiscount && (
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

        {/* Copy Receipt for TM Utility */}
        <Button 
          onClick={handleCopyReceipt}
          disabled={order.items.length === 0}
          className="w-full flex items-center gap-2 mt-4"
          variant="outline"
        >
          <Copy className="h-4 w-4" />
          📋 Copy Receipt for TM Utility
        </Button>

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
            disabled={order.items.length === 0 || (isDelivery && !deliveryAddress.trim())}
          >
            Voltooi Bestelling
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}