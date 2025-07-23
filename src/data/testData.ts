import { MenuItem, Table, MenuCategory } from '@/types/pos';

export const menuItems: MenuItem[] = [
  // Drinks
  {
    id: 'drink-1',
    name: 'Coca Cola',
    description: 'Classic soft drink',
    price: 2.50,
    category: 'drinks'
  },
  {
    id: 'drink-2',
    name: 'Italian Wine',
    description: 'House red wine',
    price: 8.00,
    category: 'drinks'
  },
  {
    id: 'drink-3',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice',
    price: 4.50,
    category: 'drinks'
  },
  {
    id: 'drink-4',
    name: 'Espresso',
    description: 'Traditional Italian coffee',
    price: 2.00,
    category: 'drinks'
  },

  // Sides
  {
    id: 'side-1',
    name: 'Garlic Bread',
    description: 'Homemade bread with garlic butter',
    price: 5.50,
    category: 'sides'
  },
  {
    id: 'side-2',
    name: 'Caesar Salad',
    description: 'Crisp romaine with parmesan and croutons',
    price: 8.50,
    category: 'sides'
  },
  {
    id: 'side-3',
    name: 'Bruschetta',
    description: 'Toasted bread with tomatoes and basil',
    price: 6.50,
    category: 'sides'
  },
  {
    id: 'side-4',
    name: 'Mozzarella Sticks',
    description: 'Crispy fried mozzarella with marinara',
    price: 7.00,
    category: 'sides'
  },

  // Pizza
  {
    id: 'pizza-1',
    name: 'Margherita',
    description: 'Classic tomato, mozzarella, and basil',
    price: 14.50,
    category: 'pizza'
  },
  {
    id: 'pizza-2',
    name: 'Pepperoni',
    description: 'Tomato sauce, mozzarella, and pepperoni',
    price: 16.50,
    category: 'pizza'
  },
  {
    id: 'pizza-3',
    name: 'Quattro Stagioni',
    description: 'Four seasons with mushrooms, artichokes, ham, and olives',
    price: 18.50,
    category: 'pizza'
  },
  {
    id: 'pizza-4',
    name: 'Hawaiian',
    description: 'Ham and pineapple with mozzarella',
    price: 17.00,
    category: 'pizza'
  },

  // Pasta
  {
    id: 'pasta-1',
    name: 'Spaghetti Carbonara',
    description: 'Classic Roman pasta with eggs, cheese, and pancetta',
    price: 15.50,
    category: 'pasta'
  },
  {
    id: 'pasta-2',
    name: 'Penne Arrabbiata',
    description: 'Spicy tomato sauce with garlic and chili',
    price: 13.50,
    category: 'pasta'
  },
  {
    id: 'pasta-3',
    name: 'Lasagna',
    description: 'Layered pasta with meat sauce and cheese',
    price: 16.50,
    category: 'pasta'
  },
  {
    id: 'pasta-4',
    name: 'Fettuccine Alfredo',
    description: 'Creamy white sauce with parmesan',
    price: 14.50,
    category: 'pasta'
  },

  // Desserts
  {
    id: 'dessert-1',
    name: 'Tiramisu',
    description: 'Classic Italian coffee-flavored dessert',
    price: 6.50,
    category: 'desserts'
  },
  {
    id: 'dessert-2',
    name: 'Cannoli',
    description: 'Sicilian pastry with sweet ricotta filling',
    price: 5.50,
    category: 'desserts'
  },
  {
    id: 'dessert-3',
    name: 'Panna Cotta',
    description: 'Vanilla custard with berry sauce',
    price: 6.00,
    category: 'desserts'
  }
];

export const initialTables: Table[] = [
  { id: 1, name: 'Table 1', status: 'available' },
  { id: 2, name: 'Table 2', status: 'available' },
  { id: 3, name: 'Table 3', status: 'available' },
  { id: 4, name: 'Table 4', status: 'available' },
  { id: 5, name: 'Table 5', status: 'available' }
];

export const menuCategories: { id: MenuCategory; name: string; icon: string }[] = [
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'sides', name: 'Sides', icon: '🥗' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'pasta', name: 'Pasta', icon: '🍝' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' }
];