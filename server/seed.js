require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const connectDB = require('./config/db');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Setting = require('./models/Setting');

const categories = [
  { name: 'Bangles', codePrefix: 'BA' },
  { name: 'Chains', codePrefix: 'CH' },
  { name: 'Rings', codePrefix: 'RI' },
  { name: 'Earrings', codePrefix: 'EA' },
  { name: 'Necklaces', codePrefix: 'NE' },
  { name: 'Anklets', codePrefix: 'AN' },
];

const productTemplates = [
  {
    name: 'Hammered Gold Bangle',
    description: 'Hand-hammered 22kt gold bangle with a brushed finish. Each piece is uniquely textured, making it a one-of-a-kind addition to your collection.',
    price: 28500,
    images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80'],
    material: 'Gold',
    category: 'Bangles',
    inStock: true,
    featured: true,
  },
  {
    name: 'Floral Kundan Bangle Set',
    description: 'A set of 4 intricately carved kundan bangles with floral motifs. Perfect for weddings and festive occasions.',
    price: 42000,
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'],
    material: 'Gold with Kundan',
    category: 'Bangles',
    inStock: true,
    featured: false,
  },
  {
    name: 'Slim Everyday Bangle',
    description: 'A delicate slim bangle in 18kt yellow gold. Minimalist design that pairs beautifully with other bangles or worn alone.',
    price: 14500,
    images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80'],
    material: 'Gold',
    category: 'Bangles',
    inStock: false,
    featured: false,
  },
  {
    name: 'Rope Twist Gold Chain',
    description: 'Classic rope-twist chain in 22kt gold. 18 inches with a secure lobster clasp. Timeless design suitable for any occasion.',
    price: 35000,
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'],
    material: 'Gold',
    category: 'Chains',
    inStock: true,
    featured: true,
  },
  {
    name: 'Box Link Chain',
    description: 'Elegant box link chain with a modern geometric pattern. Available in 18kt gold with a smooth polished finish.',
    price: 22000,
    images: ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80'],
    material: 'Gold',
    category: 'Chains',
    inStock: true,
    featured: false,
  },
  {
    name: 'Diamond-Cut Figaro Chain',
    description: 'Italian figaro chain with diamond-cut links for exceptional light reflection. 22kt gold, 20 inches.',
    price: 48000,
    images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'],
    material: 'Gold',
    category: 'Chains',
    inStock: true,
    featured: false,
  },
  {
    name: 'Solitaire Diamond Ring',
    description: 'Timeless solitaire ring featuring a 0.5ct round brilliant diamond set in 18kt white gold. A classic symbol of elegance.',
    price: 125000,
    images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'],
    material: 'White Gold',
    category: 'Rings',
    inStock: true,
    featured: true,
  },
  {
    name: 'Floral Meenakari Ring',
    description: 'Traditional meenakari ring with vibrant enamel work in floral patterns. Set in 22kt gold with a comfortable band.',
    price: 18500,
    images: ['https://images.unsplash.com/photo-1589407499289-c16be8a82a7f?w=800&q=80'],
    material: 'Gold with Enamel',
    category: 'Rings',
    inStock: true,
    featured: false,
  },
  {
    name: 'Twisted Band Ring',
    description: 'Modern twisted band ring in 18kt rose gold. Comfortable fit with a unique sculptural form.',
    price: 16000,
    images: ['https://images.unsplash.com/photo-1573408301185-9519f94b3c9c?w=800&q=80'],
    material: 'Rose Gold',
    category: 'Rings',
    inStock: false,
    featured: false,
  },
  {
    name: 'Pearl Drop Earrings',
    description: 'Classic pearl drop earrings with freshwater pearls set in 22kt gold. Elegant and timeless for all occasions.',
    price: 22000,
    images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80'],
    material: 'Gold with Pearls',
    category: 'Earrings',
    inStock: true,
    featured: true,
  },
  {
    name: 'Gold Jhumka',
    description: 'Traditional south Indian jhumka earrings in 22kt gold with intricate filigree work and ruby accents.',
    price: 34000,
    images: ['https://images.unsplash.com/photo-1630012636810-c5a4c9668d5b?w=800&q=80'],
    material: 'Gold with Rubies',
    category: 'Earrings',
    inStock: true,
    featured: false,
  },
  {
    name: 'Diamond Stud Earrings',
    description: 'Classic round brilliant diamond studs, 0.30ct each, set in 18kt white gold with secure screw backs.',
    price: 85000,
    images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80'],
    material: 'White Gold with Diamonds',
    category: 'Earrings',
    inStock: true,
    featured: false,
  },
  {
    name: 'Layered Mangalsutra',
    description: 'Contemporary layered mangalsutra in 22kt gold with black beads and a diamond-studded pendant. Modern take on tradition.',
    price: 65000,
    images: ['https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80'],
    material: 'Gold with Diamonds',
    category: 'Necklaces',
    inStock: true,
    featured: true,
  },
  {
    name: 'Choker Necklace',
    description: 'Elegant gold choker with intricate mesh work. Sits close to the neck for a royal appearance.',
    price: 55000,
    images: ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80'],
    material: 'Gold',
    category: 'Necklaces',
    inStock: true,
    featured: false,
  },
  {
    name: 'Delicate Anklet',
    description: 'Lightweight 22kt gold anklet with tiny bell charms. Traditional design with a modern minimalist twist.',
    price: 12000,
    images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'],
    material: 'Gold',
    category: 'Anklets',
    inStock: true,
    featured: false,
  },
];

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Setting.deleteMany({});

  console.log('Seeding categories...');
  const createdCats = await Category.insertMany(categories);
  const catMap = {};
  for (const c of createdCats) {
    catMap[c.name] = c;
  }
  console.log(`Created ${createdCats.length} categories`);

  console.log('Seeding products...');
  const products = [];
  const counterMap = {};
  for (const tmpl of productTemplates) {
    const cat = catMap[tmpl.category];
    const prefix = cat ? cat.codePrefix : 'XX';
    counterMap[prefix] = (counterMap[prefix] || 100) + 1;
    products.push({ ...tmpl, productCode: `${prefix}${counterMap[prefix]}` });
  }
  const createdProds = await Product.insertMany(products);
  console.log(`Created ${createdProds.length} products`);

  console.log('Seeding settings...');
  await Setting.create({ key: 'whatsapp_number', value: '919876543210' });
  console.log('Settings seeded');

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
