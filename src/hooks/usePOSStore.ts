import { useState, useCallback, useEffect } from 'react';
import { Table, Order, MenuItem, OrderItem } from '@/types/pos';
import { initialTables } from '@/data/testData';
import { toast } from '@/hooks/use-toast';

export function usePOSStore() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [discountApplied, setDiscountApplied] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');

  const selectTable = useCallback((table: Table | null) => {
    setSelectedTable(table);
    setCurrentOrder(table?.currentOrder || null);
    setDiscountApplied(false);
    setDeliveryAddress('');
  }, []);

  const addItemToOrder = useCallback((menuItem: MenuItem, pastaType?: 'Spaghetti' | 'Tagliatelle' | 'Penne') => {
    if (!selectedTable) return;

    const orderId = currentOrder?.id || `order-${Date.now()}`;
    
    setCurrentOrder(prevOrder => {
      const existingOrder = prevOrder || {
        id: orderId,
        tableId: selectedTable.id,
        items: [],
        status: 'active' as const,
        createdAt: new Date(),
        total: 0
      };

      // For pasta items, check if same item with same pasta type exists
      const existingItemIndex = existingOrder.items.findIndex(
        item => item.menuItem.id === menuItem.id && 
        (menuItem.category !== 'pasta' || item.pastaType === pastaType)
      );

      let updatedItems: OrderItem[];
      
      if (existingItemIndex >= 0) {
        updatedItems = existingOrder.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const newItem: OrderItem = { menuItem, quantity: 1 };
        if (pastaType && menuItem.category === 'pasta') {
          newItem.pastaType = pastaType;
        }
        updatedItems = [...existingOrder.items, newItem];
      }

      const total = updatedItems.reduce((sum, item) => 
        sum + (item.menuItem.price * item.quantity), 0
      );

      const newOrder = {
        ...existingOrder,
        items: updatedItems,
        total
      };

      // Show toast notification
      const displayName = pastaType && menuItem.category === 'pasta' 
        ? `${menuItem.name} (${pastaType})`
        : menuItem.name;
      
      toast({
        title: "Toegevoegd",
        description: `${displayName} is toegevoegd aan de bestelling`,
      });

      return newOrder;
    });
  }, [selectedTable, currentOrder]);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (!currentOrder) return;

    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }

    setCurrentOrder(prevOrder => {
      if (!prevOrder) return null;

      const updatedItems = prevOrder.items.map(item =>
        item.menuItem.id === itemId
          ? { ...item, quantity }
          : item
      );

      const total = updatedItems.reduce((sum, item) => 
        sum + (item.menuItem.price * item.quantity), 0
      );

      return {
        ...prevOrder,
        items: updatedItems,
        total
      };
    });
  }, [currentOrder]);

  const removeItemFromOrder = useCallback((itemId: string) => {
    setCurrentOrder(prevOrder => {
      if (!prevOrder) return null;

      const updatedItems = prevOrder.items.filter(
        item => item.menuItem.id !== itemId
      );

      const total = updatedItems.reduce((sum, item) => 
        sum + (item.menuItem.price * item.quantity), 0
      );

      return {
        ...prevOrder,
        items: updatedItems,
        total
      };
    });
  }, []);

  const completeOrder = useCallback(() => {
    if (!currentOrder || !selectedTable) return;

    const completedOrder = {
      ...currentOrder,
      status: 'completed' as const
    };

    // Update table status
    setTables(prevTables =>
      prevTables.map(table =>
        table.id === selectedTable.id
          ? { ...table, status: 'available', currentOrder: undefined }
          : table
      )
    );

    // Clear current order and selected table
    setCurrentOrder(null);
    setSelectedTable(null);

    console.log('Order completed:', completedOrder);
  }, [currentOrder, selectedTable]);

  const cancelOrder = useCallback(() => {
    if (!selectedTable) return;

    // Update table status
    setTables(prevTables =>
      prevTables.map(table =>
        table.id === selectedTable.id
          ? { ...table, status: 'available', currentOrder: undefined }
          : table
      )
    );

    // Clear current order and selected table
    setCurrentOrder(null);
    setSelectedTable(null);
    setDiscountApplied(false);
  }, [selectedTable]);

  const toggleDiscount = useCallback(() => {
    if (!selectedTable || (selectedTable.id !== 999 && selectedTable.id !== 998)) return; // Only for takeaway and delivery
    setDiscountApplied(prev => !prev);
  }, [selectedTable]);

  // Update table with current order whenever order changes
  const updateTableWithOrder = useCallback(() => {
    if (!selectedTable || !currentOrder) return;

    setTables(prevTables =>
      prevTables.map(table =>
        table.id === selectedTable.id
          ? { 
              ...table, 
              status: 'occupied', 
              currentOrder: currentOrder
            }
          : table
      )
    );
  }, [selectedTable, currentOrder]);

  // Effect to update table when order changes
  useEffect(() => {
    updateTableWithOrder();
  }, [updateTableWithOrder]);

  return {
    tables,
    selectedTable,
    currentOrder,
    discountApplied,
    deliveryAddress,
    selectTable,
    addItemToOrder,
    updateItemQuantity,
    removeItemFromOrder,
    completeOrder,
    cancelOrder,
    toggleDiscount,
    setDeliveryAddress
  };
}