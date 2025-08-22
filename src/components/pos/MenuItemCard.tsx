import { MenuItem } from '@/types/pos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem, pastaType?: 'Spaghetti' | 'Tagliatelle' | 'Penne') => void;
}

export function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  const [selectedPastaType, setSelectedPastaType] = useState<'Spaghetti' | 'Tagliatelle' | 'Penne'>('Spaghetti');
  const isPasta = item.category === 'pasta';

  const handleAddToOrder = () => {
    if (isPasta) {
      onAddToOrder(item, selectedPastaType);
    } else {
      onAddToOrder(item);
    }
  };

  const handlePastaTypeChange = (value: string) => {
    setSelectedPastaType(value as 'Spaghetti' | 'Tagliatelle' | 'Penne');
  };

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
        
        {isPasta && (
          <div className="mb-3">
            <label className="text-sm font-medium mb-2 block">Pasta Type:</label>
            <Select value={selectedPastaType} onValueChange={handlePastaTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spaghetti">Spaghetti</SelectItem>
                <SelectItem value="Tagliatelle">Tagliatelle</SelectItem>
                <SelectItem value="Penne">Penne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Button 
          onClick={handleAddToOrder}
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