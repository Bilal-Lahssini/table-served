import { MenuItem, Table, MenuCategory } from '@/types/pos';

export const menuItems: MenuItem[] = [
  // Drinks - Water
 {
  id: 'sides-1',
  name: 'Lookbrood natuur',
  description: '',
  price: 4.5,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-2',
  name: 'Lookbrood met kaas',
  description: '',
  price: 4.5,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-3',
  name: 'Lookbrood met kaas en ham',
  description: '',
  price: 5.5,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-4',
  name: 'Lookbrood met kaas en kebab',
  description: '',
  price: 5.5,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-5',
  name: 'Bruschetta tradizionale',
  description: '',
  price: 6.0,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-6',
  name: 'Bruschetta funghi',
  description: '',
  price: 6.0,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-7',
  name: 'Chicken wings',
  description: '',
  price: 7.0,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-8',
  name: 'Hot wings',
  description: '',
  price: 7.0,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-9',
  name: 'American potatoes',
  description: '',
  price: 6.0,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-10',
  name: 'Chicken tenders',
  description: '',
  price: 8.0,
  category: 'sides',
  subcategory: ''
},

{
  id: 'sides-11',
  name: 'Chicken nuggets',
  description: '',
  price: 6.0,
  category: 'sides',
  subcategory: ''
},

{
  id: 'pasta-1',
  name: 'Carbonara',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-2',
  name: 'Vegetariana',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-3',
  name: 'Curry Chicken',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-4',
  name: 'Pollo',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-5',
  name: 'Pesto Chicken',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-6',
  name: 'Diabolique',
  description: '',
  price: 14.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-7',
  name: 'Hot Pollo',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-8',
  name: 'Creamy Pollo',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-9',
  name: 'Cheesy Ham',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pasta-10',
  name: 'Lasagne Tradizioanle',
  description: '',
  price: 13.95,
  category: 'pasta',
  subcategory: ''
},

{
  id: 'pizza-1',
  name: 'Small Margherita',
  description: '',
  price: 11.95,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-2',
  name: 'Medium Margherita',
  description: '',
  price: 13.95,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-3',
  name: 'Large Margherita',
  description: '',
  price: 17.95,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-4',
  name: 'Small Pepes Roni',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-5',
  name: 'Medium Pepes Roni',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-6',
  name: 'Large Pepes Roni',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-7',
  name: 'Small Quattro Sangioni',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-8',
  name: 'Medium Quattro Sangioni',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-9',
  name: 'Large Quattro Sangioni',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-10',
  name: 'Small Funghi',
  description: '',
  price: 12.3,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-11',
  name: 'Medium Funghi',
  description: '',
  price: 14.3,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-12',
  name: 'Large Funghi',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-13',
  name: 'Small Tomatello',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-14',
  name: 'Medium Tomatello',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-15',
  name: 'Large Tomatello',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-16',
  name: 'Small Hawaiian Style',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-17',
  name: 'Medium Hawaiian Style',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-18',
  name: 'Large Hawaiian Style',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-19',
  name: 'Small Suavez',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-20',
  name: 'Medium Suavez',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-21',
  name: 'Large Suavez',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-22',
  name: 'Small Calzone',
  description: '',
  price: 12.7,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-23',
  name: 'Medium Calzone',
  description: '',
  price: 14.7,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-24',
  name: 'Large Calzone',
  description: '',
  price: 18.7,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-25',
  name: 'Small Creamy Chicken Broccoli',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-26',
  name: 'Medium Creamy Chicken Broccoli',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-27',
  name: 'Large Creamy Chicken Broccoli',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-28',
  name: 'Small Vegetariana',
  description: '',
  price: 12.7,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-29',
  name: 'Medium Vegetariana',
  description: '',
  price: 14.7,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-30',
  name: 'Large Vegetariana',
  description: '',
  price: 18.7,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-31',
  name: 'Small Chicken Curry',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-32',
  name: 'Medium Chicken Curry',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-33',
  name: 'Large Chicken Curry',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-34',
  name: 'Small Napolli',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-35',
  name: 'Medium Napolli',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-36',
  name: 'Large Napolli',
  description: '',
  price: 18.95,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-37',
  name: 'Small El Samourai',
  description: '',
  price: 12.9,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-38',
  name: 'Medium El Samourai',
  description: '',
  price: 14.9,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-39',
  name: 'Large El Samourai',
  description: '',
  price: 18.9,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: '-doner-kebab-1',
  name: 'Small Doner Kebab',
  description: '',
  price: 12.5,
  category: '# doner kebab',
  subcategory: ''
},

{
  id: '-doner-kebab-2',
  name: 'Medium Doner Kebab',
  description: '',
  price: 14.5,
  category: '# doner kebab',
  subcategory: ''
},

{
  id: '-doner-kebab-3',
  name: 'Large Doner Kebab',
  description: '',
  price: 18.5,
  category: '# doner kebab',
  subcategory: ''
},

{
  id: 'pizza-40',
  name: 'Small Meat Feast',
  description: '',
  price: 12.8,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-41',
  name: 'Medium Meat Feast',
  description: '',
  price: 14.8,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-42',
  name: 'Large Meat Feast',
  description: '',
  price: 18.8,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-43',
  name: 'Small Quattro Formaggi',
  description: '',
  price: 12.7,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-44',
  name: 'Medium Quattro Formaggi',
  description: '',
  price: 14.7,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-45',
  name: 'Large Quattro Formaggi',
  description: '',
  price: 18.7,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-46',
  name: 'Small Creamy Dreams',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-47',
  name: 'Medium Creamy Dreams',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-48',
  name: 'Large Creamy Dreams',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-49',
  name: 'Small Bolognese Tradizionale',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-50',
  name: 'Medium Bolognese Tradizionale',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-51',
  name: 'Large Bolognese Tradizionale',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-52',
  name: 'Small Bbq Chicken',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-53',
  name: 'Medium Bbq Chicken',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-54',
  name: 'Large Bbq Chicken',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-55',
  name: 'Small American',
  description: '',
  price: 12.9,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-56',
  name: 'Medium American',
  description: '',
  price: 14.9,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-57',
  name: 'Large American',
  description: '',
  price: 18.9,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-58',
  name: 'Small Spinacio',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-59',
  name: 'Medium Spinacio',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-60',
  name: 'Large Spinacio',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-61',
  name: 'Small Salmone di Pepe',
  description: '',
  price: 12.7,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-62',
  name: 'Medium Salmone di Pepe',
  description: '',
  price: 14.7,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-63',
  name: 'Large Salmone di Pepe',
  description: '',
  price: 18.7,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-64',
  name: 'Small Scampi',
  description: '',
  price: 12.8,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-65',
  name: 'Medium Scampi',
  description: '',
  price: 14.8,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-66',
  name: 'Large Scampi',
  description: '',
  price: 18.8,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-67',
  name: 'Small Tonno',
  description: '',
  price: 12.5,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-68',
  name: 'Medium Tonno',
  description: '',
  price: 14.5,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-69',
  name: 'Large Tonno',
  description: '',
  price: 18.5,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'pizza-70',
  name: 'Small Frutti di Mare',
  description: '',
  price: 12.8,
  category: 'pizza',
  subcategory: 'Small'
},

{
  id: 'pizza-71',
  name: 'Medium Frutti di Mare',
  description: '',
  price: 14.8,
  category: 'pizza',
  subcategory: 'Medium'
},

{
  id: 'pizza-72',
  name: 'Large Frutti di Mare',
  description: '',
  price: 18.8,
  category: 'pizza',
  subcategory: 'Large'
},

{
  id: 'drinks-1',
  name: 'Red Bull',
  description: '',
  price: 3.0,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-2',
  name: 'Coca Cola',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-3',
  name: 'Coca Cola Zero',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-4',
  name: 'Fanta',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-5',
  name: 'Sprite',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-6',
  name: 'Ice Tea',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-7',
  name: 'Ice Tea Green',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-8',
  name: 'Ice Tea Peach',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-9',
  name: 'Almdudler',
  description: '',
  price: 3.9,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-10',
  name: 'Schweppes Tonic',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-11',
  name: 'Schweppes Agrum',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-12',
  name: 'Looza',
  description: '',
  price: 2.7,
  category: 'drinks',
  subcategory: 'frisdranken'
},

{
  id: 'drinks-13',
  name: 'Limoncello',
  description: '',
  price: 6.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-14',
  name: 'Amaretto',
  description: '',
  price: 6.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-15',
  name: 'Martini Bianco',
  description: '',
  price: 6.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-16',
  name: 'Porto Rood/wit',
  description: '',
  price: 6.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-17',
  name: 'Baileys',
  description: '',
  price: 7.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-18',
  name: 'Campari',
  description: '',
  price: 7.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-19',
  name: 'Aperol',
  description: '',
  price: 7.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-20',
  name: 'Aperol Spritz',
  description: '',
  price: 9.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-21',
  name: 'Whiskey J&B',
  description: '',
  price: 8.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-22',
  name: 'Rum Havana Club Especial',
  description: '',
  price: 8.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-23',
  name: 'Gin Malfy',
  description: '',
  price: 8.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-24',
  name: 'Gin & Juice',
  description: '',
  price: 11.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-25',
  name: 'Cuba Libre',
  description: '',
  price: 11.0,
  category: 'drinks',
  subcategory: 'aperitief & sterke drank'
},

{
  id: 'drinks-26',
  name: 'Koffie',
  description: '',
  price: 3.0,
  category: 'drinks',
  subcategory: 'warme dranken'
},

{
  id: 'drinks-27',
  name: 'Espresso',
  description: '',
  price: 3.0,
  category: 'drinks',
  subcategory: 'warme dranken'
},

{
  id: 'drinks-28',
  name: 'Cappuccino',
  description: '',
  price: 4.0,
  category: 'drinks',
  subcategory: 'warme dranken'
},

{
  id: 'drinks-29',
  name: 'Latte Macchiato',
  description: '',
  price: 4.5,
  category: 'drinks',
  subcategory: 'warme dranken'
},

{
  id: 'drinks-30',
  name: 'Thee',
  description: '',
  price: 3.0,
  category: 'drinks',
  subcategory: 'warme dranken'
},

{
  id: 'drinks-31',
  name: 'Jupiler',
  description: '',
  price: 3.0,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-32',
  name: 'Jupiler 0.0%',
  description: '',
  price: 3.0,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-33',
  name: 'Bolleke (25cl)',
  description: '',
  price: 3.5,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-34',
  name: 'Lindemans Kriek',
  description: '',
  price: 3.5,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-35',
  name: 'Strongbow Cider',
  description: '',
  price: 3.5,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-36',
  name: 'Duvel',
  description: '',
  price: 4.0,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-37',
  name: 'La Chouffe',
  description: '',
  price: 4.0,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-38',
  name: 'Triple d Anvers',
  description: '',
  price: 4.0,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-39',
  name: 'Westmalle Dubbel',
  description: '',
  price: 4.0,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'drinks-40',
  name: 'Westmalle Triple',
  description: '',
  price: 4.0,
  category: 'drinks',
  subcategory: 'bier'
},

{
  id: 'desserts-1',
  name: 'Cheesecake',
  description: '',
  price: 7.0,
  category: 'desserts',
  subcategory: ''
},

{
  id: 'desserts-2',
  name: 'Tiramisu',
  description: '',
  price: 7.0,
  category: 'desserts',
  subcategory: ''
},

{
  id: 'drinks-41',
  name: 'Bianco (Witte Wijn)',
  description: '',
  price: 28.0,
  category: 'drinks',
  subcategory: 'wijn'
},

{
  id: 'drinks-42',
  name: 'Rosato (Rose wijn)',
  description: '',
  price: 28.0,
  category: 'drinks',
  subcategory: 'wijn'
},

{
  id: 'drinks-43',
  name: 'Rosso (Rode wijn)',
  description: '',
  price: 28.0,
  category: 'drinks',
  subcategory: 'wijn'
},

{
  id: 'drinks-44',
  name: 'Prosecco',
  description: '',
  price: 28.0,
  category: 'drinks',
  subcategory: 'wijn'
},

{
  id: 'drinks-45',
  name: 'Bianco Fles (Witte Wijn)',
  description: '',
  price: 35.0,
  category: 'drinks',
  subcategory: 'wijn'
},

{
  id: 'drinks-46',
  name: 'Rosato Fles (Rose wijn)',
  description: '',
  price: 37.0,
  category: 'drinks',
  subcategory: 'wijn'
},

{
  id: 'drinks-47',
  name: 'Rosso Fles (Rode wijn)',
  description: '',
  price: 36.0,
  category: 'drinks',
  subcategory: 'wijn'
},

{
  id: 'drinks-48',
  name: 'Spumante (Bruiswijnen)',
  description: '',
  price: 31.0,
  category: 'drinks',
  subcategory: 'wijn'
},

{
  id: 'drinks-49',
  name: 'Spa Plat',
  description: '',
  price: 2.70,
  category: 'drinks',
  subcategory: 'water'
},

{
  id: 'drinks-50',
  name: 'Spa Bruis',
  description: '',
  price: 2.70,
  category: 'drinks',
  subcategory: 'water'
},

{
  id: 'drinks-51',
  name: 'Spa 0.5L',
  description: '',
  price: 5.00,
  category: 'drinks',
  subcategory: 'water'
},
];

export const initialTables: Table[] = [
  { id: 1, name: 'Tafel 1', status: 'available' },
  { id: 2, name: 'Tafel 2', status: 'available' },
  { id: 3, name: 'Tafel 3', status: 'available' },
  { id: 4, name: 'Tafel 4', status: 'available' },
  { id: 5, name: 'Tafel 5', status: 'available' },
  { id: 6, name: 'Tafel 6', status: 'available' },
  { id: 999, name: 'Afhaal', status: 'available' }
];

export const menuCategories: { id: MenuCategory; name: string; icon: string }[] = [
  { id: 'drinks', name: 'Dranken', icon: '🥤' },
  { id: 'sides', name: 'Sides', icon: '🥗' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'pasta', name: 'Pasta', icon: '🍝' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' }
];