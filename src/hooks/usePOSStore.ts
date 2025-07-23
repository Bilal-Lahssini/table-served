import { useState, useCallback, useEffect } from 'react';
import { Table, Order, MenuItem, OrderItem } from '@/types/pos';
import { initialTables } from '@/data/testData';

export function usePOSStore() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const selectTable = useCallback((table: Table) => {
    setSelectedTable(table);
    setCurrentOrder(table.currentOrder || null);
  }, []);

  const addItemToOrder = useCallback((menuItem: MenuItem) => {
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

      const existingItemIndex = existingOrder.items.findIndex(
        item => item.menuItem.id === menuItem.id
      );

      let updatedItems: OrderItem[];
      
      if (existingItemIndex >= 0) {
        updatedItems = existingOrder.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedItems = [...existingOrder.items, { menuItem, quantity: 1 }];
      }

      const total = updatedItems.reduce((sum, item) => 
        sum + (item.menuItem.price * item.quantity), 0
      );

      return {
        ...existingOrder,
        items: updatedItems,
        total
      };
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
    selectTable,
    addItemToOrder,
    updateItemQuantity,
    removeItemFromOrder,
    completeOrder,
    cancelOrder
  };
}