import { useState } from 'react';
import { MenuCategory } from '@/types/pos';
import { menuItems, menuCategories } from '@/data/testData';
import { usePOSStore } from '@/hooks/usePOSStore';
import { TableCard } from '@/components/pos/TableCard';
import { MenuItemCard } from '@/components/pos/MenuItemCard';
import { OrderSummary } from '@/components/pos/OrderSummary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function POS() {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('drinks');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  const {
    tables,
    selectedTable,
    currentOrder,
    selectTable,
    addItemToOrder,
    updateItemQuantity,
    removeItemFromOrder,
    completeOrder,
    cancelOrder
  } = usePOSStore();

  const subcategories = {
    drinks: ['water', 'frisdranken', 'warme dranken', 'wijn', 'bier', 'aperitief & sterke drank'],
    pizza: ['Small', 'Medium', 'Large'],
    sides: [],
    pasta: [],
    desserts: []
  };

  const handleCategoryChange = (category: MenuCategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.category !== selectedCategory) return false;
    if (selectedSubcategory && item.subcategory !== selectedSubcategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pepe's KassaSysteem</h1>
          <p className="text-muted-foreground">Gemaakt door Bilal </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Tables Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Tables Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Tafels
                  <Badge variant="secondary">
                    {tables.filter(t => t.status === 'occupied').length}/{tables.length} Bezet
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      onClick={selectTable}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Menu Section */}
            {selectedTable && (
              <Card>
                <CardHeader>
                  <CardTitle>Menu - Tafel {selectedTable.id}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {menuCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        onClick={() => handleCategoryChange(category.id)}
                        className="flex items-center gap-2"
                      >
                        <span>{category.icon}</span>
                        {category.name}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Subcategories */}
                  {subcategories[selectedCategory].length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant={selectedSubcategory === null ? "default" : "outline"}
                        onClick={() => setSelectedSubcategory(null)}
                        size="sm"
                      >
                        Alle {selectedCategory}
                      </Button>
                      {subcategories[selectedCategory].map((subcategory) => (
                        <Button
                          key={subcategory}
                          variant={selectedSubcategory === subcategory ? "default" : "outline"}
                          onClick={() => setSelectedSubcategory(subcategory)}
                          size="sm"
                          className="capitalize"
                        >
                          {subcategory}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMenuItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToOrder={addItemToOrder}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <OrderSummary
                order={currentOrder}
                onUpdateQuantity={updateItemQuantity}
                onRemoveItem={removeItemFromOrder}
                onCompleteOrder={completeOrder}
                onCancelOrder={cancelOrder}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}