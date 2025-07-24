import { MenuItem } from '@/types/pos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-base mb-1">{item.name}</h4>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {item.description}
            </p>
            <div className="text-lg font-bold text-primary">
              €{item.price.toFixed(2)}
            </div>
          </div>
        </div>
        <Button 
          onClick={() => onAddToOrder(item)}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Toevoegen aan Bestelling
        </Button>
      </CardContent>
    </Card>
  );
}