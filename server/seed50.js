require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const connectDB = require('./config/db');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Setting = require('./models/Setting');

const categories = [
  { name: 'Bangles',   codePrefix: 'BA' },
  { name: 'Chains',    codePrefix: 'CH' },
  { name: 'Rings',     codePrefix: 'RI' },
  { name: 'Earrings',  codePrefix: 'EA' },
  { name: 'Necklaces', codePrefix: 'NE' },
  { name: 'Anklets',   codePrefix: 'AN' },
  { name: 'Bracelets', codePrefix: 'BR' },
  { name: 'Pendants',  codePrefix: 'PE' },
];

const productTemplates = [
  // ── Bangles ──────────────────────────────────────────────────────────────
  { name: 'Hammered Gold Bangle', description: 'Hand-hammered 22kt gold bangle with a brushed finish. Each piece is uniquely textured, making it a one-of-a-kind addition to your collection.', price: 28500, images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80'], material: 'Gold', category: 'Bangles', inStock: true,  featured: true  },
  { name: 'Floral Kundan Bangle Set', description: 'A set of 4 intricately carved kundan bangles with floral motifs. Perfect for weddings and festive occasions.', price: 42000, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'], material: 'Gold with Kundan', category: 'Bangles', inStock: true,  featured: false },
  { name: 'Slim Everyday Bangle', description: 'A delicate slim bangle in 18kt yellow gold. Minimalist design that pairs beautifully with other bangles or worn alone.', price: 14500, images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80'], material: 'Gold', category: 'Bangles', inStock: false, featured: false },
  { name: 'Diamond Studded Bangle', description: 'Stunning 18kt white gold bangle adorned with 12 round brilliant diamonds totaling 0.8ct. A contemporary classic.', price: 95000, images: ['https://images.unsplash.com/photo-1573408301185-9519f94b3c9c?w=800&q=80'], material: 'White Gold with Diamonds', category: 'Bangles', inStock: true,  featured: true  },
  { name: 'Meenakari Enamel Bangle', description: 'Vibrant blue and green enamel bangle with traditional meenakari work on 22kt gold base. Handcrafted by artisans in Jaipur.', price: 31000, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'], material: 'Gold with Enamel', category: 'Bangles', inStock: true,  featured: false },
  { name: 'Twisted Rope Bangle', description: 'Bold twisted rope design bangle crafted in 22kt gold. Substantial weight with a striking visual appeal.', price: 37000, images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'], material: 'Gold', category: 'Bangles', inStock: true,  featured: false },
  { name: 'Pearl Accent Bangle', description: 'Elegant bangle featuring a row of freshwater pearls set in 22kt gold. A perfect blend of tradition and luxury.', price: 26000, images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80'], material: 'Gold with Pearls', category: 'Bangles', inStock: true,  featured: false },

  // ── Chains ───────────────────────────────────────────────────────────────
  { name: 'Rope Twist Gold Chain', description: 'Classic rope-twist chain in 22kt gold. 18 inches with a secure lobster clasp. Timeless design suitable for any occasion.', price: 35000, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'], material: 'Gold', category: 'Chains', inStock: true,  featured: true  },
  { name: 'Box Link Chain', description: 'Elegant box link chain with a modern geometric pattern. Available in 18kt gold with a smooth polished finish.', price: 22000, images: ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80'], material: 'Gold', category: 'Chains', inStock: true,  featured: false },
  { name: 'Diamond-Cut Figaro Chain', description: 'Italian figaro chain with diamond-cut links for exceptional light reflection. 22kt gold, 20 inches.', price: 48000, images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'], material: 'Gold', category: 'Chains', inStock: true,  featured: false },
  { name: 'Curb Link Chain', description: 'Heavy curb link chain in 22kt gold. Bold and masculine design, 22 inches. A statement piece for any outfit.', price: 62000, images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80'], material: 'Gold', category: 'Chains', inStock: true,  featured: false },
  { name: 'Herringbone Chain', description: 'Sleek herringbone chain in 18kt yellow gold, 16 inches. Ultra-smooth surface that catches the light beautifully.', price: 29000, images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80'], material: 'Gold', category: 'Chains', inStock: false, featured: false },
  { name: 'Singapore Twist Chain', description: 'Delicate Singapore twist chain in 22kt gold. Lightweight and flexible, perfect for pendants.', price: 18500, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'], material: 'Gold', category: 'Chains', inStock: true,  featured: false },
  { name: 'Ball Chain Necklace', description: 'Classic ball chain in 18kt gold with uniform spherical links. 18 inches with a spring-ring clasp.', price: 15000, images: ['https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80'], material: 'Gold', category: 'Chains', inStock: true,  featured: false },

  // ── Rings ─────────────────────────────────────────────────────────────────
  { name: 'Solitaire Diamond Ring', description: 'Timeless solitaire ring featuring a 0.5ct round brilliant diamond set in 18kt white gold. A classic symbol of elegance.', price: 125000, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'], material: 'White Gold with Diamonds', category: 'Rings', inStock: true,  featured: true  },
  { name: 'Floral Meenakari Ring', description: 'Traditional meenakari ring with vibrant enamel work in floral patterns. Set in 22kt gold with a comfortable band.', price: 18500, images: ['https://images.unsplash.com/photo-1589407499289-c16be8a82a7f?w=800&q=80'], material: 'Gold with Enamel', category: 'Rings', inStock: true,  featured: false },
  { name: 'Twisted Band Ring', description: 'Modern twisted band ring in 18kt rose gold. Comfortable fit with a unique sculptural form.', price: 16000, images: ['https://images.unsplash.com/photo-1573408301185-9519f94b3c9c?w=800&q=80'], material: 'Rose Gold', category: 'Rings', inStock: false, featured: false },
  { name: 'Ruby Cocktail Ring', description: 'Statement cocktail ring featuring a 1.2ct natural ruby surrounded by diamond halo in 22kt gold.', price: 185000, images: ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80'], material: 'Gold with Ruby and Diamonds', category: 'Rings', inStock: true,  featured: true  },
  { name: 'Stackable Band Set', description: 'Set of 3 stackable rings in 18kt gold — plain, twisted, and diamond-cut. Mix and match for a personalised look.', price: 28000, images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'], material: 'Gold', category: 'Rings', inStock: true,  featured: false },
  { name: 'Emerald Halo Ring', description: 'Exquisite emerald cut natural emerald ring surrounded by a micro-pave diamond halo in 18kt white gold.', price: 220000, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'], material: 'White Gold with Emerald', category: 'Rings', inStock: true,  featured: false },
  { name: 'Temple Jewellery Ring', description: 'South Indian temple jewellery style ring with deity motifs and antique gold finish in 22kt gold.', price: 22000, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'], material: 'Antique Gold', category: 'Rings', inStock: true,  featured: false },

  // ── Earrings ──────────────────────────────────────────────────────────────
  { name: 'Pearl Drop Earrings', description: 'Classic pearl drop earrings with freshwater pearls set in 22kt gold. Elegant and timeless for all occasions.', price: 22000, images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80'], material: 'Gold with Pearls', category: 'Earrings', inStock: true,  featured: true  },
  { name: 'Gold Jhumka', description: 'Traditional south Indian jhumka earrings in 22kt gold with intricate filigree work and ruby accents.', price: 34000, images: ['https://images.unsplash.com/photo-1630012636810-c5a4c9668d5b?w=800&q=80'], material: 'Gold with Rubies', category: 'Earrings', inStock: true,  featured: false },
  { name: 'Diamond Stud Earrings', description: 'Classic round brilliant diamond studs, 0.30ct each, set in 18kt white gold with secure screw backs.', price: 85000, images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80'], material: 'White Gold with Diamonds', category: 'Earrings', inStock: true,  featured: false },
  { name: 'Chandbali Earrings', description: 'Ornate crescent-shaped chandbali earrings in 22kt gold with Polki diamonds and emerald drops.', price: 78000, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'], material: 'Gold with Polki and Emeralds', category: 'Earrings', inStock: true,  featured: true  },
  { name: 'Hoop Earrings', description: 'Classic gold hoop earrings in 18kt yellow gold. 2.5cm diameter with a smooth polished finish. A wardrobe essential.', price: 12000, images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80'], material: 'Gold', category: 'Earrings', inStock: true,  featured: false },
  { name: 'Emerald Drop Earrings', description: 'Long drop earrings featuring natural emerald beads and 22kt gold filigree work. Inspired by Mughal jewellery.', price: 56000, images: ['https://images.unsplash.com/photo-1573408301185-9519f94b3c9c?w=800&q=80'], material: 'Gold with Emeralds', category: 'Earrings', inStock: false, featured: false },
  { name: 'Ear Cuff Set', description: 'Trendy ear cuff set in 18kt gold with three pieces per ear — minimalist yet bold. No piercing needed.', price: 9500, images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80'], material: 'Gold', category: 'Earrings', inStock: true,  featured: false },

  // ── Necklaces ─────────────────────────────────────────────────────────────
  { name: 'Layered Mangalsutra', description: 'Contemporary layered mangalsutra in 22kt gold with black beads and a diamond-studded pendant. Modern take on tradition.', price: 65000, images: ['https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80'], material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: true  },
  { name: 'Choker Necklace', description: 'Elegant gold choker with intricate mesh work. Sits close to the neck for a royal appearance.', price: 55000, images: ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80'], material: 'Gold', category: 'Necklaces', inStock: true,  featured: false },
  { name: 'Kundan Bridal Necklace', description: 'Grand bridal necklace with uncut diamonds (polki) and natural sapphires set in 22kt gold. Comes with a matching pair of earrings.', price: 380000, images: ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80'], material: 'Gold with Polki and Sapphires', category: 'Necklaces', inStock: true,  featured: true  },
  { name: 'Temple Necklace', description: 'Classic south Indian temple necklace with Lakshmi coin pendants in antique 22kt gold. 18 inches.', price: 92000, images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'], material: 'Antique Gold', category: 'Necklaces', inStock: true,  featured: false },
  { name: 'Pearl Strand Necklace', description: 'Lustrous AAA freshwater pearl strand with a 22kt gold clasp. 18 inches, 7-8mm pearls. Timeless sophistication.', price: 48000, images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80'], material: 'Gold with Pearls', category: 'Necklaces', inStock: true,  featured: false },
  { name: 'Diamond Pendant Necklace', description: 'Delicate 18kt white gold chain with a 0.25ct solitaire diamond pendant. Understated elegance for everyday wear.', price: 42000, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'], material: 'White Gold with Diamond', category: 'Necklaces', inStock: false, featured: false },
  { name: 'Rani Haar', description: 'Long traditional rani haar necklace reaching below the waist. Crafted in 22kt gold with ruby and emerald accents.', price: 245000, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'], material: 'Gold with Rubies and Emeralds', category: 'Necklaces', inStock: true,  featured: false },

  // ── Anklets ───────────────────────────────────────────────────────────────
  { name: 'Delicate Gold Anklet', description: 'Lightweight 22kt gold anklet with tiny bell charms. Traditional design with a modern minimalist twist.', price: 12000, images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'], material: 'Gold', category: 'Anklets', inStock: true,  featured: false },
  { name: 'Diamond Anklet', description: 'Luxurious diamond anklet in 18kt white gold with 0.5ct total diamond weight. Adjustable length 9-10 inches.', price: 68000, images: ['https://images.unsplash.com/photo-1573408301185-9519f94b3c9c?w=800&q=80'], material: 'White Gold with Diamonds', category: 'Anklets', inStock: true,  featured: true  },
  { name: 'Floral Charm Anklet', description: 'Playful anklet with tiny floral charms in 22kt gold. Adjustable length with a lobster clasp.', price: 16500, images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80'], material: 'Gold', category: 'Anklets', inStock: true,  featured: false },
  { name: 'Pearl Anklet', description: 'Elegant anklet combining freshwater pearls and 22kt gold beads. A graceful addition to any look.', price: 22000, images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80'], material: 'Gold with Pearls', category: 'Anklets', inStock: false, featured: false },
  { name: 'Paayal Twin Set', description: 'Matching pair of traditional silver-toned gold paayal with ghungroo bells. Adjustable and comfortable for all-day wear.', price: 19500, images: ['https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80'], material: 'Gold', category: 'Anklets', inStock: true,  featured: false },

  // ── Bracelets ─────────────────────────────────────────────────────────────
  { name: 'Tennis Bracelet', description: 'Classic in-line diamond tennis bracelet with 2.0ct total diamond weight, set in 18kt white gold. The ultimate luxury staple.', price: 195000, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'], material: 'White Gold with Diamonds', category: 'Bracelets', inStock: true,  featured: true  },
  { name: 'Gold Charm Bracelet', description: '18kt gold charm bracelet with 5 pre-set charms: star, heart, moon, leaf, and coin. Customisable with additional charms.', price: 38000, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'], material: 'Gold', category: 'Bracelets', inStock: true,  featured: false },
  { name: 'Cuff Bracelet', description: 'Bold open-cuff bracelet in 22kt gold with hammered texture. One size fits most. A striking statement piece.', price: 44000, images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80'], material: 'Gold', category: 'Bracelets', inStock: true,  featured: false },
  { name: 'Beaded Gold Bracelet', description: 'Elastic beaded bracelet alternating 22kt gold beads and faceted rubies. 7.5 inch length. Casual luxury at its finest.', price: 28000, images: ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80'], material: 'Gold with Rubies', category: 'Bracelets', inStock: true,  featured: false },
  { name: 'Kada Bracelet', description: 'Traditional broad gold kada in 22kt gold with intricate engraved motifs. Suitable for men and women.', price: 72000, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'], material: 'Gold', category: 'Bracelets', inStock: true,  featured: false },

  // ── Pendants ──────────────────────────────────────────────────────────────
  { name: 'Ganesh Gold Pendant', description: 'Intricately crafted Lord Ganesha pendant in 22kt gold with ruby eyes. A divine piece of spiritual jewellery.', price: 18000, images: ['https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80'], material: 'Gold with Rubies', category: 'Pendants', inStock: true,  featured: false },
  { name: 'Diamond Heart Pendant', description: 'Romantic heart-shaped pendant set with 0.30ct round brilliant diamonds in 18kt rose gold. Perfect for gifting.', price: 52000, images: ['https://images.unsplash.com/photo-1573408301185-9519f94b3c9c?w=800&q=80'], material: 'Rose Gold with Diamonds', category: 'Pendants', inStock: true,  featured: true  },
  { name: 'Lakshmi Coin Pendant', description: 'Antique finish Lakshmi coin pendant in 22kt gold. Reversible with a floral motif on the reverse. 2.5cm diameter.', price: 24000, images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'], material: 'Antique Gold', category: 'Pendants', inStock: true,  featured: false },
  { name: 'Evil Eye Pendant', description: 'Vibrant evil eye pendant with blue enamel and white diamond accents in 18kt gold. A protective talisman with a modern look.', price: 16500, images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80'], material: 'Gold with Enamel and Diamonds', category: 'Pendants', inStock: true,  featured: false },
  { name: 'Initial Letter Pendant', description: 'Personalised block letter pendant in 18kt gold. Available for all 26 letters. 1.5cm tall with a smooth polished finish.', price: 11000, images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80'], material: 'Gold', category: 'Pendants', inStock: true,  featured: false },
  { name: 'Sapphire Drop Pendant', description: 'Pear-shaped natural blue sapphire pendant surrounded by a diamond halo, set in 18kt white gold. 1.5ct sapphire.', price: 145000, images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'], material: 'White Gold with Sapphire and Diamonds', category: 'Pendants', inStock: true,  featured: true  },
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
  for (const c of createdCats) catMap[c.name] = c;
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
  console.log('Done! Seeded', createdProds.length, 'products across', createdCats.length, 'categories.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
