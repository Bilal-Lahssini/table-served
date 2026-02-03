import { MenuItem, SizeOption } from '@/types/pos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem, pastaType?: 'Spaghetti' | 'Tagliatelle' | 'Penne', size?: SizeOption, sizePrice?: number) => void;
}

// Check if item should have size options
const shouldHaveSizeOption = (item: MenuItem): boolean => {
  // Margherita pizzas don't have size price increments
  if (item.name.toLowerCase().includes('margherita')) return false;
  // All other pizzas and pastas have size options
  return item.category === 'pizza' || item.category === 'pasta';
};

// Get price increment based on item
const getSizeIncrement = (item: MenuItem): number => {
  // Diabolique pasta has €2 increment
  if (item.name.toLowerCase().includes('diabolique')) return 2;
  // All others have €1 increment
  return 1;
};

// Calculate size price
const getSizePrice = (size: SizeOption, increment: number): number => {
  switch (size) {
    case 'Small': return 0;
    case 'Medium': return increment;
    case 'Large': return increment * 2;
    default: return 0;
  }
};

export function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  const [selectedPastaType, setSelectedPastaType] = useState<'Spaghetti' | 'Tagliatelle' | 'Penne'>('Spaghetti');
  const [selectedSize, setSelectedSize] = useState<SizeOption>('Small');
  
  const isPasta = item.category === 'pasta';
  const hasSizeOption = shouldHaveSizeOption(item);
  const sizeIncrement = getSizeIncrement(item);

  const handleAddToOrder = () => {
    const sizePrice = hasSizeOption ? getSizePrice(selectedSize, sizeIncrement) : 0;
    if (isPasta) {
      onAddToOrder(item, selectedPastaType, hasSizeOption ? selectedSize : undefined, sizePrice);
    } else {
      onAddToOrder(item, undefined, hasSizeOption ? selectedSize : undefined, sizePrice);
    }
  };

  const handlePastaTypeChange = (value: string) => {
    setSelectedPastaType(value as 'Spaghetti' | 'Tagliatelle' | 'Penne');
  };

  const handleSizeChange = (value: string) => {
    setSelectedSize(value as SizeOption);
  };

  const currentSizePrice = hasSizeOption ? getSizePrice(selectedSize, sizeIncrement) : 0;
  const displayPrice = item.price + currentSizePrice;

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
              €{displayPrice.toFixed(2)}
              {hasSizeOption && currentSizePrice > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  (+€{currentSizePrice.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Size Selection for Pizza & Pasta (except Margherita) */}
        {hasSizeOption && (
          <div className="mb-3">
            <label className="text-sm font-medium mb-2 block">
              Maat: (+€{sizeIncrement} per maat)
            </label>
            <Select value={selectedSize} onValueChange={handleSizeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Small">Small (basis)</SelectItem>
                <SelectItem value="Medium">Medium (+€{sizeIncrement})</SelectItem>
                <SelectItem value="Large">Large (+€{sizeIncrement * 2})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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