import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models/Product.js';
import { Category } from './models/Category.js';
import { Setting } from './models/Setting.js';
import { generateProductCode } from './utils/codeGenerator.js';

const CATEGORIES = [
  { name: 'Rings',     codePrefix: 'RI' },
  { name: 'Necklaces', codePrefix: 'NK' },
  { name: 'Earrings',  codePrefix: 'ER' },
  { name: 'Bracelets', codePrefix: 'BR' },
  { name: 'Anklets',   codePrefix: 'AN' },
  { name: 'Bangles',   codePrefix: 'BG' },
  { name: 'Pendants',  codePrefix: 'PD' },
  { name: 'Sets',      codePrefix: 'ST' },
];

const DEFAULT_SETTINGS = [
  { key: 'whatsapp_number', value: '' },
  { key: 'admin_password',  value: 'aurum2024' },
];

const pImgs = (key, count = 2) =>
  Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/sakab-${key}-${i + 1}/800/1000`);
const vImgs = (key, vi) => [
  `https://picsum.photos/seed/sakab-${key}-v${vi}-1/800/1000`,
  `https://picsum.photos/seed/sakab-${key}-v${vi}-2/800/1000`,
];

const PRODUCTS = [
  /* ── RINGS (25) ─────────────────────────────────────────────────── */
  { name: 'Kundan Floral Statement Ring', category: 'Rings', material: 'Kundan with Gold Plated Base', price: 1249, description: 'Hand-set kundan stones surround a central crystal in a regal floral silhouette. Perfect for festive ethnic wear and weddings. Keep dry and away from perfume to preserve the polish.', images: pImgs('r1', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Rose Gold Stackable Triple Ring', category: 'Rings', material: 'Rose Gold Plated Brass', price: 1099, description: 'Three slim bands joined in a continuous twist for an effortless layered look on a single finger. Wear together or stack apart with everyday outfits. Hypoallergenic plating designed for daily wear.', images: pImgs('r2', 3), inStock: true, featured: true, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 1099, images: vImgs('r2', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 1149, images: vImgs('r2', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 1049, images: vImgs('r2', 3), isDefault: false, inStock: false, demandCount: 7 },
    ] },
  { name: 'Oxidised Silver Tribal Ring', category: 'Rings', material: 'Oxidised German Silver', price: 599, description: 'Bold hand-engraved tribal motifs on an adjustable open band. Pairs beautifully with handloom kurtas and indo-western looks. Wipe with a soft dry cloth to remove tarnish from time to time.', images: pImgs('r3', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Pearl Cluster Cocktail Ring', category: 'Rings', material: 'Gold Plated Brass', price: 899, description: 'A bouquet of freshwater pearls clustered around a gold-plated brass dome. Brings instant elegance to anniversaries, parties, and special dinners. Keep separate from hard jewellery to protect the pearl finish.', images: pImgs('r4', 2), inStock: false, featured: false, demandCount: 11 },
  { name: 'Meenakari Peacock Ring', category: 'Rings', material: 'Gold Plated Brass', price: 749, description: 'Vibrant hand-painted meenakari enamel forms a delicate peacock atop a slim band. A statement piece for sarees and festive ethnic outfits. Store in a soft pouch to keep enamel chip-free.', images: pImgs('r5', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Gold',          price: 749, images: vImgs('r5', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',     price: 799, images: vImgs('r5', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Antique Gold',  price: 849, images: vImgs('r5', 3), isDefault: false, inStock: false, demandCount: 4 },
    ] },
  { name: 'Minimal Gold Knuckle Ring', category: 'Rings', material: 'Gold Plated Brass', price: 399, description: 'A clean polished band designed to sit above the knuckle. Subtle enough for office wear, stackable for weekends. Tarnish-free brass with a gentle gold tone.', images: pImgs('r6', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Polki Ring', category: 'Rings', material: 'Antique Gold Plated Copper', price: 1349, description: 'Uncut polki stones nestled in a Victorian-inspired antique gold setting. Built for weddings and grand occasions. Hand-finished and lightly polished for an heirloom look.', images: pImgs('r7', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Two-Tone Twist Band Ring', category: 'Rings', material: 'Two-tone Gold-Silver Plated Brass', price: 849, description: 'Gold and silver strands twist together along a slim continuous band. A versatile piece that complements both metal tones in any outfit. Wipe clean with a dry cloth — do not soak.', images: pImgs('r8', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Two-tone',  price: 849, images: vImgs('r8', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 799, images: vImgs('r8', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 779, images: vImgs('r8', 3), isDefault: false, inStock: false, demandCount: 9 },
    ] },
  { name: 'Filigree Lotus Ring', category: 'Rings', material: '925 Sterling Silver', price: 1099, description: 'Hand-cut silver filigree forms an open lotus that wraps around the finger. Suits both ethnic and modern minimal styling. Sterling silver may oxidise over time — polish with a silver cloth to restore shine.', images: pImgs('r9', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Emerald Green Stone Ring', category: 'Rings', material: 'Antique Gold Plated Copper', price: 1199, description: 'A single emerald-toned glass stone set in a textured antique gold halo. A timeless cocktail piece for festive evenings and weddings. Avoid contact with water and lotion.', images: pImgs('r10', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Antique Gold', price: 1199, images: vImgs('r10', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',         price: 1149, images: vImgs('r10', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 1249, images: vImgs('r10', 3), isDefault: false, inStock: false, demandCount: 13 },
    ] },
  { name: 'Sapphire Blue Eternity Ring', category: 'Rings', material: 'Gold Plated Brass', price: 1049, description: 'A row of sapphire-toned crystals set continuously around a thin gold band. Looks beautiful stacked with simple gold rings. Hypoallergenic and skin-safe.', images: pImgs('r11', 2), inStock: false, featured: false, demandCount: 18 },
  { name: 'Crystal Halo Cocktail Ring', category: 'Rings', material: 'Rose Gold Plated Brass', price: 1149, description: 'A central crystal framed by a halo of pavé stones for a glamorous statement. Designed for special occasions and evening wear. Avoid water and cosmetics for lasting sparkle.', images: pImgs('r12', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Geometric Hexagon Stackable Ring', category: 'Rings', material: 'Rose Gold Plated Brass', price: 599, description: 'A flat hexagonal face on a slim band that stacks beautifully with other minimal rings. Bold geometric design for modern office wear. Tarnish-free finish.', images: pImgs('r13', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 599, images: vImgs('r13', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 599, images: vImgs('r13', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 549, images: vImgs('r13', 3), isDefault: false, inStock: false, demandCount: 3 },
    ] },
  { name: 'Temple Goddess Ring', category: 'Rings', material: 'Antique Gold Plated Copper', price: 949, description: 'Intricately moulded goddess motif framed by a leaf border in antique gold. A devotional piece often worn for festivals and pujas. Avoid water and oil exposure.', images: pImgs('r14', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Ruby Red Heart Promise Ring', category: 'Rings', material: 'Gold Plated Brass', price: 699, description: 'A small ruby-toned heart set into a polished gold band. A delicate, romantic everyday piece or thoughtful gift. Tarnish-free brass holds shine through daily wear.', images: pImgs('r15', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Moonstone Solitaire Ring', category: 'Rings', material: '925 Sterling Silver', price: 1299, description: 'A milky moonstone cabochon set in a fine silver four-prong setting. Wear alone for a quiet, mystical look. Sterling silver — polish occasionally to keep the lustre.', images: pImgs('r16', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Silver',     price: 1299, images: vImgs('r16', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',  price: 1349, images: vImgs('r16', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Gold',       price: 1349, images: vImgs('r16', 3), isDefault: false, inStock: false, demandCount: 6 },
    ] },
  { name: 'Hammered Silver Open Ring', category: 'Rings', material: 'Oxidised German Silver', price: 449, description: 'A wide hammered-finish band with a small open gap for adjustable fit. A handcrafted artisan look perfect for indo-western and boho styling. Wipe with a dry cloth to maintain texture.', images: pImgs('r17', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Vintage Victorian Cluster Ring', category: 'Rings', material: 'Antique Gold Plated Copper', price: 1199, description: 'A cluster of small crystal stones in an ornate vintage Victorian setting. Made for evenings, anniversaries, and grand events. Hand-detailed work — avoid water.', images: pImgs('r18', 2), inStock: false, featured: false, demandCount: 14 },
  { name: 'Tri-Color Rolling Band Ring', category: 'Rings', material: 'Tri-color Gold-Silver-Rose Plated Brass', price: 999, description: 'Three slim bands in gold, silver, and rose gold roll together as one ring. A timeless versatile piece that matches any metal tone. Tarnish-resistant plating designed for everyday wear.', images: pImgs('r19', 3), inStock: true, featured: true, demandCount: 0,
    variants: [
      { color: 'Tri-tone',  price: 999, images: vImgs('r19', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 949, images: vImgs('r19', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold', price: 949, images: vImgs('r19', 3), isDefault: false, inStock: false, demandCount: 12 },
    ] },
  { name: 'Onyx Black Statement Ring', category: 'Rings', material: 'Gold Plated Brass', price: 849, description: 'A polished black onyx stone set in a square gold-plated frame. Striking against light outfits and ideal for evening events. Avoid water and harsh chemicals.', images: pImgs('r20', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Coral Pink Floral Ring', category: 'Rings', material: 'Rose Gold Plated Brass', price: 579, description: 'Tiny coral-pink enamel petals form a delicate flower atop a rose gold band. A romantic touch for summer dresses and brunches. Keep dry to preserve enamel.', images: pImgs('r21', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Turquoise Boho Ring', category: 'Rings', material: 'Oxidised German Silver', price: 649, description: 'A raw turquoise stone set in an oxidised silver bohemian frame. Perfect for festivals, vacations, and casual styling. Hand-set stone — handle gently.', images: pImgs('r22', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Oxidised Silver', price: 649, images: vImgs('r22', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Silver',          price: 679, images: vImgs('r22', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Antique Gold',    price: 729, images: vImgs('r22', 3), isDefault: false, inStock: false, demandCount: 5 },
    ] },
  { name: 'Antique Gold Engraved Band', category: 'Rings', material: 'Antique Gold Plated Copper', price: 799, description: 'A wide flat band with intricate hand-engraved Mughal motifs. Suits sarees, lehengas, and traditional ensembles. Avoid contact with water for lasting finish.', images: pImgs('r23', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Dainty Pearl Stack Ring', category: 'Rings', material: 'Gold Plated Brass', price: 349, description: 'Three petite freshwater pearls set in a row on a thin gold band. Designed for everyday subtlety and stacking. Pearl-safe coating — store separately from harder jewellery.', images: pImgs('r24', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Mirror Work Statement Ring', category: 'Rings', material: 'Oxidised German Silver', price: 729, description: 'Small Gujarati mirror inlays set in an oxidised silver geometric frame. A bold cultural piece for festive and indo-western wear. Wipe gently — avoid soaking.', images: pImgs('r25', 2), inStock: false, featured: false, demandCount: 22 },

  /* ── NECKLACES (30) ─────────────────────────────────────────────── */
  { name: 'Minimal Pearl Choker Necklace', category: 'Necklaces', material: 'Gold Plated Brass', price: 949, description: 'A single strand of small freshwater pearls on a fine gold-plated chain. Elegant for office wear, brunches, and minimal everyday styling. Store in a soft pouch to protect the pearl finish.', images: pImgs('n1', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Kundan Layered Bridal Necklace', category: 'Necklaces', material: 'Kundan with Gold Plated Base', price: 2999, description: 'Three tiers of hand-set kundan stones cascading from a regal central pendant. Designed for brides and grand wedding functions. Avoid water and store flat to preserve the layout.', images: pImgs('n2', 3), inStock: true, featured: true, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 2999, images: vImgs('n2', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 3099, images: vImgs('n2', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 3099, images: vImgs('n2', 3), isDefault: false, inStock: false, demandCount: 11 },
    ] },
  { name: 'Oxidised Silver Coin Necklace', category: 'Necklaces', material: 'Oxidised German Silver', price: 699, description: 'A row of antique-finish coins strung on an oxidised chain with a tassel detail at the centre. Perfect for festivals and ethnic looks with a bohemian touch. Wipe with a soft dry cloth to maintain the oxidised finish.', images: pImgs('n3', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Rose Gold Heart Pendant Chain', category: 'Necklaces', material: 'Rose Gold Plated Brass', price: 599, description: 'A small open-heart pendant on a delicate rose gold chain. Sweet enough for daily wear or as a layering piece in your stack. Tarnish-resistant plating made for everyday styling.', images: pImgs('n4', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Temple Gold Lakshmi Long Haram', category: 'Necklaces', material: 'Antique Gold Plated Copper', price: 2299, description: 'A traditional long temple chain with a central Lakshmi pendant and small bell motifs along the length. Crafted for festive and bridal occasions in South Indian styling. Avoid moisture and store carefully.', images: pImgs('n5', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Antique Gold', price: 2299, images: vImgs('n5', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',         price: 2349, images: vImgs('n5', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',       price: 2199, images: vImgs('n5', 3), isDefault: false, inStock: false, demandCount: 8 },
    ] },
  { name: 'Meenakari Peacock Choker', category: 'Necklaces', material: 'Gold Plated Brass', price: 1299, description: 'Hand-painted peacock motifs in vibrant meenakari enamel along a structured choker base. Statement piece that elevates sarees and lehengas instantly. Keep enamel away from perfume to prevent chipping.', images: pImgs('n6', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Polki Statement Necklace', category: 'Necklaces', material: 'Antique Gold Plated Copper', price: 2499, description: 'Uncut polki stones set across a wide antique gold collar with pearl drops along the lower edge. Designed for bridal receptions and grand evenings. Hand-finished — avoid water.', images: pImgs('n7', 3), inStock: true, featured: true, demandCount: 0 },
  { name: 'Floral Jadau Multilayer Necklace', category: 'Necklaces', material: 'Kundan with Gold Plated Base', price: 2799, description: 'Three layers of floral jadau work joined by fine chains and small pearl drops at the centre. A regal piece for wedding ceremonies and sangeet evenings. Store flat in a soft pouch.', images: pImgs('n8', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 2799, images: vImgs('n8', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 2899, images: vImgs('n8', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 2899, images: vImgs('n8', 3), isDefault: false, inStock: false, demandCount: 14 },
    ] },
  { name: 'Emerald Green Beaded Necklace', category: 'Necklaces', material: 'Gold Plated Brass', price: 1099, description: 'A strand of emerald-toned glass beads anchored by a delicate gold-plated centrepiece. Beautiful with sarees and Indo-western dresses for festive evenings. Wipe clean and avoid water.', images: pImgs('n9', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Pearl Cascade Layered Necklace', category: 'Necklaces', material: 'Gold Plated Brass', price: 1349, description: 'Multiple layers of freshwater pearls cascading at staggered lengths from a single fine clasp. A timeless evening look for parties and weddings. Pearl-safe finish protects against everyday wear.', images: pImgs('n10', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Crystal Drop Choker', category: 'Necklaces', material: 'Rose Gold Plated Brass', price: 1199, description: 'A delicate row of crystal teardrops set into a structured rose gold choker. Elegant for receptions and evening wear with cocktail dresses. Avoid water and perfumes for lasting sparkle.', images: pImgs('n11', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 1199, images: vImgs('n11', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 1199, images: vImgs('n11', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 1149, images: vImgs('n11', 3), isDefault: false, inStock: false, demandCount: 6 },
    ] },
  { name: 'Geometric Bar Pendant Chain', category: 'Necklaces', material: 'Gold Plated Brass', price: 549, description: 'A simple polished gold bar suspended on a fine chain. Minimal piece for office and daily wear that layers beautifully with longer chains. Tarnish-free brass plating.', images: pImgs('n12', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Two-Tone Snake Chain', category: 'Necklaces', material: 'Two-tone Gold-Silver Plated Brass', price: 899, description: 'A sleek snake chain alternating between gold and silver tones for a modern twist on a classic. Versatile across any outfit and any other jewellery. Wipe clean with a dry cloth.', images: pImgs('n13', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Two-tone', price: 899, images: vImgs('n13', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',     price: 849, images: vImgs('n13', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',   price: 849, images: vImgs('n13', 3), isDefault: false, inStock: false, demandCount: 10 },
    ] },
  { name: 'Ruby Red Rani Haar', category: 'Necklaces', material: 'Antique Gold Plated Copper', price: 2599, description: 'A traditional long rani haar with ruby-toned drops and a regal central pendant. Made for bridal and grand festive moments with a Mughal-era feel. Hand-detailed — avoid moisture.', images: pImgs('n14', 2), inStock: false, featured: false, demandCount: 17 },
  { name: 'Turquoise Tassel Long Necklace', category: 'Necklaces', material: 'Oxidised German Silver', price: 999, description: 'Long oxidised silver chain ending in a vibrant turquoise stone with tassel detail. Beautiful for boho, festival, and indo-western styling. Wipe gently to maintain finish.', images: pImgs('n15', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Filigree Silver Choker', category: 'Necklaces', material: '925 Sterling Silver', price: 1499, description: 'Hand-cut sterling silver filigree forms an elegant choker collar with lace-like detail. A versatile statement piece for parties and weddings. Polish gently with a silver cloth to restore lustre.', images: pImgs('n16', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Silver',    price: 1499, images: vImgs('n16', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Rose Gold', price: 1549, images: vImgs('n16', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 1599, images: vImgs('n16', 3), isDefault: false, inStock: false, demandCount: 3 },
    ] },
  { name: 'Minimal Gold Bar Necklace', category: 'Necklaces', material: 'Gold Plated Brass', price: 649, description: 'A small polished gold bar on an ultra-thin chain. The perfect minimal layering piece for daily wear, office, and weekend brunches. Tarnish-free brass holds its shine.', images: pImgs('n17', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Onyx Black Layered Chain', category: 'Necklaces', material: 'Gold Plated Brass', price: 1149, description: 'Two layers of fine chain, one studded with small black onyx beads at intervals. Stylish for office wear or evenings with a modern edge. Avoid harsh chemicals.', images: pImgs('n18', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Gold Hasli Necklace', category: 'Necklaces', material: 'Antique Gold Plated Copper', price: 1699, description: 'A rigid antique gold neck-ring with engraved Mughal-style motifs along its curve. A bold traditional piece for ethnic wear and bridal looks. Hand-engraved — handle with care.', images: pImgs('n19', 2), inStock: false, featured: false, demandCount: 9 },
  { name: 'Sapphire Blue Statement Necklace', category: 'Necklaces', material: 'Rose Gold Plated Brass', price: 1599, description: 'A bold sapphire-toned central stone framed by a halo of crystals on a delicate chain. Designed for parties and special evenings. Hand-set stones — avoid water.', images: pImgs('n20', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold',    price: 1599, images: vImgs('n20', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',         price: 1549, images: vImgs('n20', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 1649, images: vImgs('n20', 3), isDefault: false, inStock: false, demandCount: 5 },
    ] },
  { name: 'Moonstone Drop Chain', category: 'Necklaces', material: '925 Sterling Silver', price: 999, description: 'A simple moonstone drop suspended on a fine sterling silver chain. Quiet and mystical for everyday wear and layering. Polish gently to keep the soft lustre.', images: pImgs('n21', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Coral Beaded Tribal Necklace', category: 'Necklaces', material: 'Oxidised German Silver', price: 799, description: 'A strand of coral-toned beads with oxidised silver tribal pendants spaced along the length. Beautiful for handloom kurtas and ethnic styling. Wipe with a soft cloth.', images: pImgs('n22', 2), inStock: false, featured: false, demandCount: 20 },
  { name: 'Mirror Work Choker Set', category: 'Necklaces', material: 'Oxidised German Silver', price: 1249, description: 'Small mirror inlays set into a structured oxidised silver choker with a matching small pendant. Bold cultural styling for festive occasions and ethnic wear. Handle gently.', images: pImgs('n23', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Pearl Y-Drop Long Chain', category: 'Necklaces', material: 'Gold Plated Brass', price: 849, description: 'A long chain with a Y-shaped drop ending in a single freshwater pearl. Modern and feminine for office and brunches. Tarnish-free finish for daily wear.', images: pImgs('n24', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Kundan Jadau Layered Set', category: 'Necklaces', material: 'Kundan with Gold Plated Base', price: 2899, description: 'A layered jadau necklace combining kundan stones with pearl and meenakari accents in a regal layout. A bridal statement for grand functions. Store flat — avoid moisture.', images: pImgs('n25', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 2899, images: vImgs('n25', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 2999, images: vImgs('n25', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',       price: 2799, images: vImgs('n25', 3), isDefault: false, inStock: false, demandCount: 13 },
    ] },
  { name: 'Oxidised Ghungroo Long Necklace', category: 'Necklaces', material: 'Oxidised German Silver', price: 949, description: 'A long oxidised chain ending in a cluster of small ghungroo bells that jingle gently with movement. Beautiful for indo-western and festival styling. Wipe gently to maintain finish.', images: pImgs('n26', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Crystal Rivet Choker', category: 'Necklaces', material: 'Rose Gold Plated Brass', price: 1349, description: 'A structured rose gold choker studded with rows of small crystals like rivets. Glamorous for receptions and evening parties with cocktail dresses. Hand-set stones — avoid water.', images: pImgs('n27', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Vintage Victorian Pendant Chain', category: 'Necklaces', material: 'Antique Gold Plated Copper', price: 1199, description: 'An ornate vintage pendant on a fine antique gold chain with intricate filigree detailing. A heirloom-feel piece for special occasions and evening wear. Hand-detailed — avoid moisture.', images: pImgs('n28', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Tri-Color Twist Necklace', category: 'Necklaces', material: 'Tri-color Gold-Silver-Rose Plated Brass', price: 1099, description: 'Three slim chains in gold, silver, and rose gold twisted into a single elegant necklace. Pairs with any outfit and any other metal-tone jewellery. Tarnish-resistant.', images: pImgs('n29', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Floral Meenakari Long Haram', category: 'Necklaces', material: 'Gold Plated Brass', price: 1549, description: 'A long haram of hand-painted floral meenakari motifs joined by fine chains. Traditional yet vibrant for festive wear and bridal photos. Store carefully to avoid enamel chips.', images: pImgs('n30', 2), inStock: false, featured: false, demandCount: 25 },

  /* ── EARRINGS (35) ──────────────────────────────────────────────── */
  { name: 'Kundan Pearl Chandbali Earrings', category: 'Earrings', material: 'Kundan with Gold Plated Base', price: 1399, description: 'Crescent-shaped chandbalis edged in kundan stones with delicate pearl drops along the curve. Bridal-ready for weddings and receptions. Hand-detailed — store in a soft pouch to prevent damage.', images: pImgs('e1', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 1399, images: vImgs('e1', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 1449, images: vImgs('e1', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 1449, images: vImgs('e1', 3), isDefault: false, inStock: false, demandCount: 9 },
    ] },
  { name: 'Oxidised Silver Jhumka', category: 'Earrings', material: 'Oxidised German Silver', price: 449, description: 'Classic oxidised jhumkas with intricate temple engravings and a row of small ghungroo bells. Beautiful for festivals, ethnic wear, and everyday indo-western looks. Wipe with a dry cloth to maintain finish.', images: pImgs('e2', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Rose Gold Geometric Studs', category: 'Earrings', material: 'Rose Gold Plated Brass', price: 399, description: 'Small geometric triangle studs in polished rose gold for a modern minimal look. A staple for office, daily wear, and weekend brunches. Tarnish-free plating.', images: pImgs('e3', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold',       price: 399, images: vImgs('e3', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',            price: 399, images: vImgs('e3', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Matt Gold',       price: 449, images: vImgs('e3', 3), isDefault: false, inStock: false, demandCount: 2 },
    ] },
  { name: 'Temple Gold Long Drops', category: 'Earrings', material: 'Antique Gold Plated Copper', price: 999, description: 'Long antique gold drops with traditional temple motifs and small bell endings. Made for festive ethnic styling, especially South Indian sarees. Avoid moisture for lasting shine.', images: pImgs('e4', 2), inStock: false, featured: false, demandCount: 16 },
  { name: 'Meenakari Peacock Jhumka', category: 'Earrings', material: 'Gold Plated Brass', price: 1199, description: 'Vibrant hand-painted meenakari peacock motifs on a classic jhumka silhouette. A festive favourite for sarees and lehengas during weddings and pujas. Keep enamel away from perfume.', images: pImgs('e5', 3), inStock: true, featured: true, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 1199, images: vImgs('e5', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 1249, images: vImgs('e5', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Matt Gold',    price: 1199, images: vImgs('e5', 3), isDefault: false, inStock: false, demandCount: 11 },
    ] },
  { name: 'Antique Polki Chandbali', category: 'Earrings', material: 'Antique Gold Plated Copper', price: 1499, description: 'Uncut polki stones set in a traditional chandbali frame with pearl drops. Designed for bridal moments and grand events with deep cultural feel. Avoid water and store flat.', images: pImgs('e6', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Two-Tone Hoop Earrings', category: 'Earrings', material: 'Two-tone Gold-Silver Plated Brass', price: 549, description: 'Medium hoops alternating between gold and silver finishes for versatile styling. Pairs with any metal tone in your existing jewellery collection. Tarnish-resistant plating.', images: pImgs('e7', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Filigree Floral Drops', category: 'Earrings', material: '925 Sterling Silver', price: 899, description: 'Hand-cut silver filigree forms delicate flower drops on a hook fitting. Subtle yet eye-catching for office and evening wear. Polish gently with a silver cloth to maintain shine.', images: pImgs('e8', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Emerald Green Stone Studs', category: 'Earrings', material: 'Antique Gold Plated Copper', price: 599, description: 'Single emerald-toned stones set in textured antique gold studs. Suits both ethnic and Indo-western looks for festive evenings. Avoid water and direct sunlight.', images: pImgs('e9', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Antique Gold', price: 599, images: vImgs('e9', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',         price: 579, images: vImgs('e9', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 599, images: vImgs('e9', 3), isDefault: false, inStock: false, demandCount: 4 },
    ] },
  { name: 'Pearl Cluster Cocktail Studs', category: 'Earrings', material: 'Gold Plated Brass', price: 449, description: 'A cluster of small freshwater pearls forming a flower-like stud. Elegant for receptions, brunches, and intimate dinner events. Pearl-safe coating preserves the lustre.', images: pImgs('e10', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Crystal Halo Drop Earrings', category: 'Earrings', material: 'Rose Gold Plated Brass', price: 1099, description: 'A central crystal stone framed by a halo of pavé stones in elegant rose gold drops. Designed for special evenings, anniversaries, and date nights. Avoid water and lotion.', images: pImgs('e11', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 1099, images: vImgs('e11', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 1099, images: vImgs('e11', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 1049, images: vImgs('e11', 3), isDefault: false, inStock: false, demandCount: 7 },
    ] },
  { name: 'Sapphire Blue Cascade Earrings', category: 'Earrings', material: 'Gold Plated Brass', price: 799, description: 'Cascading sapphire-toned beads down long thin gold chains for movement-rich drops. Beautiful for festive evening wear with sarees and dresses. Hand-strung — handle gently.', images: pImgs('e12', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Ruby Red Maang Tikka Set', category: 'Earrings', material: 'Antique Gold Plated Copper', price: 1299, description: 'Matching earring and maang tikka set with ruby-toned stones in antique gold. Built for bridal makeup looks and traditional photography. Hand-finished — avoid water.', images: pImgs('e13', 2), inStock: false, featured: false, demandCount: 19 },
  { name: 'Onyx Black Bali Hoops', category: 'Earrings', material: 'Gold Plated Brass', price: 699, description: 'Mid-size bali hoops studded with small black onyx beads at intervals. Modern Indo-western styling for evening looks and weekend events. Wipe with a soft dry cloth.', images: pImgs('e14', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Turquoise Tribal Drops', category: 'Earrings', material: 'Oxidised German Silver', price: 599, description: 'Raw turquoise stones set into oxidised tribal-style drops with hand-engraved detail. Boho-beautiful for festivals, travel, and outdoor styling. Handle stones with care.', images: pImgs('e15', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Coral Pink Floral Studs', category: 'Earrings', material: 'Rose Gold Plated Brass', price: 349, description: 'Small coral-pink enamel petals forming a tiny flower stud in rose gold. Sweet and feminine for daily wear, summer dresses, and gifting. Keep dry to preserve enamel.', images: pImgs('e16', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold',       price: 349, images: vImgs('e16', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',            price: 349, images: vImgs('e16', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Oxidised Silver', price: 379, images: vImgs('e16', 3), isDefault: false, inStock: false, demandCount: 1 },
    ] },
  { name: 'Mirror Work Statement Jhumka', category: 'Earrings', material: 'Oxidised German Silver', price: 949, description: 'Small Gujarati mirror inlays set into oxidised jhumkas with bell drops along the dome. Bold cultural piece for festive moments and traditional wear. Wipe gently — avoid soaking.', images: pImgs('e17', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Hammered Silver Disc Earrings', category: 'Earrings', material: '925 Sterling Silver', price: 799, description: 'Wide hammered-textured silver discs on hook fittings for a handcrafted artisan look. Indo-western styling for office or evening wear. Polish occasionally with a silver cloth.', images: pImgs('e18', 2), inStock: false, featured: false, demandCount: 12 },
  { name: 'Antique Gold Bali Hoops', category: 'Earrings', material: 'Antique Gold Plated Copper', price: 849, description: 'Traditional bali hoops with engraved antique gold detail along the band. Suits sarees, lehengas, and ethnic ensembles for weddings and festivals. Avoid water exposure.', images: pImgs('e19', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Antique Gold', price: 849, images: vImgs('e19', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',         price: 829, images: vImgs('e19', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Matt Gold',    price: 879, images: vImgs('e19', 3), isDefault: false, inStock: false, demandCount: 8 },
    ] },
  { name: 'Moonstone Teardrop Earrings', category: 'Earrings', material: '925 Sterling Silver', price: 999, description: 'Small milky moonstone teardrops in fine sterling silver settings. Quiet and mystical for daily wear, weekend events, and minimal styling. Polish gently to keep the lustre.', images: pImgs('e20', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Vintage Victorian Drops', category: 'Earrings', material: 'Antique Gold Plated Copper', price: 1149, description: 'Ornate vintage drops with small crystal accents in antique gold for evening glamour. Made for special occasions and anniversary dinners. Hand-detailed — avoid moisture.', images: pImgs('e21', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Tri-Color Hoop Set', category: 'Earrings', material: 'Tri-color Gold-Silver-Rose Plated Brass', price: 749, description: 'Three medium hoops in gold, silver, and rose gold worn together as a single statement. A versatile match for any outfit and any other jewellery. Tarnish-resistant.', images: pImgs('e22', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Tri-tone',  price: 749, images: vImgs('e22', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 699, images: vImgs('e22', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold', price: 699, images: vImgs('e22', 3), isDefault: false, inStock: false, demandCount: 6 },
    ] },
  { name: 'Dainty Star Studs', category: 'Earrings', material: 'Gold Plated Brass', price: 279, description: 'Tiny polished gold stars on small hypoallergenic studs. Sweet for daily wear, layering with hoops, and gifting to friends. Tarnish-free brass coating.', images: pImgs('e23', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Ghungroo Cascade Jhumka', category: 'Earrings', material: 'Oxidised German Silver', price: 849, description: 'Classic jhumka structure with a cascade of small ghungroo bells along the dome. A statement piece for festive ethnic looks and pujas. Wipe with a dry cloth.', images: pImgs('e24', 2), inStock: false, featured: false, demandCount: 21 },
  { name: 'Lotus Meenakari Drops', category: 'Earrings', material: 'Gold Plated Brass', price: 1049, description: 'Hand-painted meenakari lotus motifs on delicate drops with pearl accents. Beautiful for sarees and festive ethnic wear with a refined finish. Avoid perfume and store carefully.', images: pImgs('e25', 3), inStock: true, featured: true, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 1049, images: vImgs('e25', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 1099, images: vImgs('e25', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Matt Gold',    price: 1049, images: vImgs('e25', 3), isDefault: false, inStock: false, demandCount: 15 },
    ] },
  { name: 'Floral Kundan Studs', category: 'Earrings', material: 'Kundan with Gold Plated Base', price: 899, description: 'Tiny kundan flowers set in delicate gold-plated studs with subtle pearl centres. Refined for receptions, bridesmaids, and traditional photography. Hand-set stones — handle with care.', images: pImgs('e26', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Tribal Jhumka with Coin Drops', category: 'Earrings', material: 'Oxidised German Silver', price: 699, description: 'Oxidised silver jhumkas with antique coin drops dangling from the base. A handcrafted look for indo-western and festive styling. Wipe gently to maintain finish.', images: pImgs('e27', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Pearl Long Tassel Earrings', category: 'Earrings', material: 'Gold Plated Brass', price: 1099, description: 'Long tassels of freshwater pearls dropping from a small gold-plated stud. Glamorous evening movement for parties and weddings. Pearl-safe coating.', images: pImgs('e28', 2), inStock: false, featured: false, demandCount: 24 },
  { name: 'Crystal Statement Chandbali', category: 'Earrings', material: 'Rose Gold Plated Brass', price: 1349, description: 'A bold crystal-encrusted chandbali in rose gold tone with pearl drops along the lower edge. A standout piece for sangeet and receptions. Avoid water and lotion.', images: pImgs('e29', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Minimal Hoop Studs', category: 'Earrings', material: 'Gold Plated Brass', price: 349, description: 'Tiny everyday hoops on hypoallergenic posts. The perfect minimal piece for daily wear, layering, or weekend casual looks. Tarnish-free brass.', images: pImgs('e30', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Silver Lotus Drops', category: 'Earrings', material: 'Oxidised German Silver', price: 799, description: 'Oxidised silver lotus motifs cascading into small drops with delicate detailing. Cultural and refined for ethnic wear and traditional events. Wipe with a soft cloth.', images: pImgs('e31', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Oxidised Silver', price: 799, images: vImgs('e31', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Silver',          price: 829, images: vImgs('e31', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Antique Gold',    price: 879, images: vImgs('e31', 3), isDefault: false, inStock: false, demandCount: 10 },
    ] },
  { name: 'Polki Statement Ear Cuffs', category: 'Earrings', material: 'Antique Gold Plated Copper', price: 1199, description: 'Bold ear cuffs studded with polki stones and pearl drops along the curve. Statement glamour for receptions and parties. Hand-detailed — avoid water.', images: pImgs('e32', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Boho Feather Drops', category: 'Earrings', material: 'Oxidised German Silver', price: 529, description: 'Light oxidised silver feathers on long thin chains for movement-rich boho styling. Festival-ready for outdoor parties and travel. Handle gently to prevent bending.', images: pImgs('e33', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Geometric Bar Earrings', category: 'Earrings', material: 'Rose Gold Plated Brass', price: 449, description: 'Slim polished bars in rose gold on a hook fitting for a modern minimal look. Office-ready and weekend-friendly for everyday styling. Tarnish-resistant.', images: pImgs('e34', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Floral Jhumka Cluster', category: 'Earrings', material: 'Gold Plated Brass', price: 949, description: 'Small floral motifs clustered around a classic jhumka dome with bell drops underneath. Festive favourite for ethnic occasions and pujas. Avoid water for lasting finish.', images: pImgs('e35', 2), inStock: true, featured: false, demandCount: 0 },

  /* ── BRACELETS (25) ─────────────────────────────────────────────── */
  { name: 'Filigree Silver Statement Bracelet', category: 'Bracelets', material: '925 Sterling Silver', price: 1349, description: 'Wide hand-cut silver filigree wrapping around the wrist like delicate lace. Refined for sarees and Indo-western looks at weddings and parties. Polish gently with a silver cloth to maintain shine.', images: pImgs('b1', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Rose Gold Chain Link Bracelet', category: 'Bracelets', material: 'Rose Gold Plated Brass', price: 899, description: 'A polished rose gold cuban-link chain with a secure lobster clasp. Versatile across daily, office, and brunch wear with any outfit. Tarnish-free plating designed for everyday use.', images: pImgs('b2', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 899, images: vImgs('b2', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 879, images: vImgs('b2', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Matt Gold', price: 949, images: vImgs('b2', 3), isDefault: false, inStock: false, demandCount: 5 },
    ] },
  { name: 'Oxidised Tribal Cuff', category: 'Bracelets', material: 'Oxidised German Silver', price: 749, description: 'Wide oxidised cuff with hand-engraved tribal motifs along its surface. Boho-beautiful for festivals and indo-western styling. Wipe with a soft dry cloth to maintain the finish.', images: pImgs('b3', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Kundan Pearl Bridal Bracelet', category: 'Bracelets', material: 'Kundan with Gold Plated Base', price: 1699, description: 'Multi-strand pearls anchored by a kundan centrepiece for bridal grandeur. Made for weddings and sangeet evenings with intricate hand-set work. Store flat and avoid moisture.', images: pImgs('b4', 3), inStock: true, featured: true, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 1699, images: vImgs('b4', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 1749, images: vImgs('b4', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 1799, images: vImgs('b4', 3), isDefault: false, inStock: false, demandCount: 12 },
    ] },
  { name: 'Meenakari Floral Cuff', category: 'Bracelets', material: 'Gold Plated Brass', price: 1199, description: 'Wide structured cuff painted with vibrant meenakari floral motifs in jewel tones. Festive statement for sarees and ethnic wear at weddings. Keep enamel away from perfume.', images: pImgs('b5', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Polki Bracelet', category: 'Bracelets', material: 'Antique Gold Plated Copper', price: 1599, description: 'Uncut polki stones strung along a flexible antique gold base. A bridal heirloom for special occasions and traditional ceremonies. Hand-detailed — avoid water.', images: pImgs('b6', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Two-Tone Twist Bracelet', category: 'Bracelets', material: 'Two-tone Gold-Silver Plated Brass', price: 849, description: 'Gold and silver strands twisting into a single elegant bracelet. Versatile across metal-tone outfits and any other jewellery. Wipe clean — do not soak.', images: pImgs('b7', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Two-tone',  price: 849, images: vImgs('b7', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 799, images: vImgs('b7', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold', price: 829, images: vImgs('b7', 3), isDefault: false, inStock: false, demandCount: 4 },
    ] },
  { name: 'Crystal Halo Tennis Bracelet', category: 'Bracelets', material: 'Rose Gold Plated Brass', price: 1199, description: 'A continuous line of crystals in a rose gold tennis-style bracelet with secure clasp. Glamorous for parties, evening wear, and date nights. Avoid water and lotion.', images: pImgs('b8', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Emerald Green Stone Cuff', category: 'Bracelets', material: 'Antique Gold Plated Copper', price: 1149, description: 'Emerald-toned cabochon stones set into a structured antique gold cuff. Designed for festive and bridal occasions with rich colour. Hand-set stones — handle gently.', images: pImgs('b9', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Antique Gold',    price: 1149, images: vImgs('b9', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',            price: 1149, images: vImgs('b9', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Oxidised Silver', price: 1099, images: vImgs('b9', 3), isDefault: false, inStock: false, demandCount: 9 },
    ] },
  { name: 'Pearl Layered Stack Bracelet', category: 'Bracelets', material: 'Gold Plated Brass', price: 999, description: 'Three layers of small freshwater pearls joined by a fine gold clasp at the side. Refined for office, brunch, and intimate dinners. Pearl-safe finish.', images: pImgs('b10', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Sapphire Blue Beaded Bracelet', category: 'Bracelets', material: 'Gold Plated Brass', price: 799, description: 'A strand of sapphire-toned beads with gold-plated accents at regular intervals. Beautiful evening wear with sarees and dresses for festive moments. Wipe gently.', images: pImgs('b11', 2), inStock: false, featured: false, demandCount: 11 },
  { name: 'Ruby Red Charm Bracelet', category: 'Bracelets', material: 'Gold Plated Brass', price: 949, description: 'Tiny ruby-toned charms strung on a delicate gold chain with a lobster clasp. Sweet for parties, gifting, and weekend wear. Hand-strung — handle gently.', images: pImgs('b12', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Gold',      price: 949, images: vImgs('b12', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Rose Gold', price: 949, images: vImgs('b12', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Matt Gold', price: 999, images: vImgs('b12', 3), isDefault: false, inStock: false, demandCount: 3 },
    ] },
  { name: 'Onyx Black Bead Bracelet', category: 'Bracelets', material: 'Gold Plated Brass', price: 749, description: 'Smooth black onyx beads alternating with small gold-plated spacers along an elastic cord. Modern Indo-western styling for evenings and weekends. Avoid harsh chemicals.', images: pImgs('b13', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Turquoise Boho Wrap Bracelet', category: 'Bracelets', material: 'Oxidised German Silver', price: 649, description: 'Long turquoise-stone wrap that loops twice around the wrist on an oxidised silver base. Festival-ready for outdoor parties, travel, and weekend casual. Hand-strung.', images: pImgs('b14', 2), inStock: false, featured: false, demandCount: 7 },
  { name: 'Coral Pink Pearl Bracelet', category: 'Bracelets', material: 'Rose Gold Plated Brass', price: 849, description: 'Coral-toned pearls strung on a delicate rose gold chain with a heart clasp. Soft and feminine for spring and summer styling. Pearl-safe coating preserves the colour.', images: pImgs('b15', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 849, images: vImgs('b15', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 849, images: vImgs('b15', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Matt Gold', price: 899, images: vImgs('b15', 3), isDefault: false, inStock: false, demandCount: 6 },
    ] },
  { name: 'Mirror Work Cuff', category: 'Bracelets', material: 'Oxidised German Silver', price: 999, description: 'Wide oxidised cuff inlaid with small Gujarati mirrors and geometric patterns. Bold cultural statement for festive looks and traditional wear. Wipe gently — avoid soaking.', images: pImgs('b16', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Hammered Silver Open Cuff', category: 'Bracelets', material: '925 Sterling Silver', price: 1049, description: 'Wide hammered-textured open cuff with an adjustable fit for most wrist sizes. Handcrafted artisan look for office and ethnic wear. Polish occasionally with a silver cloth.', images: pImgs('b17', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Silver',          price: 1049, images: vImgs('b17', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Oxidised Silver', price: 1099, images: vImgs('b17', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',       price: 1149, images: vImgs('b17', 3), isDefault: false, inStock: false, demandCount: 13 },
    ] },
  { name: 'Antique Gold Coin Bracelet', category: 'Bracelets', material: 'Antique Gold Plated Copper', price: 1149, description: 'A strand of antique coins joined by fine chain on a lobster clasp. Festive and traditional for ethnic wear and South Indian styling. Avoid water exposure.', images: pImgs('b18', 2), inStock: false, featured: false, demandCount: 19 },
  { name: 'Moonstone Drop Bracelet', category: 'Bracelets', material: '925 Sterling Silver', price: 1099, description: 'Small moonstone drops along a fine silver chain that catches light softly. Quiet and mystical for daily wear and minimal styling. Polish gently to maintain lustre.', images: pImgs('b19', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Vintage Victorian Cuff', category: 'Bracelets', material: 'Antique Gold Plated Copper', price: 1299, description: 'Ornate vintage Victorian cuff with crystal accents and filigree detail. Made for grand occasions, anniversaries, and evening events. Hand-detailed — avoid moisture.', images: pImgs('b20', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Antique Gold', price: 1299, images: vImgs('b20', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',         price: 1299, images: vImgs('b20', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 1349, images: vImgs('b20', 3), isDefault: false, inStock: false, demandCount: 8 },
    ] },
  { name: 'Tri-Color Chain Bracelet', category: 'Bracelets', material: 'Tri-color Gold-Silver-Rose Plated Brass', price: 949, description: 'Three slim chains in gold, silver, and rose gold linked into a single bracelet. Versatile across metal tones and outfits. Tarnish-resistant plating for daily wear.', images: pImgs('b21', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Dainty Heart Charm Bracelet', category: 'Bracelets', material: 'Gold Plated Brass', price: 499, description: 'A small heart charm on a fine gold chain with a delicate lobster clasp. Romantic everyday piece or thoughtful gift for friends. Tarnish-free brass.', images: pImgs('b22', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Ghungroo Stack Bracelet', category: 'Bracelets', material: 'Oxidised German Silver', price: 799, description: 'Multiple thin oxidised bands with tiny ghungroo bells along the edge. Festive jingle for ethnic and indo-western looks at pujas and weddings. Wipe gently.', images: pImgs('b23', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Lotus Filigree Cuff', category: 'Bracelets', material: '925 Sterling Silver', price: 1249, description: 'Wide cuff with hand-cut silver filigree forming connected lotus motifs. Refined for sarees and ethnic occasions with a craft-feel. Polish gently to maintain shine.', images: pImgs('b24', 2), inStock: false, featured: false, demandCount: 16 },
  { name: 'Floral Bridal Stack Bracelet', category: 'Bracelets', material: 'Kundan with Gold Plated Base', price: 1599, description: 'A stack of three slim bridal bracelets joined into a single piece with kundan floral accents. Designed for weddings and sangeet ceremonies. Store flat — avoid moisture.', images: pImgs('b25', 2), inStock: true, featured: false, demandCount: 0 },

  /* ── ANKLETS (20) ───────────────────────────────────────────────── */
  { name: 'Oxidised Silver Ghungroo Anklet', category: 'Anklets', material: 'Oxidised German Silver', price: 599, description: 'Classic oxidised silver anklet with rows of tiny ghungroo bells that jingle gently with movement. Festive favourite for ethnic and bohemian outfits. Wipe with a soft dry cloth.', images: pImgs('a1', 3), inStock: true, featured: true, demandCount: 0 },
  { name: 'Rose Gold Beaded Anklet', category: 'Anklets', material: 'Rose Gold Plated Brass', price: 449, description: 'Tiny rose gold beads alternating with smooth links along a delicate chain. Sweet for summer dresses, beach trips, and casual wear. Tarnish-resistant plating.', images: pImgs('a2', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 449, images: vImgs('a2', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 429, images: vImgs('a2', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 449, images: vImgs('a2', 3), isDefault: false, inStock: false, demandCount: 4 },
    ] },
  { name: 'Pearl Drop Layered Anklet', category: 'Anklets', material: 'Gold Plated Brass', price: 549, description: 'Two layers of fine chain with small freshwater pearl drops along the lower length. Elegant for brunches, evening outings, and beach weddings. Pearl-safe finish.', images: pImgs('a3', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Silver Bell Anklet', category: 'Anklets', material: 'Oxidised German Silver', price: 499, description: 'Antique silver chain with three small bell drops dangling at intervals. Light jingle for festive and ethnic looks during pujas and weddings. Wipe gently.', images: pImgs('a4', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Meenakari Floral Anklet', category: 'Anklets', material: 'Gold Plated Brass', price: 699, description: 'Hand-painted meenakari flowers along a delicate gold chain with small bell endings. Vibrant for sarees, lehengas, and festive wear. Avoid perfume to protect enamel.', images: pImgs('a5', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 699, images: vImgs('a5', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 729, images: vImgs('a5', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 749, images: vImgs('a5', 3), isDefault: false, inStock: false, demandCount: 7 },
    ] },
  { name: 'Tribal Coin Anklet', category: 'Anklets', material: 'Oxidised German Silver', price: 599, description: 'Oxidised silver anklet with antique coin drops along the chain. Boho-beautiful for festivals, travel, and casual ethnic styling. Wipe with a soft cloth.', images: pImgs('a6', 2), inStock: false, featured: false, demandCount: 11 },
  { name: 'Crystal Beaded Anklet', category: 'Anklets', material: 'Gold Plated Brass', price: 479, description: 'Tiny crystal beads strung between gold-plated links for a subtle sparkle. Catches the light beautifully with movement during evening wear. Avoid water and lotion.', images: pImgs('a7', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Two-Tone Chain Anklet', category: 'Anklets', material: 'Two-tone Gold-Silver Plated Brass', price: 529, description: 'A fine two-tone link chain alternating gold and silver tones. Versatile match for any other anklet or jewellery in your collection. Tarnish-resistant.', images: pImgs('a8', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Two-tone',  price: 529, images: vImgs('a8', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 499, images: vImgs('a8', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold', price: 529, images: vImgs('a8', 3), isDefault: false, inStock: false, demandCount: 5 },
    ] },
  { name: 'Charm Bell Anklet', category: 'Anklets', material: 'Gold Plated Brass', price: 449, description: 'A delicate chain with several small bell charms spaced along the length. Subtle festive jingle for daily and ethnic wear. Tarnish-free brass.', images: pImgs('a9', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Filigree Silver Anklet', category: 'Anklets', material: '925 Sterling Silver', price: 849, description: 'Hand-cut silver filigree forms a delicate lacework chain along the anklet. Refined for sarees and ethnic ensembles with a craft-feel. Polish gently with a silver cloth.', images: pImgs('a10', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Turquoise Bohemian Anklet', category: 'Anklets', material: 'Oxidised German Silver', price: 579, description: 'A row of turquoise stones set into a fine oxidised silver chain. Boho-perfect for vacations, outdoor parties, and festival styling. Hand-strung — handle gently.', images: pImgs('a11', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Ruby Red Bead Anklet', category: 'Anklets', material: 'Gold Plated Brass', price: 499, description: 'Tiny ruby-toned beads alternating with gold-plated links for a subtle pop of colour. Works beautifully with ethnic and indo-western looks. Wipe gently.', images: pImgs('a12', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Emerald Green Stone Anklet', category: 'Anklets', material: 'Antique Gold Plated Copper', price: 649, description: 'Small emerald-toned stones set into antique gold links along the anklet. Festive and refined for sarees and bridal looks. Avoid water and direct sunlight.', images: pImgs('a13', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Antique Gold', price: 649, images: vImgs('a13', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',         price: 629, images: vImgs('a13', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',       price: 599, images: vImgs('a13', 3), isDefault: false, inStock: false, demandCount: 9 },
    ] },
  { name: 'Floral Bridal Anklet Pair', category: 'Anklets', material: 'Kundan with Gold Plated Base', price: 999, description: 'A pair of bridal anklets with kundan floral motifs and small ghungroo bells along the lower edge. Built for wedding events and traditional photography. Store carefully.', images: pImgs('a14', 2), inStock: false, featured: false, demandCount: 18 },
  { name: 'Minimal Gold Bar Anklet', category: 'Anklets', material: 'Gold Plated Brass', price: 399, description: 'A small polished gold bar suspended on a thin ankle chain. Minimal for daily and office wear, layers beautifully with other anklets. Tarnish-free finish.', images: pImgs('a15', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Boho Layered Tassel Anklet', category: 'Anklets', material: 'Oxidised German Silver', price: 599, description: 'Layered oxidised chains with small tassel drops along the lower length. Boho-festival ready for outdoor parties and weekend travel. Wipe gently.', images: pImgs('a16', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Star Charm Anklet', category: 'Anklets', material: 'Rose Gold Plated Brass', price: 449, description: 'Tiny rose gold star charms scattered along a delicate chain at varied intervals. Sweet and feminine for daily wear, weekends, and gifting. Tarnish-resistant.', images: pImgs('a17', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 449, images: vImgs('a17', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 449, images: vImgs('a17', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 429, images: vImgs('a17', 3), isDefault: false, inStock: false, demandCount: 3 },
    ] },
  { name: 'Pearl Cluster Anklet', category: 'Anklets', material: 'Gold Plated Brass', price: 549, description: 'A small cluster of freshwater pearls at the centre of a fine chain. Refined evening wear for special dinners and intimate events. Pearl-safe coating.', images: pImgs('a18', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Mirror Work Anklet', category: 'Anklets', material: 'Oxidised German Silver', price: 649, description: 'Small mirror inlays joined by oxidised silver chain for a cultural touch. Beautiful for sarees and lehengas at festive occasions. Wipe gently — avoid soaking.', images: pImgs('a19', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Gold Coin Anklet', category: 'Anklets', material: 'Antique Gold Plated Copper', price: 579, description: 'A row of antique coins along a fine chain ending in small bells. Traditional festive piece for ethnic wear and South Indian styling. Avoid water exposure.', images: pImgs('a20', 2), inStock: false, featured: false, demandCount: 23 },

  /* ── BANGLES (20) ───────────────────────────────────────────────── */
  { name: 'Meenakari Floral Bangle Set', category: 'Bangles', material: 'Gold Plated Brass', price: 1349, description: 'A set of three bangles with hand-painted meenakari floral motifs in vibrant jewel tones. Festive favourite for sarees and lehengas during weddings and pujas. Keep enamel away from perfume.', images: pImgs('bg1', 3), inStock: true, featured: true, demandCount: 0 },
  { name: 'Kundan Pearl Bridal Bangles', category: 'Bangles', material: 'Kundan with Gold Plated Base', price: 1499, description: 'A pair of bridal bangles with kundan stones and pearl detailing along the surface. Made for wedding and bridal moments with rich hand-set work. Store flat — avoid moisture.', images: pImgs('bg2', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 1499, images: vImgs('bg2', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 1549, images: vImgs('bg2', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Matt Gold',    price: 1499, images: vImgs('bg2', 3), isDefault: false, inStock: false, demandCount: 10 },
    ] },
  { name: 'Antique Gold Engraved Bangle', category: 'Bangles', material: 'Antique Gold Plated Copper', price: 949, description: 'A wide structured bangle with hand-engraved Mughal-style motifs across its surface. Traditional statement for ethnic wear and bridal looks. Avoid water for lasting finish.', images: pImgs('bg3', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Oxidised Silver Tribal Kada', category: 'Bangles', material: 'Oxidised German Silver', price: 799, description: 'Wide oxidised silver kada with bold tribal engravings along its band. Bohemian style for festivals, indo-western looks, and weekend wear. Wipe gently.', images: pImgs('bg4', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Rose Gold Stackable Bangles', category: 'Bangles', material: 'Rose Gold Plated Brass', price: 599, description: 'A set of three slim rose gold bangles designed to stack together as a single piece. Versatile across daily and festive wear with effortless layering. Tarnish-resistant.', images: pImgs('bg5', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 599, images: vImgs('bg5', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 579, images: vImgs('bg5', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 549, images: vImgs('bg5', 3), isDefault: false, inStock: false, demandCount: 6 },
    ] },
  { name: 'Polki Statement Bangle', category: 'Bangles', material: 'Antique Gold Plated Copper', price: 1199, description: 'A wide bangle studded with polki stones in an antique gold setting. Built for bridal and grand occasions with regal craft. Hand-detailed — avoid water.', images: pImgs('bg6', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Two-Tone Twist Bangle', category: 'Bangles', material: 'Two-tone Gold-Silver Plated Brass', price: 749, description: 'Gold and silver strands twisting around a slim bangle for visual richness. Versatile match for any metal tone in your existing collection. Wipe clean — do not soak.', images: pImgs('bg7', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Crystal Halo Bangle', category: 'Bangles', material: 'Rose Gold Plated Brass', price: 899, description: 'A row of crystal stones set continuously around a thin rose gold bangle. Glamorous for receptions, evenings, and cocktail dressing. Avoid water and lotion.', images: pImgs('bg8', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 899, images: vImgs('bg8', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 899, images: vImgs('bg8', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 849, images: vImgs('bg8', 3), isDefault: false, inStock: false, demandCount: 2 },
    ] },
  { name: 'Floral Mirror Work Bangle Set', category: 'Bangles', material: 'Oxidised German Silver', price: 899, description: 'A set of two oxidised bangles inlaid with small mirrors and floral patterns. Festive cultural statement for sarees and traditional wear. Wipe gently to maintain finish.', images: pImgs('bg9', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Emerald Stone Bangle Pair', category: 'Bangles', material: 'Antique Gold Plated Copper', price: 1099, description: 'A pair of bangles studded with emerald-toned cabochon stones around the band. Refined for festive and bridal looks with rich colour. Hand-set stones — avoid water.', images: pImgs('bg10', 2), inStock: false, featured: false, demandCount: 14 },
  { name: 'Ruby Studded Bridal Kada', category: 'Bangles', material: 'Kundan with Gold Plated Base', price: 1499, description: 'A wide bridal kada with rows of ruby-toned stones and pearl accents along the edge. For bridal sangeet and reception moments. Store flat — avoid moisture.', images: pImgs('bg11', 2), inStock: false, featured: false, demandCount: 20 },
  { name: 'Turquoise Boho Bangle Set', category: 'Bangles', material: 'Oxidised German Silver', price: 749, description: 'A set of two oxidised bangles with turquoise stone accents at intervals. Boho-festival ready for vacations, outdoor parties, and casual ethnic styling. Handle stones gently.', images: pImgs('bg12', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Filigree Lotus Bangle', category: 'Bangles', material: '925 Sterling Silver', price: 1149, description: 'A slim sterling silver bangle with hand-cut filigree lotus motifs. Refined for office and ethnic wear with a craft-feel. Polish gently with a silver cloth.', images: pImgs('bg13', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Silver',          price: 1149, images: vImgs('bg13', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Oxidised Silver', price: 1199, images: vImgs('bg13', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',       price: 1249, images: vImgs('bg13', 3), isDefault: false, inStock: false, demandCount: 11 },
    ] },
  { name: 'Coral Floral Bangle', category: 'Bangles', material: 'Rose Gold Plated Brass', price: 699, description: 'A rose gold bangle with hand-painted coral-pink floral motifs along the band. Romantic for spring and brunch wear with feminine detail. Tarnish-resistant plating.', images: pImgs('bg14', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Pearl Strand Bangle', category: 'Bangles', material: 'Gold Plated Brass', price: 899, description: 'Multiple strands of small freshwater pearls joined by a delicate gold clasp. Elegant for daily and evening wear with a refined touch. Pearl-safe finish.', images: pImgs('bg15', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Hammered Silver Open Kada', category: 'Bangles', material: 'Oxidised German Silver', price: 849, description: 'A wide hammered-texture oxidised silver kada with an adjustable open back. Handcrafted artisan look for office, ethnic, and indo-western styling. Wipe with a dry cloth.', images: pImgs('bg16', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Oxidised Silver', price: 849, images: vImgs('bg16', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Silver',          price: 879, images: vImgs('bg16', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Antique Gold',    price: 929, images: vImgs('bg16', 3), isDefault: false, inStock: false, demandCount: 7 },
    ] },
  { name: 'Sapphire Blue Bangle Pair', category: 'Bangles', material: 'Antique Gold Plated Copper', price: 1199, description: 'A pair of bangles studded with sapphire-toned stones in antique gold setting. Designed for evenings and receptions with rich blue accents. Hand-detailed — avoid water.', images: pImgs('bg17', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Mughal Antique Kada', category: 'Bangles', material: 'Antique Gold Plated Copper', price: 1299, description: 'Wide kada with intricate Mughal-style engravings and small drops along the lower edge. Bridal-grade traditional piece for wedding ceremonies. Avoid water exposure.', images: pImgs('bg18', 2), inStock: false, featured: false, demandCount: 25 },
  { name: 'Onyx Black Statement Bangle', category: 'Bangles', material: 'Gold Plated Brass', price: 849, description: 'A wide bangle inlaid with smooth black onyx stones in a polished gold setting. Bold modern statement for parties and evening cocktail wear. Avoid chemicals.', images: pImgs('bg19', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Ghungroo Floral Bangle Set', category: 'Bangles', material: 'Gold Plated Brass', price: 1049, description: 'A set of slim bangles with floral details and tiny ghungroo bells along the edge. Festive favourite with a gentle jingle for celebrations. Wipe gently.', images: pImgs('bg20', 2), inStock: true, featured: false, demandCount: 0 },

  /* ── PENDANTS (25) ──────────────────────────────────────────────── */
  { name: 'Temple Gold Lakshmi Pendant', category: 'Pendants', material: 'Antique Gold Plated Copper', price: 999, description: 'A devotional Lakshmi motif pendant in antique gold with delicate detailing. Beautiful for festivals, pujas, and traditional ceremonies. Avoid water and oils for lasting finish.', images: pImgs('p1', 3), inStock: true, featured: true, demandCount: 0 },
  { name: 'Rose Gold Heart Pendant', category: 'Pendants', material: 'Rose Gold Plated Brass', price: 449, description: 'A small open-heart pendant on a delicate fine chain. Sweet for daily wear and gifting on anniversaries and birthdays. Tarnish-resistant plating.', images: pImgs('p2', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Oxidised Silver Tribal Pendant', category: 'Pendants', material: 'Oxidised German Silver', price: 649, description: 'Bold oxidised silver pendant with hand-engraved tribal motifs along its surface. Beautiful for handloom kurtas and indo-western styling. Wipe gently to preserve finish.', images: pImgs('p3', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Oxidised Silver', price: 649, images: vImgs('p3', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Silver',          price: 679, images: vImgs('p3', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Antique Gold',    price: 749, images: vImgs('p3', 3), isDefault: false, inStock: false, demandCount: 5 },
    ] },
  { name: 'Kundan Floral Pendant', category: 'Pendants', material: 'Kundan with Gold Plated Base', price: 1149, description: 'A delicate floral kundan pendant on a fine gold chain. Festive elegance for sarees, lehengas, and traditional ceremonies. Store carefully to protect the stones.', images: pImgs('p4', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Meenakari Peacock Pendant', category: 'Pendants', material: 'Gold Plated Brass', price: 899, description: 'Hand-painted meenakari peacock motif on a polished gold pendant. Vibrant statement for festive ethnic wear and special occasions. Keep enamel dry — away from perfume.', images: pImgs('p5', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Polki Statement Pendant', category: 'Pendants', material: 'Antique Gold Plated Copper', price: 1249, description: 'A bold polki-studded statement pendant in antique gold setting. Made for bridal and grand evenings with regal craft. Hand-detailed — avoid water.', images: pImgs('p6', 2), inStock: false, featured: false, demandCount: 18 },
  { name: 'Filigree Silver Lotus Pendant', category: 'Pendants', material: '925 Sterling Silver', price: 799, description: 'A delicate silver lotus pendant with hand-cut filigree work along its surface. Refined for office, ethnic occasions, and minimal styling. Polish gently with a silver cloth.', images: pImgs('p7', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Two-Tone Geometric Pendant', category: 'Pendants', material: 'Two-tone Gold-Silver Plated Brass', price: 599, description: 'A small geometric pendant alternating between gold and silver finishes. Modern minimal piece for daily wear and weekend layering. Wipe clean with a dry cloth.', images: pImgs('p8', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Two-tone',  price: 599, images: vImgs('p8', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 579, images: vImgs('p8', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold', price: 599, images: vImgs('p8', 3), isDefault: false, inStock: false, demandCount: 3 },
    ] },
  { name: 'Crystal Halo Drop Pendant', category: 'Pendants', material: 'Rose Gold Plated Brass', price: 699, description: 'A crystal teardrop framed by a halo of small stones in rose gold tone. Glamorous for receptions, anniversaries, and date nights. Avoid water and lotion.', images: pImgs('p9', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Emerald Green Stone Pendant', category: 'Pendants', material: 'Antique Gold Plated Copper', price: 849, description: 'A single emerald-toned stone in a textured antique gold setting. Suits sarees, Indo-western looks, and festive evenings. Avoid water and direct sunlight.', images: pImgs('p10', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Pearl Cluster Pendant', category: 'Pendants', material: 'Gold Plated Brass', price: 599, description: 'A cluster of small freshwater pearls forming a flower-like pendant. Elegant for brunches, evenings, and intimate dinners. Pearl-safe finish.', images: pImgs('p11', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Sapphire Blue Drop Pendant', category: 'Pendants', material: 'Gold Plated Brass', price: 699, description: 'A sapphire-toned drop suspended from a small gold accent on a fine chain. Designed for evening wear with cocktail dresses. Hand-set stone — avoid water.', images: pImgs('p12', 2), inStock: false, featured: false, demandCount: 9 },
  { name: 'Ruby Red Heart Pendant', category: 'Pendants', material: 'Gold Plated Brass', price: 549, description: 'A ruby-toned heart-shaped pendant on a fine gold chain. Romantic for gifting and daily wear with subtle colour. Tarnish-free brass coating.', images: pImgs('p13', 2), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Gold',      price: 549, images: vImgs('p13', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Rose Gold', price: 579, images: vImgs('p13', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 529, images: vImgs('p13', 3), isDefault: false, inStock: false, demandCount: 8 },
    ] },
  { name: 'Onyx Black Cross Pendant', category: 'Pendants', material: 'Gold Plated Brass', price: 599, description: 'A small polished black onyx cross suspended on a fine gold chain. Modern stylish statement for daily wear and indo-western looks. Avoid harsh chemicals.', images: pImgs('p14', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Turquoise Tribal Pendant', category: 'Pendants', material: 'Oxidised German Silver', price: 599, description: 'A raw turquoise stone set in an oxidised silver tribal frame. Boho-perfect for travel, festivals, and outdoor casual styling. Hand-set stone — handle gently.', images: pImgs('p15', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Coral Floral Pendant', category: 'Pendants', material: 'Rose Gold Plated Brass', price: 499, description: 'A delicate coral-pink enamel flower on a rose gold pendant. Romantic for spring and summer dressing with a feminine accent. Keep enamel dry.', images: pImgs('p16', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Mirror Work Pendant', category: 'Pendants', material: 'Oxidised German Silver', price: 549, description: 'A small mirror inlay set into an oxidised silver geometric pendant. Cultural statement for festive wear, sarees, and lehengas. Wipe gently to preserve mirror finish.', images: pImgs('p17', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Hammered Silver Disc Pendant', category: 'Pendants', material: '925 Sterling Silver', price: 699, description: 'A wide hammered-textured silver disc on a fine chain. Handcrafted artisan look for daily wear and indo-western styling. Polish gently to maintain shine.', images: pImgs('p18', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Gold Coin Pendant', category: 'Pendants', material: 'Antique Gold Plated Copper', price: 749, description: 'A small antique gold coin pendant with traditional motifs. Festive and traditional for ethnic wear and South Indian styling. Avoid water exposure.', images: pImgs('p19', 2), inStock: false, featured: false, demandCount: 15 },
  { name: 'Moonstone Solitaire Pendant', category: 'Pendants', material: '925 Sterling Silver', price: 899, description: 'A milky moonstone solitaire in a fine silver setting on a delicate chain. Quiet and mystical for daily wear and minimal styling. Polish gently to keep the soft lustre.', images: pImgs('p20', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Vintage Victorian Pendant', category: 'Pendants', material: 'Antique Gold Plated Copper', price: 999, description: 'An ornate Victorian-style pendant with small crystal accents and filigree detail. Heirloom-feel for evenings, anniversaries, and grand events. Hand-detailed — avoid moisture.', images: pImgs('p21', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Antique Gold', price: 999, images: vImgs('p21', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',         price: 979, images: vImgs('p21', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 1029, images: vImgs('p21', 3), isDefault: false, inStock: false, demandCount: 12 },
    ] },
  { name: 'Tri-Color Star Pendant', category: 'Pendants', material: 'Tri-color Gold-Silver-Rose Plated Brass', price: 699, description: 'A small star pendant alternating between three metal tones. Versatile across any outfit and any other jewellery in your stack. Tarnish-resistant plating.', images: pImgs('p22', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Dainty Initial Pendant', category: 'Pendants', material: 'Gold Plated Brass', price: 399, description: 'A simple delicate initial pendant on a fine gold chain. Personal touch for daily wear, gifting, and weekend casual looks. Tarnish-free brass.', images: pImgs('p23', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Ghungroo Drop Pendant', category: 'Pendants', material: 'Oxidised German Silver', price: 549, description: 'Small ghungroo bells clustered at the base of an oxidised silver pendant. Festive jingle for ethnic looks and indo-western wear. Wipe gently with a soft cloth.', images: pImgs('p24', 2), inStock: false, featured: false, demandCount: 21 },
  { name: 'Lotus Filigree Pendant', category: 'Pendants', material: '925 Sterling Silver', price: 849, description: 'A delicate lotus pendant with hand-cut silver filigree work along its surface. Refined for sarees, ethnic occasions, and special evenings. Polish gently to maintain shine.', images: pImgs('p25', 2), inStock: true, featured: false, demandCount: 0 },

  /* ── SETS (20) ──────────────────────────────────────────────────── */
  { name: 'Kundan Pearl Bridal Set', category: 'Sets', material: 'Kundan with Gold Plated Base', price: 3499, description: 'A complete bridal set with necklace, earrings, and maang tikka in kundan and pearl detailing. Made for wedding ceremonies and grand cultural functions. Store flat — avoid moisture.', images: pImgs('s1', 3), inStock: true, featured: true, demandCount: 0,
    variants: [
      { color: 'Gold',         price: 3499, images: vImgs('s1', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Antique Gold', price: 3599, images: vImgs('s1', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Rose Gold',    price: 3599, images: vImgs('s1', 3), isDefault: false, inStock: false, demandCount: 15 },
    ] },
  { name: 'Oxidised Silver Temple Set', category: 'Sets', material: 'Oxidised German Silver', price: 1599, description: 'A coordinated necklace and earring set with temple motifs in oxidised silver. Traditional statement for sarees, festive wear, and South Indian styling. Wipe gently.', images: pImgs('s2', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Rose Gold Minimal Bridal Set', category: 'Sets', material: 'Rose Gold Plated Brass', price: 2299, description: 'A delicate two-piece set with a fine necklace and matching drop earrings in rose gold. Modern bridal alternative for intimate weddings and engagement photos. Tarnish-resistant plating.', images: pImgs('s3', 3), inStock: true, featured: false, demandCount: 0 },
  { name: 'Meenakari Peacock Set', category: 'Sets', material: 'Gold Plated Brass', price: 2199, description: 'Necklace, earrings, and pendant brought together in hand-painted meenakari peacock motifs. Festive grandeur for sarees and lehengas at celebrations. Keep enamel dry.', images: pImgs('s4', 3), inStock: true, featured: true, demandCount: 0 },
  { name: 'Antique Polki Bridal Set', category: 'Sets', material: 'Antique Gold Plated Copper', price: 3299, description: 'A regal three-piece bridal set with polki stones in antique gold detailing throughout. Built for wedding receptions and bridal ceremonies. Hand-finished — avoid water.', images: pImgs('s5', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Floral Jadau Wedding Set', category: 'Sets', material: 'Kundan with Gold Plated Base', price: 3699, description: 'Necklace and earring set with jadau floral work and pearl accents along the layout. Heirloom-grade bridal piece for grand wedding functions. Store flat.', images: pImgs('s6', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Two-Tone Statement Set', category: 'Sets', material: 'Two-tone Gold-Silver Plated Brass', price: 1349, description: 'A coordinated necklace and earring set alternating between gold and silver tones. Versatile for any metal-tone outfit or styling. Wipe clean with a dry cloth.', images: pImgs('s7', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Crystal Halo Bridal Set', category: 'Sets', material: 'Rose Gold Plated Brass', price: 2799, description: 'A necklace, earring, and bangle set with crystal halo detailing in rose gold tone. Glamorous for receptions, sangeet, and engagement photos. Avoid water and lotion.', images: pImgs('s8', 3), inStock: true, featured: false, demandCount: 0,
    variants: [
      { color: 'Rose Gold', price: 2799, images: vImgs('s8', 1), isDefault: true,  inStock: true,  demandCount: 0 },
      { color: 'Gold',      price: 2799, images: vImgs('s8', 2), isDefault: false, inStock: true,  demandCount: 0 },
      { color: 'Silver',    price: 2699, images: vImgs('s8', 3), isDefault: false, inStock: false, demandCount: 9 },
    ] },
  { name: 'Emerald Green Stone Set', category: 'Sets', material: 'Antique Gold Plated Copper', price: 2499, description: 'Necklace and earring set with emerald-toned cabochon stones in antique gold setting. Festive elegance for weddings and grand occasions. Hand-set stones — avoid water.', images: pImgs('s9', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Pearl Layered Bridal Set', category: 'Sets', material: 'Gold Plated Brass', price: 1899, description: 'Layered pearl necklace and matching earrings in gold-plated detailing. Refined bridal alternative for receptions and modern weddings. Pearl-safe finish.', images: pImgs('s10', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Sapphire Blue Reception Set', category: 'Sets', material: 'Antique Gold Plated Copper', price: 2399, description: 'Necklace and earrings with sapphire-toned stones in antique gold setting. Built for receptions and sangeet evenings with bold colour. Avoid water and lotion.', images: pImgs('s11', 2), inStock: false, featured: false, demandCount: 22 },
  { name: 'Ruby Red Wedding Set', category: 'Sets', material: 'Kundan with Gold Plated Base', price: 3199, description: 'A bridal set with ruby-toned stones, pearls, and kundan detailing throughout the layout. For wedding ceremonies and grand traditional functions. Store flat.', images: pImgs('s12', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Onyx Black Statement Set', category: 'Sets', material: 'Gold Plated Brass', price: 1599, description: 'A bold statement necklace and earring set with smooth black onyx accents. Modern Indo-western styling for parties and evening cocktail wear. Avoid chemicals.', images: pImgs('s13', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Turquoise Tribal Set', category: 'Sets', material: 'Oxidised German Silver', price: 1199, description: 'Coordinated tribal necklace and earrings with turquoise stone accents in oxidised silver. Boho-festival ready for outdoor parties and travel. Handle stones gently.', images: pImgs('s14', 2), inStock: false, featured: false, demandCount: 12 },
  { name: 'Coral Pink Floral Set', category: 'Sets', material: 'Rose Gold Plated Brass', price: 1499, description: 'Necklace and earring set with hand-painted coral floral motifs in rose gold. Romantic for spring and summer weddings with feminine detail. Keep enamel dry.', images: pImgs('s15', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Mirror Work Bridal Set', category: 'Sets', material: 'Oxidised German Silver', price: 1999, description: 'Bridal set with extensive mirror work inlays in oxidised silver. Cultural statement for traditional Rajasthani and Gujarati weddings. Wipe gently — avoid soaking.', images: pImgs('s16', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Antique Gold Wedding Set', category: 'Sets', material: 'Antique Gold Plated Copper', price: 2799, description: 'A traditional wedding set with engraved antique gold and small bell drops along the necklace. Built for bridal grandeur and ceremonial photography. Avoid water.', images: pImgs('s17', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Moonstone Bridal Set', category: 'Sets', material: '925 Sterling Silver', price: 2599, description: 'A modern minimal bridal set with milky moonstones in fine silver settings. Quiet luxury for intimate ceremonies and engagement events. Polish gently with a silver cloth.', images: pImgs('s18', 2), inStock: true, featured: false, demandCount: 0 },
  { name: 'Vintage Victorian Set', category: 'Sets', material: 'Antique Gold Plated Copper', price: 2399, description: 'A vintage three-piece set with ornate Victorian detailing in antique gold. Heirloom feel for grand events, receptions, and special anniversaries. Hand-detailed — avoid moisture.', images: pImgs('s19', 2), inStock: false, featured: false, demandCount: 17 },
  { name: 'Ghungroo Statement Set', category: 'Sets', material: 'Gold Plated Brass', price: 1799, description: 'A necklace, earring, and bracelet set with ghungroo bell accents throughout the layout. Festive jingle for celebrations, pujas, and sangeet evenings. Wipe gently.', images: pImgs('s20', 2), inStock: true, featured: false, demandCount: 0 },
];

const args = process.argv.slice(2);
const clearOnly = args.includes('--clear');

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in env. Aborting.');
    process.exit(1);
  }
  if (process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    console.error('❌ MONGODB_URI uses srv:// — known Windows DNS bug. Use the direct shard URI.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Connected to MongoDB');

    console.log('🗑️  Clearing existing data...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Setting.deleteMany({});

    if (clearOnly) {
      console.log('✅ Cleared. Skipping seed (--clear mode).');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`📦 Creating ${CATEGORIES.length} categories...`);
    await Category.insertMany(CATEGORIES);

    console.log(`💍 Seeding ${PRODUCTS.length} products...`);
    let created = 0;
    for (const p of PRODUCTS) {
      const productCode = await generateProductCode(p.category);
      await Product.create({ ...p, productCode });
      created++;
      process.stdout.write(`\r  Inserting products... ${created}/${PRODUCTS.length}`);
    }
    process.stdout.write('\n');

    // Upsert default settings. `findOneAndUpdate` skips validators by default,
    // so the empty whatsapp_number value writes cleanly even though the schema
    // marks `value` as required (intentional — admins fill it in via Settings).
    console.log(`⚙️  Upserting ${DEFAULT_SETTINGS.length} default settings...`);
    for (const s of DEFAULT_SETTINGS) {
      await Setting.findOneAndUpdate(
        { key: s.key },
        { $set: { key: s.key, value: s.value } },
        { upsert: true, new: true }
      );
    }

    const variantCount  = PRODUCTS.filter((p) => Array.isArray(p.variants) && p.variants.length > 0).length;
    const featuredCount = PRODUCTS.filter((p) => p.featured).length;
    const oosCount      = PRODUCTS.filter((p) => !p.inStock).length;

    console.log(`✅ Done. Seeded ${created} products across ${CATEGORIES.length} categories.`);
    console.log(`   Variants: ${variantCount}, Featured: ${featuredCount}, OOS: ${oosCount}, Settings: ${DEFAULT_SETTINGS.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    try { await mongoose.disconnect(); } catch { /* ignore */ }
    process.exit(1);
  }
};

run();
