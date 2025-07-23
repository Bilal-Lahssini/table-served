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

  const filteredMenuItems = menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Restaurant POS System</h1>
          <p className="text-muted-foreground">Manage tables, orders, and menu items</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Tables Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Tables Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Restaurant Tables
                  <Badge variant="secondary">
                    {tables.filter(t => t.status === 'occupied').length}/{tables.length} Occupied
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
                  <CardTitle>Menu - Table {selectedTable.id}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {menuCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex items-center gap-2"
                      >
                        <span>{category.icon}</span>
                        {category.name}
                      </Button>
                    ))}
                  </div>
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