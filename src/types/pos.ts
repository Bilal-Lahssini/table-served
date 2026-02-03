export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  image?: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  pastaType?: 'Spaghetti' | 'Tagliatelle' | 'Penne';
}

export interface Order {
  id: string;
  tableId: number;
  items: OrderItem[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  total: number;
}

export interface Table {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
  currentOrder?: Order;
}

export type MenuCategory = 'drinks' | 'sides' | 'pizza' | 'pasta' | 'desserts';