/**
 * seed-bulk.js — Additive bulk product seeder
 *
 * Adds 200+ realistic products WITHOUT touching existing data.
 * Reads current max product code per prefix and continues numbering from there.
 *
 * Usage:  cd server && node seed-bulk.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const connectDB = require('./config/db');
const Category  = require('./models/Category');
const Product   = require('./models/Product');

// ─── Image pools per category ─────────────────────────────────────────────────
// Each pool is rotated across products in that category.
const IMG = {
  Bangles: [
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80',
    'https://images.unsplash.com/photo-1573223820143-e5e9a8aa30f4?w=800&q=80',
    'https://images.unsplash.com/photo-1581557991964-125469da3b8a?w=800&q=80',
    'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800&q=80',
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
  ],
  Chains: [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
    'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=800&q=80',
  ],
  Rings: [
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    'https://images.unsplash.com/photo-1589407499289-c16be8a82a7f?w=800&q=80',
    'https://images.unsplash.com/photo-1573408301185-9519f94b3c9c?w=800&q=80',
    'https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?w=800&q=80',
    'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&q=80',
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80',
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80',
    'https://images.unsplash.com/photo-1551717743-e48e8cfb6ee1?w=800&q=80',
  ],
  Earrings: [
    'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80',
    'https://images.unsplash.com/photo-1630012636810-c5a4c9668d5b?w=800&q=80',
    'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80',
    'https://images.unsplash.com/photo-1561828995-aa79a2db86dd?w=800&q=80',
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
  ],
  Necklaces: [
    'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
    'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=800&q=80',
  ],
  Anklets: [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80',
    'https://images.unsplash.com/photo-1573223820143-e5e9a8aa30f4?w=800&q=80',
  ],
};

function img(cat, i) {
  const pool = IMG[cat];
  return [pool[i % pool.length]];
}

// ─── Product templates ─────────────────────────────────────────────────────────
// 200 unique products across 6 categories
const templates = [

  // ══════════════════════════════════════════════════
  //  BANGLES  (35 products)
  // ══════════════════════════════════════════════════
  { name: 'Antique Temple Bangle', description: 'Inspired by South Indian temple art, this 22kt gold bangle features intricate deity motifs and granulation work along the border. A heirloom-quality piece.', price: 68000, material: 'Gold', category: 'Bangles', inStock: true,  featured: true,  _img: 0 },
  { name: 'Polished Cuff Bangle', description: 'Sleek open-cuff bangle in 18kt yellow gold with a high mirror polish. Adjustable for comfortable wear, suitable for stacking.', price: 21500, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 1 },
  { name: 'Diamond Pavé Bangle', description: 'Brilliant round diamonds pavé-set across the top face of this 18kt white gold bangle. Total diamond weight 0.75ct.', price: 145000, material: 'White Gold with Diamonds', category: 'Bangles', inStock: true,  featured: true,  _img: 2 },
  { name: 'Geometric Openwork Bangle', description: 'Modern geometric cutout design in 18kt rose gold. Lightweight yet striking, perfect for contemporary minimalist style.', price: 32000, material: 'Rose Gold', category: 'Bangles', inStock: false, featured: false, _img: 3 },
  { name: 'Meenakari Floral Bangle Pair', description: 'Pair of traditional Rajasthani meenakari bangles in 22kt gold with vivid blue and red enamel floral detailing.', price: 54000, material: 'Gold with Enamel', category: 'Bangles', inStock: true,  featured: false, _img: 4 },
  { name: 'Twisted Rope Bangle', description: 'Classic rope-twist bangle in 22kt yellow gold. A wardrobe staple that complements both everyday and occasion wear.', price: 18500, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 5 },
  { name: 'Kundan Heritage Bangle', description: 'Elaborate kundan-set bangle featuring hand-placed uncut diamonds and emerald cabochons in 22kt gold. Museum-worthy craftsmanship.', price: 195000, material: 'Gold with Kundan & Emeralds', category: 'Bangles', inStock: true,  featured: true,  _img: 6 },
  { name: 'Pearl Accent Bangle', description: 'Delicate 18kt gold bangle adorned with a row of freshwater pearl accents. Feminine and timeless.', price: 27000, material: 'Gold with Pearls', category: 'Bangles', inStock: true,  featured: false, _img: 0 },
  { name: 'Broad Textured Cuff', description: 'Wide 22kt gold cuff with a hammered bark texture. Statement piece that transitions effortlessly from day to evening.', price: 88000, material: 'Gold', category: 'Bangles', inStock: false, featured: false, _img: 1 },
  { name: 'Laser-Cut Floral Bangle', description: 'Precision laser-cut floral pattern in 18kt yellow gold. The open lattice design creates beautiful shadow play on the skin.', price: 38500, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 2 },
  { name: 'Ruby Cluster Bangle', description: 'Deep red rubies cluster-set along the top of this 22kt gold bangle. A bold, luxurious piece for special occasions.', price: 112000, material: 'Gold with Rubies', category: 'Bangles', inStock: true,  featured: false, _img: 3 },
  { name: 'Filigree Lace Bangle', description: 'Exceptionally fine filigree bangle in 22kt gold. The lace-like wire work took 40 hours of skilled handcraft.', price: 76000, material: 'Gold', category: 'Bangles', inStock: true,  featured: true,  _img: 4 },
  { name: 'Sapphire Line Bangle', description: 'A continuous line of oval blue sapphires channel-set in 18kt white gold. Clean, modern, and endlessly elegant.', price: 98000, material: 'White Gold with Sapphires', category: 'Bangles', inStock: false, featured: false, _img: 5 },
  { name: 'Matte Finish Gold Bangle', description: 'Minimalist 22kt gold bangle with a brushed matte finish. A subtle update to the classic everyday bangle.', price: 16500, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 6 },
  { name: 'Elephant Motif Bangle', description: 'Auspicious elephant motif bangle in 22kt gold with trunk-up design. Believed to bring good luck and prosperity.', price: 42500, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 0 },
  { name: 'Tri-Tone Stack Bangles', description: 'Set of 3 slim bangles in yellow, white, and rose gold. Wear together for a tri-tone effect or individually for versatility.', price: 29000, material: 'Tri-Gold', category: 'Bangles', inStock: true,  featured: false, _img: 1 },
  { name: 'Emerald Inlay Bangle', description: 'Vivid green emerald rectangles bezel-inlaid along a 22kt gold bangle. Inspired by Mughal jewellery traditions.', price: 135000, material: 'Gold with Emeralds', category: 'Bangles', inStock: false, featured: true,  _img: 2 },
  { name: 'Beaded Gold Bangle', description: 'Smooth 22kt gold bangle punctuated with ball beads at regular intervals. A classic design with sculptural rhythm.', price: 23000, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 3 },
  { name: 'Wave Pattern Cuff', description: 'Fluid wave pattern carved into an 18kt yellow gold cuff bangle. Organic, sculptural, and deeply wearable.', price: 35000, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 4 },
  { name: 'Tourmaline Accented Bangle', description: 'Pink tourmaline cabochons set at intervals along a 18kt gold bangle. A playful pop of colour for everyday luxury.', price: 48500, material: 'Gold with Tourmaline', category: 'Bangles', inStock: true,  featured: false, _img: 5 },
  { name: 'Coin Charm Bangle', description: 'Delicate 18kt gold bangle hung with three hammered coin charms. Each charm is hand-stamped with a floral motif.', price: 25000, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 6 },
  { name: 'Broad Kundan Statement Bangle', description: 'Wide 22kt gold bangle densely set with uncut kundan stones and polki diamonds. An unmissable bridal statement piece.', price: 225000, material: 'Gold with Kundan & Polki', category: 'Bangles', inStock: false, featured: false, _img: 0 },
  { name: 'Slim Stack Bangle Set of 6', description: 'Set of six ultra-slim 22kt gold bangles. Stack all six for a full, opulent look or mix with other bracelets.', price: 44000, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 1 },
  { name: 'Marquise Diamond Bangle', description: 'Marquise-cut diamonds arranged in a floral repeat along an 18kt white gold bangle. Exceptional fire and scintillation.', price: 178000, material: 'White Gold with Diamonds', category: 'Bangles', inStock: true,  featured: true,  _img: 2 },
  { name: 'Peacock Enamel Bangle', description: 'Vibrant peacock feather enamel work on a 22kt gold base. Each bangle is hand-painted, making every piece unique.', price: 62000, material: 'Gold with Enamel', category: 'Bangles', inStock: true,  featured: false, _img: 3 },
  { name: 'Lattice Dome Bangle', description: 'Architectural dome-shaped bangle with a lattice cut pattern in 18kt yellow gold. Bold geometry with feminine grace.', price: 41000, material: 'Gold', category: 'Bangles', inStock: false, featured: false, _img: 4 },
  { name: 'Celestial Moon Bangle', description: 'Crescent moon and star motifs scattered across this 18kt rose gold bangle. A romantic, celestial everyday piece.', price: 28000, material: 'Rose Gold', category: 'Bangles', inStock: true,  featured: false, _img: 5 },
  { name: 'Chevron Pattern Gold Bangle', description: 'Bold chevron engraving wraps around this solid 22kt gold bangle. A strong graphic pattern in precious metal.', price: 19500, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 6 },
  { name: 'Polki Diamond Bangle', description: 'Flat-cut polki diamonds pavé the top surface of this 22kt yellow gold bangle, framed by seed pearl borders.', price: 165000, material: 'Gold with Polki & Pearls', category: 'Bangles', inStock: true,  featured: false, _img: 0 },
  { name: 'Hammered Rose Gold Bangle', description: 'Hand-hammered 18kt rose gold bangle with a warm, antiqued finish. Wear alone or layer for a curated stack.', price: 24500, material: 'Rose Gold', category: 'Bangles', inStock: true,  featured: false, _img: 1 },
  { name: 'Maang Tikka Style Bangle', description: 'Traditional mang-tikka motif repurposed into a wide bangle in 22kt gold with carved lotus detailing.', price: 58000, material: 'Gold', category: 'Bangles', inStock: false, featured: false, _img: 2 },
  { name: 'Opal Inlay Cuff', description: 'Ethiopian opal slices flush-inlaid into a 14kt yellow gold cuff. Each opal plays a unique rainbow of colours.', price: 52000, material: 'Gold with Opals', category: 'Bangles', inStock: true,  featured: false, _img: 3 },
  { name: 'Granulation Bangle', description: 'Ancient granulation technique revived in 22kt gold — hundreds of tiny gold spheres fused to the surface in a geometric pattern.', price: 78000, material: 'Gold', category: 'Bangles', inStock: true,  featured: false, _img: 4 },
  { name: 'Stardust Diamond Bangle', description: 'Scattered round diamonds set in random stardust arrangement across 18kt white gold. Effortlessly luxurious.', price: 92000, material: 'White Gold with Diamonds', category: 'Bangles', inStock: false, featured: false, _img: 5 },
  { name: 'Coral Cabochon Bangle', description: 'Rich red coral cabochons bezel-set along a 22kt gold bangle. A traditional astrological piece with striking colour.', price: 36000, material: 'Gold with Coral', category: 'Bangles', inStock: true,  featured: false, _img: 6 },

  // ══════════════════════════════════════════════════
  //  CHAINS  (33 products)
  // ══════════════════════════════════════════════════
  { name: 'Mariner Link Chain', description: 'Nautical-inspired mariner link chain in 22kt gold, 20 inches. Flat oval links with a centre bar, substantial yet refined.', price: 42000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 0 },
  { name: 'Snake Chain Necklace', description: 'Sleek snake chain in 18kt yellow gold, 18 inches. The smooth cylindrical links lie flat for a liquid-metal effect.', price: 31000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 1 },
  { name: 'Rolo Chain', description: 'Uniform round rolo links in 22kt gold, 16 inches. Clean and simple — the ideal chain for a pendant or solo wear.', price: 24500, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 2 },
  { name: 'Cuban Link Chain', description: 'Bold Cuban link chain in 22kt gold, 22 inches. Flat, interlocking links with a diamond-cut shine. A statement around the neck.', price: 85000, material: 'Gold', category: 'Chains', inStock: false, featured: true,  _img: 3 },
  { name: 'Venetian Box Chain', description: 'Italian Venetian box chain in 18kt white gold, 18 inches. Square links with a highly polished surface.', price: 28000, material: 'White Gold', category: 'Chains', inStock: true,  featured: false, _img: 4 },
  { name: 'Wheat Spiga Chain', description: 'Intricate wheat spiga chain in 22kt yellow gold, 20 inches. Four rows of twisted oval links creating a rounded braid effect.', price: 55000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 0 },
  { name: 'Herringbone Chain', description: 'Classic herringbone chain in 18kt gold, 16 inches. Flat, V-shaped links lie close to the skin like a second neckline.', price: 38000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 1 },
  { name: 'Singapore Twist Chain', description: 'Delicate Singapore twist chain in 18kt rose gold, 18 inches. The spiralling links catch light beautifully with every movement.', price: 19000, material: 'Rose Gold', category: 'Chains', inStock: true,  featured: false, _img: 2 },
  { name: 'Solid Curb Chain Heavy', description: 'Heavy solid curb chain in 22kt gold, 24 inches. Bevelled links with a satin finish on alternate sides. For the bold dresser.', price: 120000, material: 'Gold', category: 'Chains', inStock: false, featured: false, _img: 3 },
  { name: 'Byzantine Chain', description: 'Intricate Byzantine-pattern chain in 18kt yellow gold, 18 inches. Complex interlocking links of ancient design.', price: 62000, material: 'Gold', category: 'Chains', inStock: true,  featured: true,  _img: 4 },
  { name: 'Ball Chain Necklace', description: 'Spherical ball-link chain in 18kt yellow gold, 16 inches. Playful and versatile — works with pendants or alone.', price: 16500, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 0 },
  { name: 'Diamond-Cut Rolo Chain', description: 'Rolo-style chain with diamond-cut facets on each link in 22kt gold, 18 inches. Maximum sparkle, minimum fuss.', price: 32000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 1 },
  { name: 'Omega Chain Collar', description: 'Rigid Omega collar chain in 18kt white gold, 16 inches. Flat, scale-like links create a structured, architectural look.', price: 74000, material: 'White Gold', category: 'Chains', inStock: false, featured: false, _img: 2 },
  { name: 'Trace Chain Layering Set', description: 'Set of three fine trace chains in 18kt gold at 14", 16", and 18" for effortless layering. Yellow, white, and rose gold.', price: 45000, material: 'Tri-Gold', category: 'Chains', inStock: true,  featured: false, _img: 3 },
  { name: 'Prince of Wales Chain', description: 'Classic Prince of Wales pattern chain in 22kt gold, 18 inches. Each round link interconnects at alternating angles.', price: 29000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 4 },
  { name: 'Anchor Link Chain', description: 'Nautical anchor-link chain in 18kt yellow gold, 20 inches. Polished oval links flanked by horizontal bars, sturdy and timeless.', price: 36000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 0 },
  { name: 'Popcorn Chain', description: 'Unique popcorn-link chain in 18kt rose gold, 18 inches. Rounded cylindrical links with a smooth, organic texture.', price: 41000, material: 'Rose Gold', category: 'Chains', inStock: false, featured: false, _img: 1 },
  { name: 'Paperclip Link Chain', description: 'On-trend paperclip link chain in 18kt gold, 18 inches. Elongated oval links, lightweight and ultra-wearable.', price: 27500, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 2 },
  { name: 'Beaded Gold Chain', description: 'Hand-strung gold bead chain in 22kt gold, 18 inches. Each round bead is individually threaded on a silk cord core.', price: 52000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 3 },
  { name: 'Franco Chain', description: 'Italian Franco weave chain in 22kt gold, 22 inches. Four rows of interlocking V-shaped links form a square profile.', price: 78000, material: 'Gold', category: 'Chains', inStock: true,  featured: true,  _img: 4 },
  { name: 'Lariat Y-Chain', description: 'Lariat Y-drop chain in 18kt yellow gold, 30 inches total. Wear knotted, looped, or let the long drop fall freely.', price: 39000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 0 },
  { name: 'Choker Figaro Chain', description: 'Short Figaro pattern choker chain in 22kt gold, 14 inches. Alternating long and short links sit beautifully at the collarbone.', price: 22000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 1 },
  { name: 'Braided Tri-Gold Chain', description: 'Three strands of yellow, white, and rose 18kt gold twisted together, 18 inches. Visually complex but lightweight to wear.', price: 67000, material: 'Tri-Gold', category: 'Chains', inStock: false, featured: false, _img: 2 },
  { name: 'Double Curb Chain', description: 'Double-strand curb chain in 22kt gold, 20 inches. Two parallel curb chains joined at the clasp for a layered-in-one look.', price: 95000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 3 },
  { name: 'Diamond Station Chain', description: 'Delicate trace chain in 18kt white gold with seven round brilliant diamonds set at equal intervals, 18 inches.', price: 88000, material: 'White Gold with Diamonds', category: 'Chains', inStock: true,  featured: false, _img: 4 },
  { name: 'Oxidised Silver-Look Gold Chain', description: 'Antiqued black-oxidised 22kt gold chain, 20 inches. A deliberately aged look that pairs beautifully with traditional wear.', price: 33000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 0 },
  { name: 'Long Opera Chain', description: '32-inch opera-length chain in 22kt gold with figaro-style links. Wear long, doubled, or knotted at the chest.', price: 58000, material: 'Gold', category: 'Chains', inStock: false, featured: false, _img: 1 },
  { name: 'Chunky Belcher Chain', description: 'Bold belcher link chain in 22kt gold, 20 inches. Extra-wide round links for a confident, fashion-forward statement.', price: 105000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 2 },
  { name: 'Dainty Satellite Chain', description: 'Fine chain punctuated with tiny round satellite beads in 18kt rose gold, 16 inches. Understated and effortlessly modern.', price: 14500, material: 'Rose Gold', category: 'Chains', inStock: true,  featured: false, _img: 3 },
  { name: 'Figaro Anklet Chain', description: 'Figaro-pattern anklet chain in 22kt gold, 10 inches with a 2-inch extender. Lightweight and perfect for the beach.', price: 15000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 4 },
  { name: 'Solid Gold Collar Chain', description: 'Structured solid-link collar chain in 22kt gold, 16 inches. Sits high on the neck with architectural authority.', price: 135000, material: 'Gold', category: 'Chains', inStock: false, featured: false, _img: 0 },
  { name: 'Micro Cable Chain', description: 'Ultra-fine cable chain in 18kt yellow gold, 18 inches. Nearly invisible — the perfect foundation for a delicate pendant.', price: 11000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 1 },
  { name: 'Rope Twist Long Chain', description: '24-inch rope-twist chain in 22kt yellow gold. The tightly twisted links create a continuous, spiralling surface of gold.', price: 48000, material: 'Gold', category: 'Chains', inStock: true,  featured: false, _img: 2 },

  // ══════════════════════════════════════════════════
  //  RINGS  (40 products)
  // ══════════════════════════════════════════════════
  { name: 'Emerald Cut Diamond Ring', description: 'Emerald-cut centre diamond (1.2ct) flanked by two tapered baguettes in 18kt white gold. Art-Deco-inspired proportions.', price: 285000, material: 'White Gold with Diamonds', category: 'Rings', inStock: true,  featured: true,  _img: 0 },
  { name: 'Stackable Eternity Band', description: 'Full eternity band pavé-set with round brilliants in 18kt yellow gold. Stack multiple bands or wear solo.', price: 65000, material: 'Gold with Diamonds', category: 'Rings', inStock: true,  featured: false, _img: 1 },
  { name: 'Ruby Halo Ring', description: 'Oval Burmese ruby (1.5ct) with a diamond halo, set in 18kt yellow gold. Bold colour with refined craftsmanship.', price: 198000, material: 'Gold with Ruby & Diamonds', category: 'Rings', inStock: false, featured: true,  _img: 2 },
  { name: 'Classic Gold Band', description: 'Timeless 22kt gold plain band, 5mm wide. Polished to a perfect mirror finish. A ring for life.', price: 14000, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 3 },
  { name: 'Cluster Sapphire Ring', description: 'Central sapphire surrounded by a cluster of round diamonds in 18kt white gold. Victorian-inspired charm.', price: 145000, material: 'White Gold with Sapphire & Diamonds', category: 'Rings', inStock: true,  featured: false, _img: 4 },
  { name: 'Rose Gold Leaf Band', description: 'Organic leaf motif engraved across a 18kt rose gold band. Nature-inspired jewellery for the free-spirited wearer.', price: 18500, material: 'Rose Gold', category: 'Rings', inStock: true,  featured: false, _img: 5 },
  { name: 'Navratna Statement Ring', description: 'Nine auspicious gemstones — ruby, pearl, coral, emerald, yellow sapphire, diamond, blue sapphire, hessonite, cats-eye — in 22kt gold.', price: 175000, material: 'Gold with Navratna Stones', category: 'Rings', inStock: false, featured: false, _img: 6 },
  { name: 'Pear Drop Engagement Ring', description: 'Pear-shaped diamond (0.9ct) set in a four-prong crown above a diamond-pavé shank in 18kt white gold.', price: 225000, material: 'White Gold with Diamonds', category: 'Rings', inStock: true,  featured: true,  _img: 7 },
  { name: 'Kundan Cocktail Ring', description: 'Wide cocktail ring with an ornate kundan-set face in 22kt gold. Designed to be the centrepiece of any look.', price: 88000, material: 'Gold with Kundan', category: 'Rings', inStock: true,  featured: false, _img: 0 },
  { name: 'Three Stone Diamond Ring', description: 'Three round brilliant diamonds (0.2ct each) in a graduated setting on 18kt white gold. Symbolises past, present, future.', price: 98000, material: 'White Gold with Diamonds', category: 'Rings', inStock: true,  featured: false, _img: 1 },
  { name: 'Oxidised Silver Toe Ring', description: 'Broad oxidised toe ring with paisley motif in 22kt gold. Traditional yet wearable for modern occasions.', price: 6500, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 2 },
  { name: 'Princess Cut Solitaire', description: 'Princess-cut diamond (0.75ct) in a square four-prong setting on an 18kt gold shank. Clean geometry, pure elegance.', price: 168000, material: 'White Gold with Diamond', category: 'Rings', inStock: false, featured: false, _img: 3 },
  { name: 'Coral Cabochon Gold Ring', description: 'Large domed coral cabochon bezel-set in ornate 22kt gold. A traditional astrological and fashion piece combined.', price: 32000, material: 'Gold with Coral', category: 'Rings', inStock: true,  featured: false, _img: 4 },
  { name: 'Twisted Eternity Ring', description: 'Twisted rope band fully set with round diamonds in 18kt rose gold. Delicate, continuous sparkle on the finger.', price: 78000, material: 'Rose Gold with Diamonds', category: 'Rings', inStock: true,  featured: false, _img: 5 },
  { name: 'Trillion Cut Amethyst Ring', description: 'Trillion-cut amethyst in a yellow gold tension setting. Vibrant purple stone held with minimal metal for maximum impact.', price: 28500, material: 'Gold with Amethyst', category: 'Rings', inStock: true,  featured: false, _img: 6 },
  { name: 'Enamelled Peacock Ring', description: 'Peacock motif ring with vivid blue and green enamel in 22kt gold. A work of miniature art worn on the hand.', price: 45000, material: 'Gold with Enamel', category: 'Rings', inStock: false, featured: false, _img: 7 },
  { name: 'Diamond Crossover Band', description: 'Criss-cross band design with diamonds at the crossover point in 18kt white gold. Modern architecture in a ring.', price: 55000, material: 'White Gold with Diamonds', category: 'Rings', inStock: true,  featured: false, _img: 0 },
  { name: 'Engagement Halo Ring', description: 'Round brilliant centre (1.0ct) encircled by a halo of micro-pavé diamonds on an 18kt gold shank. Classic eternal design.', price: 245000, material: 'White Gold with Diamonds', category: 'Rings', inStock: true,  featured: true,  _img: 1 },
  { name: 'Filigree Statement Ring', description: 'Wide filigree-work ring in 22kt gold with a central turquoise cabochon. Inspired by Mughal courtly jewellery.', price: 62000, material: 'Gold with Turquoise', category: 'Rings', inStock: true,  featured: false, _img: 2 },
  { name: 'Signet Ring with Monogram', description: 'Classic octagonal signet ring in 18kt yellow gold. Face can be engraved with initials or left plain for a minimalist finish.', price: 22000, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 3 },
  { name: 'Marquise Ruby Band', description: 'A continuous band of marquise-cut rubies channel-set in 18kt yellow gold. Rich, colourful, and effortlessly dramatic.', price: 115000, material: 'Gold with Rubies', category: 'Rings', inStock: false, featured: false, _img: 4 },
  { name: 'Dome Polki Ring', description: 'Domed ring face densely set with polki diamonds above a 22kt gold shank. Bridal-worthy luxury at its most opulent.', price: 155000, material: 'Gold with Polki Diamonds', category: 'Rings', inStock: true,  featured: false, _img: 5 },
  { name: 'Temple Idol Ring', description: 'Ring topped with a miniature deity idol in 22kt gold. A deeply spiritual piece crafted with traditional lost-wax casting.', price: 38000, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 6 },
  { name: 'Cushion Tsavorite Ring', description: 'Cushion-cut vivid green tsavorite (1.1ct) in a claw setting on 18kt white gold. A brilliant emerald-like stone at a fraction of the price.', price: 95000, material: 'White Gold with Tsavorite', category: 'Rings', inStock: true,  featured: false, _img: 7 },
  { name: 'Vintage Floral Ring', description: 'Antique-inspired floral ring with milgrain edging in 18kt yellow gold, set with a central old-mine cut diamond.', price: 132000, material: 'Gold with Diamond', category: 'Rings', inStock: false, featured: false, _img: 0 },
  { name: 'Hammered Gold Thumb Ring', description: 'Wide hammered-finish thumb ring in 22kt gold. Bohemian attitude with pure luxury materials.', price: 19000, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 1 },
  { name: 'Alexandrite Colour-Change Ring', description: 'Oval alexandrite that shifts from green in daylight to red under incandescent light, set in 18kt white gold.', price: 185000, material: 'White Gold with Alexandrite', category: 'Rings', inStock: false, featured: true,  _img: 2 },
  { name: 'Delicate Diamond Promise Ring', description: 'Thin 14kt gold band with a single round brilliant diamond (0.1ct). Simple, heartfelt, enduring.', price: 32000, material: 'Gold with Diamond', category: 'Rings', inStock: true,  featured: false, _img: 3 },
  { name: 'Open-Weave Gold Ring', description: 'Open-weave woven-wire ring in 18kt yellow gold. A sculptural statement in precious metal for the discerning hand.', price: 41000, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 4 },
  { name: 'Tanzanite Oval Ring', description: 'Deep blue-violet tanzanite (1.3ct) in a simple six-prong claw, 18kt white gold shank. Rare colour, exceptional clarity.', price: 148000, material: 'White Gold with Tanzanite', category: 'Rings', inStock: true,  featured: false, _img: 5 },
  { name: 'Chevron Stacking Ring', description: 'Geometric chevron-shaped 18kt gold stacking ring. Wears beautifully alone or in a stack of five across the fingers.', price: 12500, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 6 },
  { name: 'Pearl Cluster Cocktail Ring', description: 'Seven freshwater pearls clustered in a dome setting on 22kt yellow gold. Feminine grandeur without the ostentation.', price: 54000, material: 'Gold with Pearls', category: 'Rings', inStock: false, featured: false, _img: 7 },
  { name: 'Dual-Band Split Shank Ring', description: 'Split shank ring that divides above and below a brilliant-cut diamond (0.6ct) in 18kt white gold. Architectural elegance.', price: 138000, material: 'White Gold with Diamond', category: 'Rings', inStock: true,  featured: false, _img: 0 },
  { name: 'Citrine Cocktail Ring', description: 'Large golden citrine (4ct) in a bezel setting surrounded by a rolled-wire border in 18kt yellow gold. Sunshine on the hand.', price: 38000, material: 'Gold with Citrine', category: 'Rings', inStock: true,  featured: false, _img: 1 },
  { name: 'Temple Gold Broad Ring', description: 'Broad 22kt gold ring with intricate temple-work carvings of deities and floral scrollwork. A showpiece for the hand.', price: 72000, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 2 },
  { name: 'Aquamarine Solitaire Ring', description: 'Pale blue aquamarine (2ct) in a classic claw setting on 18kt white gold. The colour of calm, crystallised in gold.', price: 68000, material: 'White Gold with Aquamarine', category: 'Rings', inStock: true,  featured: false, _img: 3 },
  { name: 'Lattice Band Ring', description: 'Openwork lattice band in 18kt rose gold. The interlacing pattern creates depth and shadow across the finger.', price: 29000, material: 'Rose Gold', category: 'Rings', inStock: false, featured: false, _img: 4 },
  { name: 'Spinel Pink Statement Ring', description: 'Vivid hot-pink spinel (1.8ct) in an 18kt gold bezel setting. Spinel is the gemstone connoisseur\'s choice for pure colour.', price: 112000, material: 'Gold with Spinel', category: 'Rings', inStock: true,  featured: false, _img: 5 },
  { name: 'Textured Hammered Band', description: 'Wide 22kt gold band with an all-over hammered texture. Raw and refined simultaneously — a deeply wearable ring.', price: 26000, material: 'Gold', category: 'Rings', inStock: true,  featured: false, _img: 6 },

  // ══════════════════════════════════════════════════
  //  EARRINGS  (35 products)
  // ══════════════════════════════════════════════════
  { name: 'Chandbali Drop Earrings', description: 'Crescent moon-shaped chandbali earrings in 22kt gold with kundan inlay and pearl drops. A bridal jewellery staple.', price: 72000, material: 'Gold with Kundan & Pearls', category: 'Earrings', inStock: true,  featured: true,  _img: 0 },
  { name: 'Hoop Earrings Classic', description: 'Polished round hoop earrings in 22kt gold, 25mm diameter. The quintessential gold hoop — perfectly weighted and eternally stylish.', price: 24000, material: 'Gold', category: 'Earrings', inStock: true,  featured: false, _img: 1 },
  { name: 'Emerald Drop Earrings', description: 'Pear-shaped emeralds (0.8ct each) suspended from 18kt yellow gold posts with a diamond bridge. Vibrant and refined.', price: 145000, material: 'Gold with Emeralds & Diamonds', category: 'Earrings', inStock: false, featured: true,  _img: 2 },
  { name: 'Tiny Diamond Hoops', description: 'Petite 14kt white gold huggie hoops pavé-set with round diamonds. Perfect for the second or third piercing.', price: 38000, material: 'White Gold with Diamonds', category: 'Earrings', inStock: true,  featured: false, _img: 3 },
  { name: 'Jhumka with Meenakari', description: 'Ornate jhumka earrings with traditional meenakari enamel base and a bell-shaped bottom in 22kt gold.', price: 48000, material: 'Gold with Enamel', category: 'Earrings', inStock: true,  featured: false, _img: 4 },
  { name: 'Baroque Pearl Drop', description: 'Large baroque South Sea pearl drops suspended from 18kt gold lever-back hooks. Organic, lustrous, unforgettable.', price: 95000, material: 'Gold with South Sea Pearls', category: 'Earrings', inStock: true,  featured: false, _img: 0 },
  { name: 'Geometric Fan Earrings', description: 'Art-Deco fan-shaped drop earrings in 18kt yellow gold with a diamond-cut surface. Architectural drama for the ears.', price: 55000, material: 'Gold', category: 'Earrings', inStock: false, featured: false, _img: 1 },
  { name: 'Single Diamond Stud Pair', description: 'Round brilliant diamonds (0.5ct each) in four-prong martini settings, 18kt white gold. The perfect foundation earring.', price: 115000, material: 'White Gold with Diamonds', category: 'Earrings', inStock: true,  featured: false, _img: 2 },
  { name: 'Temple Goddess Drops', description: 'Long drop earrings featuring sculpted temple goddess faces in 22kt gold with ruby eyes and filigree work.', price: 82000, material: 'Gold with Rubies', category: 'Earrings', inStock: true,  featured: false, _img: 3 },
  { name: 'Oval Sapphire Drops', description: 'Oval blue sapphires (1.0ct each) in a simple bezel on 18kt white gold, with a thin diamond-set chain connector.', price: 128000, material: 'White Gold with Sapphires & Diamonds', category: 'Earrings', inStock: false, featured: false, _img: 4 },
  { name: 'Huggie Diamond Hoops', description: 'Snug huggie hoops pavé-set with round diamonds across the face, in 18kt yellow gold. Glamour in a compact form.', price: 62000, material: 'Gold with Diamonds', category: 'Earrings', inStock: true,  featured: false, _img: 0 },
  { name: 'Feather Drop Earrings', description: 'Long feather-shaped drops in 18kt rose gold with a hammered surface. Light as a feather, beautiful as treasure.', price: 36000, material: 'Rose Gold', category: 'Earrings', inStock: true,  featured: false, _img: 1 },
  { name: 'Polki Floral Studs', description: 'Flat polki diamond-set flower studs in 22kt gold with a pink tourmaline centre. Traditional craftsmanship in a compact size.', price: 75000, material: 'Gold with Polki & Tourmaline', category: 'Earrings', inStock: true,  featured: false, _img: 2 },
  { name: 'Turquoise Teardrop Drops', description: 'Teardrop turquoise cabochons in a fine wire-wrapped 18kt gold setting, hung from gold posts. Desert luxury.', price: 28500, material: 'Gold with Turquoise', category: 'Earrings', inStock: false, featured: false, _img: 3 },
  { name: 'Three-Tier Jhumka', description: 'Three cascading tiers of granulated 22kt gold spheres, finishing with a jhumka bell. Traditional South Indian grandeur.', price: 68000, material: 'Gold', category: 'Earrings', inStock: true,  featured: false, _img: 4 },
  { name: 'Oval Hoop with Pearl', description: 'Oval gold hoops with a single pearl drop at the base, 18kt yellow gold. Effortlessly sophisticated.', price: 32000, material: 'Gold with Pearls', category: 'Earrings', inStock: true,  featured: false, _img: 0 },
  { name: 'Stud Cluster Earrings', description: 'Cluster of seven round brilliants (0.35ct total) in a 18kt white gold flower setting. Maximum sparkle in a petite footprint.', price: 52000, material: 'White Gold with Diamonds', category: 'Earrings', inStock: true,  featured: false, _img: 1 },
  { name: 'Gold Thread Tassel Earrings', description: 'Long tassel earrings made from hundreds of fine 18kt gold threads. Dramatic movement, whisper-light weight.', price: 48000, material: 'Gold', category: 'Earrings', inStock: false, featured: false, _img: 2 },
  { name: 'Amethyst Square Drop', description: 'Square amethysts (0.7ct each) in 18kt yellow gold bezel settings on slim drop connectors. Bold colour, clean lines.', price: 35000, material: 'Gold with Amethyst', category: 'Earrings', inStock: true,  featured: false, _img: 3 },
  { name: 'Large Filigree Drops', description: 'Generously sized teardrop filigree earrings in 22kt gold. Intricate wire-work creates a lace-like texture at statement scale.', price: 65000, material: 'Gold', category: 'Earrings', inStock: true,  featured: false, _img: 4 },
  { name: 'Bar and Chain Drop', description: 'Minimalist bar-and-chain design in 18kt yellow gold. A thin horizontal bar suspends a long delicate chain — architectural minimalism.', price: 21000, material: 'Gold', category: 'Earrings', inStock: true,  featured: false, _img: 0 },
  { name: 'Pink Tourmaline Drops', description: 'Pear-shaped pink tourmalines (0.6ct each) in 18kt rose gold double-prong settings. Feminine, romantic, rare.', price: 78000, material: 'Rose Gold with Tourmaline', category: 'Earrings', inStock: true,  featured: false, _img: 1 },
  { name: 'Lotus Stud Earrings', description: 'Lotus flower stud earrings in 22kt gold with a central ruby. The lotus is revered in Indian culture as a symbol of purity.', price: 42000, material: 'Gold with Ruby', category: 'Earrings', inStock: false, featured: false, _img: 2 },
  { name: 'Cascading Diamond Line', description: 'Seven graduated diamonds suspended on fine 18kt white gold links for a waterfall effect. Effortlessly luxurious.', price: 155000, material: 'White Gold with Diamonds', category: 'Earrings', inStock: true,  featured: true,  _img: 3 },
  { name: 'Coin Drop Earrings', description: 'Hammered 22kt gold coin drops, 18mm diameter, on slim gold posts. Ancient currency reimagined as modern jewellery.', price: 31000, material: 'Gold', category: 'Earrings', inStock: true,  featured: false, _img: 4 },
  { name: 'Garnet Cluster Drops', description: 'Rich red garnet clusters hanging from 18kt yellow gold round-link connectors. Deep colour, artisan setting.', price: 44000, material: 'Gold with Garnets', category: 'Earrings', inStock: false, featured: false, _img: 0 },
  { name: 'Crescent Moon Studs', description: 'Crescent moon studs in 18kt rose gold with a single star set at the tip. Celestial symbolism at its most elegant.', price: 16500, material: 'Rose Gold', category: 'Earrings', inStock: true,  featured: false, _img: 1 },
  { name: 'Hammered Disc Hoops', description: 'Hammered disc earrings in 18kt yellow gold, 20mm diameter. The organic texture catches light with a warm, golden glow.', price: 26000, material: 'Gold', category: 'Earrings', inStock: true,  featured: false, _img: 2 },
  { name: 'Citrine Rectangle Drops', description: 'Emerald-cut citrines (1.2ct each) in 18kt yellow gold bezel drops. The golden stone seems to glow from within.', price: 48000, material: 'Gold with Citrine', category: 'Earrings', inStock: true,  featured: false, _img: 3 },
  { name: 'Paisley Kundan Stud', description: 'Paisley-shaped kundan studs in 22kt gold with an enamel back. A classic Indian motif rendered with extraordinary detail.', price: 38000, material: 'Gold with Kundan', category: 'Earrings', inStock: false, featured: false, _img: 4 },
  { name: 'Diamond Line Bar Drops', description: 'Horizontal diamond-set bars suspended vertically on 18kt white gold. Clean, modern geometry with brilliant stones.', price: 88000, material: 'White Gold with Diamonds', category: 'Earrings', inStock: true,  featured: false, _img: 0 },
  { name: 'Coral Cluster Jhumka', description: 'Round coral cabochons set across the face of a traditional jhumka bell in 22kt gold. Bright, natural, bold.', price: 52000, material: 'Gold with Coral', category: 'Earrings', inStock: true,  featured: false, _img: 1 },
  { name: 'Butterfly Wing Drops', description: 'Stylised butterfly wing earrings in 18kt yellow gold with a diamond-cut surface. Light, movement, beauty.', price: 34000, material: 'Gold', category: 'Earrings', inStock: true,  featured: false, _img: 2 },
  { name: 'Aquamarine Oval Studs', description: 'Pale blue aquamarine ovals (0.5ct each) in simple 18kt white gold bezel studs. Serene colour, clean setting.', price: 42000, material: 'White Gold with Aquamarine', category: 'Earrings', inStock: false, featured: false, _img: 3 },
  { name: 'Spiral Drop Earrings', description: 'Hand-formed spiral drops in 18kt rose gold wire. Deceptively simple to look at, complex to make by hand.', price: 18500, material: 'Rose Gold', category: 'Earrings', inStock: true,  featured: false, _img: 4 },

  // ══════════════════════════════════════════════════
  //  NECKLACES  (35 products)
  // ══════════════════════════════════════════════════
  { name: 'Diamond Rivière Necklace', description: '18-stone diamond rivière necklace in 18kt white gold, 16 inches. Each stone (2ct total) is a perfectly matched round brilliant.', price: 485000, material: 'White Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: true,  _img: 0 },
  { name: 'Emerald Pendant Necklace', description: 'Pear-shaped Colombian emerald (2.5ct) in an elaborate 22kt gold antique-finish pendant on a 20-inch chain.', price: 325000, material: 'Gold with Emerald', category: 'Necklaces', inStock: false, featured: true,  _img: 1 },
  { name: 'Mangalsutra with Diamond Pendant', description: 'Modern 22kt gold mangalsutra with a diamond-studded heart pendant and delicate black bead chain, 22 inches.', price: 88000, material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 2 },
  { name: 'Coin Pendant Necklace', description: 'Hammered 22kt gold ancient coin pendant on a 20-inch cable chain. The coin face bears a hand-stamped floral motif.', price: 42000, material: 'Gold', category: 'Necklaces', inStock: true,  featured: false, _img: 3 },
  { name: 'Kundan Bridal Necklace Set', description: 'Grand kundan-set bridal necklace with matching maang tikka and earrings in 22kt gold. Fit for a queen.', price: 450000, material: 'Gold with Kundan & Rubies', category: 'Necklaces', inStock: false, featured: true,  _img: 4 },
  { name: 'Layered Pearl Necklace', description: 'Three strands of Akoya pearls in graduating sizes, 16-18-20 inches, with an 18kt gold clasp. Classic pearl jewellery perfected.', price: 125000, material: 'Gold with Akoya Pearls', category: 'Necklaces', inStock: true,  featured: false, _img: 5 },
  { name: 'Bar Pendant Necklace', description: 'Slim horizontal bar pendant pavé-set with diamonds in 18kt yellow gold on a 16-inch trace chain. Modern minimalism, maximum shine.', price: 48000, material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 0 },
  { name: 'Temple Padakkam Necklace', description: 'Traditional South Indian padakkam necklace in 22kt gold featuring temple deity pendants and ruby accents, 18 inches.', price: 185000, material: 'Gold with Rubies', category: 'Necklaces', inStock: true,  featured: false, _img: 1 },
  { name: 'Sapphire Y-Drop Necklace', description: 'Lariat-style Y-drop necklace in 18kt white gold with a 1.5ct oval blue sapphire at the drop. Effortlessly elegant.', price: 165000, material: 'White Gold with Sapphire', category: 'Necklaces', inStock: false, featured: false, _img: 2 },
  { name: 'Polki Grandeur Collar', description: 'Wide polki-diamond collar necklace in 22kt gold with intricate meenakari back. The apex of Indian bridal jewellery.', price: 585000, material: 'Gold with Polki & Enamel', category: 'Necklaces', inStock: false, featured: false, _img: 3 },
  { name: 'Floating Diamond Pendant', description: 'Single round brilliant (0.5ct) appears to float inside a fine 18kt white gold bezel on an ultra-fine chain.', price: 72000, material: 'White Gold with Diamond', category: 'Necklaces', inStock: true,  featured: false, _img: 4 },
  { name: 'Floral Tikka Pendant', description: 'Large floral pendant in 22kt gold with an elaborate central ruby and diamond-set petals. Wear on a chain or as a hair tikka.', price: 135000, material: 'Gold with Ruby & Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 5 },
  { name: 'Hexagonal Geometric Pendant', description: 'Geometric hexagon pendant in 18kt yellow gold with a diamond-set interior pattern on a 16-inch cable chain.', price: 38000, material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 0 },
  { name: 'Vintage Garnet Necklace', description: 'Victorian-revival necklace with a cascade of garnet drops in 18kt yellow gold settings. Deep, moody, romantic.', price: 98000, material: 'Gold with Garnets', category: 'Necklaces', inStock: false, featured: false, _img: 1 },
  { name: 'Initial Letter Pendant', description: 'Personalised block-letter pendant in 22kt gold on a 16-inch cable chain. Each letter is hand-polished to a mirror finish.', price: 22000, material: 'Gold', category: 'Necklaces', inStock: true,  featured: false, _img: 2 },
  { name: 'Five-Strand Gold Chain Set', description: 'Opulent five-strand gold chain necklace in 22kt gold with a decorative clasp. Each strand is a different chain style.', price: 285000, material: 'Gold', category: 'Necklaces', inStock: true,  featured: false, _img: 3 },
  { name: 'Diamond Horseshoe Pendant', description: 'Horseshoe pendant pavé-set with round brilliants (0.6ct total) in 18kt yellow gold. A lucky charm in a luxurious form.', price: 85000, material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 4 },
  { name: 'Layered Mangalsutra Pendant', description: 'Contemporary three-layer mangalsutra in 22kt gold with a modern geometric pendant replacing the traditional design.', price: 72000, material: 'Gold', category: 'Necklaces', inStock: true,  featured: false, _img: 5 },
  { name: 'Coral and Gold Bib Necklace', description: 'Statement bib necklace of polished red coral beads interspersed with 22kt gold spacers. Tribal-inspired luxury.', price: 112000, material: 'Gold with Coral', category: 'Necklaces', inStock: false, featured: false, _img: 0 },
  { name: 'Rose Cut Diamond Pendant', description: 'Large rose-cut diamond (1.2ct) in a hand-engraved 18kt gold bezel, hung on a fine 18-inch chain. Romantic, antique feel.', price: 195000, material: 'Gold with Diamond', category: 'Necklaces', inStock: true,  featured: false, _img: 1 },
  { name: 'Turquoise Layered Necklace', description: 'Three-strand necklace of round turquoise beads with 18kt gold spacers and clasp, 18 inches. The colour of the sky.', price: 58000, material: 'Gold with Turquoise', category: 'Necklaces', inStock: true,  featured: false, _img: 2 },
  { name: 'Butterfly Diamond Pendant', description: 'Butterfly pendant with round diamond-set wings in 18kt white gold on a 16-inch chain. Delicate, feminine, luminous.', price: 65000, material: 'White Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 3 },
  { name: 'Auspicious Om Pendant', description: 'Sacred Om symbol pendant in 22kt gold with diamond-set outline, 20mm. A deeply meaningful piece in precious metal.', price: 45000, material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 4 },
  { name: 'Alexandrite Drop Necklace', description: 'Oval alexandrite (1.5ct) that shifts colour in light, set in 18kt white gold on a diamond-accented chain, 18 inches.', price: 245000, material: 'White Gold with Alexandrite', category: 'Necklaces', inStock: false, featured: false, _img: 5 },
  { name: 'Filigree Moon Pendant', description: 'Crescent moon pendant in 22kt gold filigree wire-work on a 16-inch cable chain. Romance spun in precious metal.', price: 32000, material: 'Gold', category: 'Necklaces', inStock: true,  featured: false, _img: 0 },
  { name: 'Rani Haar Long Necklace', description: 'Grand rani haar in 22kt gold with three strands of faceted gold beads terminating in a large floral pendant, 30 inches.', price: 350000, material: 'Gold', category: 'Necklaces', inStock: false, featured: false, _img: 1 },
  { name: 'Tahitian Pearl Pendant', description: 'Single 12mm Tahitian black pearl set in an 18kt white gold swirl setting on a 16-inch chain. Rare oceanic luxury.', price: 145000, material: 'White Gold with Tahitian Pearl', category: 'Necklaces', inStock: true,  featured: false, _img: 2 },
  { name: 'Sunburst Diamond Pendant', description: 'Round-cut diamonds radiating from a central point in a sunburst setting, 18kt yellow gold, 16-inch chain. Radiant energy.', price: 115000, material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: true,  _img: 3 },
  { name: 'Elephant Locket Necklace', description: 'Hollow elephant pendant that opens to reveal a tiny photo locket inside, 22kt gold, 18-inch chain. Heirloom potential.', price: 55000, material: 'Gold', category: 'Necklaces', inStock: true,  featured: false, _img: 4 },
  { name: 'Double Halo Diamond Pendant', description: 'Round brilliant (0.7ct) in double halo diamond setting, 18kt white gold, 16-inch micro chain. Maximum visual impact.', price: 175000, material: 'White Gold with Diamonds', category: 'Necklaces', inStock: false, featured: false, _img: 5 },
  { name: 'Gold Plaque Necklace', description: 'Rectangular plaque pendant with engine-turned guilloché texture in 22kt gold on an 18-inch trace chain. Understated luxury.', price: 68000, material: 'Gold', category: 'Necklaces', inStock: true,  featured: false, _img: 0 },
  { name: 'Celestial Star Pendant', description: 'Six-pointed star pendant pavé-set with round diamonds, 18kt yellow gold, 16-inch chain. A guiding star in precious metal.', price: 52000, material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 1 },
  { name: 'Meenakari Hasli Necklace', description: 'Rigid torque-style hasli necklace in 22kt gold with meenakari enamel work across the front face. Queenly presence.', price: 225000, material: 'Gold with Enamel', category: 'Necklaces', inStock: false, featured: false, _img: 2 },
  { name: 'Arrow Pendant Necklace', description: 'Diamond-set arrow pendant pointing forward in 18kt yellow gold on a 16-inch chain. A symbol of direction and purpose.', price: 42000, material: 'Gold with Diamonds', category: 'Necklaces', inStock: true,  featured: false, _img: 3 },
  { name: 'Spinel Berry Necklace', description: 'Clusters of vivid pink spinel beads with 18kt gold caps on a multi-strand gold chain, 18 inches. Berry-bright luxury.', price: 95000, material: 'Gold with Spinel', category: 'Necklaces', inStock: true,  featured: false, _img: 4 },

  // ══════════════════════════════════════════════════
  //  ANKLETS  (22 products)
  // ══════════════════════════════════════════════════
  { name: 'Bell Charm Anklet', description: 'Traditional ghungroo-style 22kt gold anklet with ten tiny bell charms. Each step makes the softest, most musical sound.', price: 18000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 0 },
  { name: 'Floral Motif Anklet', description: 'Delicate 22kt gold anklet with small laser-cut floral charms at regular intervals. Light, feminine, and distinctly Indian.', price: 22000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 1 },
  { name: 'Diamond Station Anklet', description: 'Fine 18kt white gold anklet with five round brilliants set at equal intervals, 10 inches. Quietly dazzling.', price: 68000, material: 'White Gold with Diamonds', category: 'Anklets', inStock: false, featured: false, _img: 2 },
  { name: 'Thick Curb Chain Anklet', description: 'Bold curb-link anklet in 22kt gold, 10 inches. Substantial enough to wear as a statement without any charms.', price: 35000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 3 },
  { name: 'Dolphin Charm Anklet', description: 'Fine 18kt yellow gold anklet with three leaping dolphin charms. Playful maritime charm for the beach-loving spirit.', price: 24000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 0 },
  { name: 'Elephant Charm Anklet', description: '22kt gold anklet hung with five tiny elephant charms, each with a raised trunk for good luck. Traditional and charming.', price: 28500, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 1 },
  { name: 'Turquoise Bead Anklet', description: 'Round turquoise beads alternating with 18kt gold disc spacers on a fine gold chain. Boho luxury at the ankle.', price: 31000, material: 'Gold with Turquoise', category: 'Anklets', inStock: false, featured: false, _img: 2 },
  { name: 'Payal Double Layer Anklet', description: 'Traditional payal-style double-strand anklet in 22kt gold with matching ball beads on both strands.', price: 44000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 3 },
  { name: 'Lotus Flower Anklet', description: 'Fine 22kt gold anklet with five open lotus flower charms. The lotus symbolises purity and new beginnings.', price: 26000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 0 },
  { name: 'Pearl Drop Anklet', description: 'Delicate 18kt gold anklet with freshwater pearl drops at every third link. Feminine and refined for summer wear.', price: 38000, material: 'Gold with Pearls', category: 'Anklets', inStock: false, featured: false, _img: 1 },
  { name: 'Figaro Anklet', description: 'Classic figaro-link 22kt gold anklet, 10 inches with a 2-inch extender. A timeless chain style in the ideal length.', price: 16500, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 2 },
  { name: 'Star Charm Anklet', description: '18kt rose gold anklet hung with five tiny celestial star charms. Magical, lighthearted, and perfectly romantic.', price: 21000, material: 'Rose Gold', category: 'Anklets', inStock: true,  featured: false, _img: 3 },
  { name: 'Evil Eye Charm Anklet', description: '22kt gold anklet with seven tiny evil eye charms in blue enamel. Protective symbolism and beautiful craftsmanship combined.', price: 32000, material: 'Gold with Enamel', category: 'Anklets', inStock: true,  featured: false, _img: 0 },
  { name: 'Coin Charm Anklet', description: '18kt gold anklet hung with three hammered gold coin charms. Ancient currency aesthetic meets modern wearability.', price: 27000, material: 'Gold', category: 'Anklets', inStock: false, featured: false, _img: 1 },
  { name: 'Butterfly Charm Anklet', description: 'Fine 18kt yellow gold anklet with five butterfly wing charms. Light as air, beautiful in motion.', price: 23500, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 2 },
  { name: 'Broad Bead Anklet', description: 'Wide 22kt gold anklet made of large faceted gold beads strung on a silk core, 10 inches. Bold adornment for the ankle.', price: 55000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 3 },
  { name: 'Ruby Accented Anklet', description: '22kt gold anklet with small ruby cabochons at every third link. A rich pop of colour against the gold.', price: 48000, material: 'Gold with Rubies', category: 'Anklets', inStock: false, featured: false, _img: 0 },
  { name: 'Snake Link Anklet', description: 'Smooth snake-link 18kt gold anklet, 10 inches with a spring clasp. The fluid links wrap the ankle like a second skin.', price: 29000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 1 },
  { name: 'Meenakari Payal', description: 'Traditional payal anklet with meenakari enamel panels in 22kt gold. A riotous celebration of colour at the ankle.', price: 42000, material: 'Gold with Enamel', category: 'Anklets', inStock: true,  featured: false, _img: 2 },
  { name: 'Double Strand Pearl Anklet', description: 'Two strands of seed pearls secured between 18kt gold ball beads, 10 inches. Bridal-inspired elegance for the foot.', price: 52000, material: 'Gold with Pearls', category: 'Anklets', inStock: false, featured: false, _img: 3 },
  { name: 'Heart Charm Anklet', description: '18kt rose gold anklet with five tiny open-heart charms at equal intervals. Romantic symbolism, wearable everyday.', price: 19500, material: 'Rose Gold', category: 'Anklets', inStock: true,  featured: false, _img: 0 },
  { name: 'Feather Charm Anklet', description: 'Fine 18kt gold anklet with three feather charms of varying sizes. Free-spirited and beautifully delicate.', price: 24000, material: 'Gold', category: 'Anklets', inStock: true,  featured: false, _img: 1 },
];

// ─── Code generation ──────────────────────────────────────────────────────────
async function getMaxCounters(prefixMap) {
  const counters = {};
  for (const [catName, prefix] of Object.entries(prefixMap)) {
    const existing = await Product.find(
      { productCode: { $regex: `^${prefix}\\d+$` } },
      { productCode: 1 }
    ).lean();
    const nums = existing.map((p) => parseInt(p.productCode.slice(prefix.length), 10)).filter(Boolean);
    counters[prefix] = nums.length ? Math.max(...nums) : 100;
  }
  return counters;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seedBulk() {
  await connectDB();

  // Build prefix map from categories in DB
  const cats = await Category.find({}).lean();
  if (!cats.length) {
    console.error('No categories found — run the base seed.js first.');
    process.exit(1);
  }
  const prefixMap = {};
  const catExists = new Set();
  for (const c of cats) {
    prefixMap[c.name] = c.codePrefix;
    catExists.add(c.name);
  }

  // Find max existing counters per prefix
  const counters = await getMaxCounters(prefixMap);
  console.log('Current max codes:', counters);

  // Build product docs
  const docs = [];
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    if (!catExists.has(t.category)) {
      console.warn(`  Skipping "${t.name}" — category "${t.category}" not in DB`);
      continue;
    }
    const prefix = prefixMap[t.category];
    counters[prefix] = (counters[prefix] || 100) + 1;
    const productCode = `${prefix}${counters[prefix]}`;
    docs.push({
      name:        t.name,
      description: t.description,
      price:       t.price,
      images:      img(t.category, t._img),
      material:    t.material,
      category:    t.category,
      productCode,
      inStock:     t.inStock,
      featured:    t.featured,
    });
  }

  console.log(`Inserting ${docs.length} products…`);

  // Use ordered:false so a duplicate-code error skips that doc and continues
  let inserted = 0;
  try {
    const result = await Product.insertMany(docs, { ordered: false });
    inserted = result.length;
  } catch (err) {
    // BulkWriteError: some inserted, some skipped
    inserted = err.insertedDocs ? err.insertedDocs.length : (err.result?.nInserted ?? 0);
    const skipped = docs.length - inserted;
    if (skipped > 0) console.warn(`  ${skipped} products skipped (likely duplicate codes)`);
  }

  const total = await Product.countDocuments();
  console.log(`\n✓ Inserted ${inserted} new products`);
  console.log(`✓ Total products in DB: ${total}`);
  console.log('\nBulk seed complete!');
  process.exit(0);
}

seedBulk().catch((err) => {
  console.error('Bulk seed error:', err);
  process.exit(1);
});
