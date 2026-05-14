import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { ImageUpload } from './ImageUpload';
import { Breadcrumb } from './Breadcrumb';
import { useCreateProduct, useUpdateProduct, useProduct } from '@/features/products/hooks';
import { useCategories } from '@/features/categories/hooks';
import { API_URL } from '@/constants/config';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number({ invalid_type_error: 'Enter a valid price' }).min(1, 'Price is required'),
  material: z.string().optional().default(''),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  images: z.array(z.any()).optional().default([]),
  variants: z.array(z.object({
    color:   z.string().min(1, 'Color is required'),
    price:   z.coerce.number().min(0),
    images:  z.array(z.any()).optional().default([]),
    isDefault: z.boolean().default(false),
    inStock: z.boolean().default(true),
  })).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.variants.length === 0 && data.images.length === 0) {
    ctx.addIssue({
      path: ['images'],
      code: z.ZodIssueCode.custom,
      message: 'At least one image is required when no variants are added',
    });
  }
});

const inputCls = 'flex h-11 w-full border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:opacity-50';
const labelCls = 'block uppercase tracking-widest text-xs mb-1.5 text-foreground';

/* ── Variant modal ────────────────────────────────── */
const variantSchema = z.object({
  color:   z.string().min(1, 'Color name is required'),
  price:   z.coerce.number({ invalid_type_error: 'Enter a valid price' }).min(1, 'Price is required'),
  images:  z.array(z.any()).min(1, 'At least one photo is required'),
  inStock: z.boolean().default(true),
});

const EMPTY_DRAFT = { color: '', price: '', images: [], isDefault: false, inStock: true };

const VariantModal = ({ open, onClose, initialData, onSave }) => {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setDraft(initialData ?? EMPTY_DRAFT);
      setErrors({});
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSave = () => {
    const parsed = { ...draft, price: Number(draft.price) || 0 };
    const result = variantSchema.safeParse(parsed);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((e) => { fieldErrors[e.path[0]] = e.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSave({ ...parsed, isDefault: draft.isDefault });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-background border border-border w-full max-w-sm p-6 space-y-5 shadow-xl">
        <h2 className="font-serif text-lg font-light">
          {initialData ? 'Edit Variant' : 'Add Variant'}
        </h2>

        {/* Color */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">
            Color Name
          </label>
          <input
            className={inputCls}
            placeholder="e.g. Gold, Silver, Rose Gold"
            value={draft.color}
            onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
          />
          {errors.color && <p className="text-xs text-destructive mt-1">{errors.color}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">
            Price (₹)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            placeholder="0.00"
            className={inputCls}
            value={draft.price}
            onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
          />
          {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
        </div>

        {/* Photos */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">
            Photos
          </label>
          <ImageUpload
            images={draft.images}
            onChange={(imgs) => setDraft((d) => ({ ...d, images: imgs }))}
          />
          {errors.images && <p className="text-xs text-destructive mt-1">{errors.images}</p>}
        </div>

        {/* Set as default */}
        <div className="flex items-start gap-3 pt-1">
          <Switch
            checked={draft.isDefault}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, isDefault: v }))}
          />
          <div>
            <p className="text-sm leading-tight">Set as default variant</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-light">
              This variant will be shown first in the shop
            </p>
          </div>
        </div>

        {/* In Stock */}
        <div className="flex items-start gap-3 pt-1">
          <Switch
            checked={draft.inStock !== false}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, inStock: v }))}
          />
          <div>
            <p className="text-sm leading-tight">In Stock</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-light">
              Turn off if this colour / style is sold out
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-10 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors"
          >
            Save Variant
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-border text-xs uppercase tracking-widest font-light hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Form ─────────────────────────────────────────── */
export const ProductForm = ({ productId }) => {
  const navigate = useNavigate();
  const isEditing = !!productId;
  const { data: product, isLoading } = useProduct(productId);
  const { data: categories = [] } = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const uploadFiles = async (items) => {
    const results = await Promise.all(
      items.map(async (item) => {
        if (typeof item === 'string') return item;
        const form = new FormData();
        form.append('image', item);
        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: form,
          credentials: 'include',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Upload failed for "${item.name}"`);
        }
        const { data } = await res.json();
        return data.url;
      })
    );
    return results;
  };

  const { register, handleSubmit, setValue, watch, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', description: '', price: '', material: '',
      category: '', images: [], inStock: true, featured: false, variants: [],
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        material: product.material ?? '',
        category: product.category,
        images: product.images,
        inStock: product.inStock,
        featured: product.featured,
        variants: product.variants ?? [],
      });
    }
  }, [product, reset]);

  const images = watch('images');
  const inStock = watch('inStock');
  const featured = watch('featured');
  const category = watch('category');
  const allVariants = watch('variants');

  const { fields: variantFields, append: appendVariant, remove: removeVariant, update: updateVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  const openAddModal = () => { setEditingIndex(null); setModalOpen(true); };
  const openEditModal = (index) => { setEditingIndex(index); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingIndex(null); };

  const handleSaveVariant = (draft) => {
    const current = allVariants ?? [];
    // Enforce single default: clear isDefault on all other variants first
    if (draft.isDefault) {
      current.forEach((v, i) => {
        if (i !== editingIndex) {
          updateVariant(i, { ...v, isDefault: false });
        }
      });
    }
    if (editingIndex !== null) {
      updateVariant(editingIndex, draft);
    } else {
      appendVariant(draft);
    }
    closeModal();
  };

  const onSubmit = async (values) => {
    try {
      // Step 1 — upload any new local File objects
      setUploadingImages(true);
      let uploadedImages = values.images;
      try {
        uploadedImages = await uploadFiles(values.images);
      } catch (err) {
        toast.error(err.message || 'One or more images failed to upload. Please try again.');
        return;
      } finally {
        setUploadingImages(false);
      }

      // Step 2 — save product with final Cloudinary URLs
      const payload = { ...values, images: uploadedImages };

      if (payload.variants?.length) {
        payload.variants = await Promise.all(
          payload.variants.map(async (variant) => ({
            ...variant,
            images: await uploadFiles(variant.images ?? []),
          }))
        );
      }

      if (isEditing) {
        await update.mutateAsync({ id: productId, body: payload });
        toast.success('Changes saved successfully.');
      } else {
        await create.mutateAsync(payload);
        toast.success('Product added to catalog.');
      }
      navigate('/admin/products');
    } catch {
      toast.error(isEditing ? 'Failed to update product.' : 'Failed to create product. Please try again.');
    }
  };

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-serif">Loading product details...</div>;
  }

  const isPending = create.isPending || update.isPending;

  return (
    <div className="max-w-3xl space-y-8">
      <Breadcrumb items={[
        { label: 'Dashboard', to: '/admin/dashboard' },
        { label: 'Products', to: '/admin/products' },
        { label: isEditing ? 'Edit Product' : 'Add Product' },
      ]} />

      <div className="flex items-center gap-4">
        <Link
          to="/admin/dashboard"
          className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-serif tracking-wide">{isEditing ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-muted-foreground text-sm">{isEditing ? 'Update product details.' : 'Add a new piece to your catalog.'}</p>
        </div>
      </div>

      {isEditing && product && (
        <div className="flex items-center gap-3 text-xs border border-border px-4 py-2.5 bg-muted/30">
          <span className="text-muted-foreground uppercase tracking-widest">Product Code</span>
          <span className="font-mono font-semibold text-foreground text-sm">{product.productCode}</span>
        </div>
      )}

      <div className="bg-card p-6 md:p-7 border border-border">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* Name + Base Price */}
          <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-4">Basic Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Product Name</label>
              <input className={inputCls} placeholder="e.g. Silver Cuff Bracelet" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Base Price (₹){' '}
                <span className="text-muted-foreground/50 normal-case tracking-normal">— used if no variants</span>
              </label>
              <input type="number" step="1" min="0" placeholder="0.00" className={inputCls} {...register('price')} />
              {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
            </div>
          </div>

          </div>

          <hr className="border-border/40" />

          {/* Category + Material */}
          <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-4">Organisation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Category</label>
              {categories.length === 0 ? (
                <div className="border border-dashed border-border p-3 text-sm text-muted-foreground text-center">
                  No categories. <Link to="/admin/categories" className="underline">Create one first.</Link>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setValue('category', e.target.value, { shouldValidate: true })}
                  className={inputCls}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              )}
              {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Material <span className="text-muted-foreground/50 normal-case tracking-normal">(optional)</span>
              </label>
              <input className={inputCls} placeholder="e.g. Sterling Silver, Gold Plated" {...register('material')} />
            </div>
          </div>

          </div>

          <hr className="border-border/40" />

          {/* Description */}
          <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-4">Description</p>
            <label className={labelCls}>Description</label>
            <textarea
              rows={4}
              placeholder="Describe the product..."
              className={`${inputCls} h-auto py-2 resize-none`}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <hr className="border-border/40" />

          {/* Images — hidden when variants exist (variant images take over) */}
          <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-4">Media</p>
            <label className={labelCls}>Images</label>
            {allVariants.length > 0 ? (
              <p className="text-xs text-muted-foreground/55 border border-dashed border-border/50 px-4 py-4 text-center">
                Product images are taken from the default variant when variants are added.
              </p>
            ) : (
              <>
                <ImageUpload
                  images={images}
                  onChange={(imgs) => setValue('images', imgs, { shouldValidate: true })}
                />
                {errors.images && <p className="text-xs text-destructive mt-1">{errors.images.message}</p>}
              </>
            )}
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls}>
                Variants <span className="text-muted-foreground/50 normal-case tracking-normal">(optional)</span>
              </label>
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 h-8 px-3 border border-border text-xs hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variant
              </button>
            </div>

            {variantFields.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 border border-dashed border-border/50 px-4 py-5 text-center">
                No variants added. Click "Add Variant" to add color options with different prices and photos.
              </p>
            ) : (
              <div className="space-y-2">
                {variantFields.map((field, index) => (
                  <div key={field.id} className="flex items-center justify-between px-3 py-2.5 border border-border/50 bg-muted/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">
                        {allVariants?.[index]?.color || <span className="text-muted-foreground/40 italic text-xs">Unnamed</span>}
                      </span>
                      {allVariants?.[index]?.isDefault && (
                        <span className="text-[8px] tracking-[0.1em] uppercase font-medium text-primary/65 border border-primary/22 px-1.5 py-px leading-none">
                          Default
                        </span>
                      )}
                      {allVariants?.[index]?.inStock === false ? (
                        <span className="text-[8px] tracking-[0.1em] uppercase font-medium text-red-500/70 border border-red-200 px-1.5 py-px leading-none">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-[8px] tracking-[0.1em] uppercase font-medium text-green-700/60 border border-green-200 px-1.5 py-px leading-none">
                          In Stock
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(index)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground/35 hover:text-foreground transition-colors"
                        title="Edit variant"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground/35 hover:text-destructive transition-colors"
                        title="Remove variant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-border/40" />

          {/* Toggles */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-4">Availability</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">In Stock</p>
                  <p className="text-xs text-muted-foreground">
                    {allVariants.length > 0
                      ? 'Master switch — turn off to take the whole product offline'
                      : 'Product is available to order'}
                  </p>
                </div>
                <Switch checked={inStock} onCheckedChange={(v) => setValue('inStock', v)} />
              </div>
              <div className="flex items-center justify-between border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-xs text-muted-foreground">Show on the homepage</p>
                </div>
                <Switch checked={featured} onCheckedChange={(v) => setValue('featured', v)} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="h-12 px-8 border border-border text-xs uppercase tracking-widest font-light hover:bg-muted transition-colors"
            >
              Cancel
            </button>
                        <button
              type="submit"
              disabled={uploadingImages || isPending}
              className="h-12 px-8 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {uploadingImages ? 'Uploading images...' : isPending ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      <VariantModal
        open={modalOpen}
        onClose={closeModal}
        initialData={editingIndex !== null ? allVariants?.[editingIndex] : null}
        onSave={handleSaveVariant}
      />
    </div>
  );
};
