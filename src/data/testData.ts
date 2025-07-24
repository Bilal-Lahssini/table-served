import { MenuItem, Table, MenuCategory } from '@/types/pos';

export const menuItems: MenuItem[] = [
  // Drinks - Water
  {
    id: 'drink-1',
    name: 'Sparkling Water',
    description: 'San Pellegrino sparkling water',
    price: 2.50,
    category: 'drinks',
    subcategory: 'water'
  },
  {
    id: 'drink-2',
    name: 'Still Water',
    description: 'Natural mineral water',
    price: 2.00,
    category: 'drinks',
    subcategory: 'water'
  },

  // Drinks - Soft Drinks
  {
    id: 'drink-3',
    name: 'Coca Cola',
    description: 'Classic soft drink',
    price: 2.80,
    category: 'drinks',
    subcategory: 'softdrinks'
  },
  {
    id: 'drink-4',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice',
    price: 4.50,
    category: 'drinks',
    subcategory: 'softdrinks'
  },

  // Drinks - Hot Drinks
  {
    id: 'drink-5',
    name: 'Espresso',
    description: 'Traditional Italian coffee',
    price: 2.20,
    category: 'drinks',
    subcategory: 'hot drinks'
  },
  {
    id: 'drink-6',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk foam',
    price: 3.00,
    category: 'drinks',
    subcategory: 'hot drinks'
  },

  // Drinks - Wine
  {
    id: 'drink-7',
    name: 'Italian Red Wine',
    description: 'House red wine from Tuscany',
    price: 8.00,
    category: 'drinks',
    subcategory: 'wine'
  },
  {
    id: 'drink-8',
    name: 'Prosecco',
    description: 'Italian sparkling wine',
    price: 9.50,
    category: 'drinks',
    subcategory: 'wine'
  },

  // Drinks - Beer
  {
    id: 'drink-9',
    name: 'Peroni',
    description: 'Italian lager beer',
    price: 4.00,
    category: 'drinks',
    subcategory: 'beers'
  },
  {
    id: 'drink-10',
    name: 'Corona',
    description: 'Mexican beer with lime',
    price: 4.50,
    category: 'drinks',
    subcategory: 'beers'
  },

  // Drinks - Aperitive & Spirits
  {
    id: 'drink-11',
    name: 'Aperol Spritz',
    description: 'Italian aperitif with Prosecco',
    price: 7.50,
    category: 'drinks',
    subcategory: 'aperitive & spirits'
  },
  {
    id: 'drink-12',
    name: 'Limoncello',
    description: 'Traditional Italian lemon liqueur',
    price: 5.00,
    category: 'drinks',
    subcategory: 'aperitive & spirits'
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

  // Pizza - Small
  {
    id: 'pizza-1-small',
    name: 'Margherita',
    description: 'Classic tomato, mozzarella, and basil',
    price: 9.50,
    category: 'pizza',
    subcategory: 'small'
  },
  {
    id: 'pizza-2-small',
    name: 'Pepperoni',
    description: 'Tomato sauce, mozzarella, and pepperoni',
    price: 11.50,
    category: 'pizza',
    subcategory: 'small'
  },

  // Pizza - Medium
  {
    id: 'pizza-1-medium',
    name: 'Margherita',
    description: 'Classic tomato, mozzarella, and basil',
    price: 14.50,
    category: 'pizza',
    subcategory: 'medium'
  },
  {
    id: 'pizza-2-medium',
    name: 'Pepperoni',
    description: 'Tomato sauce, mozzarella, and pepperoni',
    price: 16.50,
    category: 'pizza',
    subcategory: 'medium'
  },
  {
    id: 'pizza-3-medium',
    name: 'Quattro Stagioni',
    description: 'Four seasons with mushrooms, artichokes, ham, and olives',
    price: 18.50,
    category: 'pizza',
    subcategory: 'medium'
  },

  // Pizza - Large
  {
    id: 'pizza-1-large',
    name: 'Margherita',
    description: 'Classic tomato, mozzarella, and basil',
    price: 18.50,
    category: 'pizza',
    subcategory: 'large'
  },
  {
    id: 'pizza-2-large',
    name: 'Pepperoni',
    description: 'Tomato sauce, mozzarella, and pepperoni',
    price: 21.50,
    category: 'pizza',
    subcategory: 'large'
  },
  {
    id: 'pizza-3-large',
    name: 'Quattro Stagioni',
    description: 'Four seasons with mushrooms, artichokes, ham, and olives',
    price: 24.50,
    category: 'pizza',
    subcategory: 'large'
  },
  {
    id: 'pizza-4-large',
    name: 'Hawaiian',
    description: 'Ham and pineapple with mozzarella',
    price: 22.00,
    category: 'pizza',
    subcategory: 'large'
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
  { id: 1, name: 'Tafel 1', status: 'available' },
  { id: 2, name: 'Tafel 2', status: 'available' },
  { id: 3, name: 'Tafel 3', status: 'available' },
  { id: 4, name: 'Tafel 4', status: 'available' },
  { id: 5, name: 'Tafel 5', status: 'available' }
];

export const menuCategories: { id: MenuCategory; name: string; icon: string }[] = [
  { id: 'drinks', name: 'Dranken', icon: '🥤' },
  { id: 'sides', name: 'Bijgerechten', icon: '🥗' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'pasta', name: 'Pasta', icon: '🍝' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' }
];