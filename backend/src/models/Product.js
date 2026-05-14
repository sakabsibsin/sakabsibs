import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  color:       { type: String, required: true },
  price:       { type: Number, required: true },
  images:      [{ type: String }],
  isDefault:   { type: Boolean, default: false },
  inStock:     { type: Boolean, default: true },
  demandCount: { type: Number, default: 0 },
});

variantSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true },
    images:      [String],
    material:    { type: String, default: '' },
    category:    { type: String, required: true },
    productCode: { type: String, unique: true },
    inStock:     { type: Boolean, default: true },
    featured:    { type: Boolean, default: false },
    demandCount: { type: Number, default: 0 },
    variants:    [variantSchema],
  },
  { timestamps: true }
);

productSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Product = mongoose.model('Product', productSchema);
