import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { ImageUpload } from './ImageUpload';
import {
  AlertDialog, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/AlertDialog';
import { cn, getApiError } from '@/lib/utils';
import { getToken } from '@/lib/apiClient';
import { useCreateProduct, useUpdateProduct, useProduct } from '@/features/products/hooks';
import { useCategories } from '@/features/categories/hooks';
import { API_URL, MAX_IMAGES } from '@/constants/config';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().min(1, 'Description is required'),
  price: z.coerce.number({ invalid_type_error: 'Enter a valid price' }).min(1, 'Price is required'),
  material: z.string().optional().default(''),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  images: z.array(z.any()).optional().default([]),
  variants: z.array(z.object({
    color:   z.string().trim().min(1, 'Color is required'),
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

const inputCls = 'flex h-10 w-full border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:opacity-50';
const labelCls = 'block uppercase tracking-widest text-[10px] mb-1 text-foreground/80';

/* ── Variant modal ────────────────────────────────── */
const variantSchema = z.object({
  color:   z.string().trim().min(1, 'Color name is required'),
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
      setDraft(initialData ? { ...initialData } : { ...EMPTY_DRAFT });
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
            maxImages={MAX_IMAGES}
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
  const { data: product, isLoading, isError } = useProduct(productId);
  const { data: categories = [] } = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
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
          headers: { Authorization: `Bearer ${getToken()}` },
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

  // Reset the form only when the product ID changes — NOT on every cache refresh.
  // Depending on `product` would overwrite the admin's in-progress edits whenever
  // React Query refetched the same product (e.g. window focus, mutation invalidation).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, reset]);

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
      setUploadingImages(true);
      let uploadedImages;
      try {
        // Upload base images + all variant images together before saving
        uploadedImages = await uploadFiles(values.images);
        if (values.variants?.length) {
          values = {
            ...values,
            variants: await Promise.all(
              values.variants.map(async (variant) => ({
                ...variant,
                images: await uploadFiles(variant.images ?? []),
              }))
            ),
          };
        }
      } catch (err) {
        toast.error(getApiError(err, 'One or more images failed to upload. Please try again.'));
        return;
      } finally {
        setUploadingImages(false);
      }

      const payload = { ...values, images: uploadedImages };

      if (isEditing) {
        await update.mutateAsync({ id: productId, body: payload });
        toast.success('Changes saved successfully.');
      } else {
        await create.mutateAsync(payload);
        toast.success('Product added to catalog.');
      }
      navigate('/admin/products');
    } catch {
      toast.error(isEditing ? 'Failed to update product. Please try again.' : 'Failed to create product. Please try again.');
    }
  };

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-serif">Loading product details...</div>;
  }

  if (isEditing && isError) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <p className="font-serif text-xl font-light text-muted-foreground/60">Product not found.</p>
        <p className="text-xs text-muted-foreground/45">It may have been deleted or the link is incorrect.</p>
        <Link
          to="/admin/products"
          className="text-2xs tracking-[0.2em] uppercase font-light text-muted-foreground hover:text-foreground border-b border-border hover:border-foreground pb-0.5 transition-colors"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const isPending = create.isPending || update.isPending;

  return (
    <motion.div
      className="py-2 max-w-5xl"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.7 }}
    >

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/admin/products"
          className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-serif tracking-wide flex-1 min-w-0">
          {isEditing ? 'Edit Product' : 'New Product'}
        </h1>
        {isEditing && product && (
          <div className="flex items-center gap-2 text-xs border border-border px-3 py-1.5 bg-muted/30 flex-shrink-0">
            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Code</span>
            <span className="font-mono font-semibold">{product.productCode}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3">

          {/* ── Left column ─────────────────────── */}
          <div className="space-y-3">

            {/* Product details — one unified card */}
            <div className="bg-card border border-border p-4 space-y-3">
              {/* Name — full width */}
              <div>
                <label className={labelCls}>Product Name</label>
                <input className={inputCls} placeholder="e.g. Silver Cuff Bracelet" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>

              {/* Category + Price — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  {categories.length === 0 ? (
                    <div className="border border-dashed border-border p-3 text-xs text-muted-foreground text-center">
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
                  <label className={labelCls}>Price (₹)</label>
                  <input type="number" step="1" min="0" placeholder="0.00" className={inputCls} {...register('price')} />
                  {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
                </div>
              </div>

              {/* Material — full width */}
              <div>
                <label className={labelCls}>Material <span className="normal-case tracking-normal text-muted-foreground/50">(optional)</span></label>
                <input className={inputCls} placeholder="e.g. Sterling Silver, Gold Plated" {...register('material')} />
              </div>

              {/* Description — joined, no separate card */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the product..."
                  className={`${inputCls} h-auto py-2 resize-none`}
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
              </div>
            </div>

            {/* Images */}
            <div className="bg-card border border-border p-4">
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
                    maxImages={MAX_IMAGES}
                  />
                  {errors.images && <p className="text-xs text-destructive mt-1">{errors.images.message}</p>}
                </>
              )}
            </div>

            {/* Variants */}
            <div className="bg-card border border-border p-4">
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
                  No variants added. Click "Add Variant" to add colour options with different prices and photos.
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
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-11 h-11">
                          <button
                            type="button"
                            onClick={() => {
                              const newInStock = allVariants[index]?.inStock !== false ? false : true;
                              updateVariant(index, { ...allVariants[index], inStock: newInStock });
                              const updated = allVariants.map((v, i) => i === index ? { ...v, inStock: newInStock } : v);
                              setValue('inStock', updated.some(v => v.inStock !== false));
                            }}
                            title={allVariants?.[index]?.inStock === false ? 'Mark as In Stock' : 'Mark as Stock Out'}
                            aria-label={allVariants?.[index]?.inStock === false ? 'Mark variant as in stock' : 'Mark variant as out of stock'}
                            className="relative w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none group"
                          >
                            <span className="relative w-6 h-6 flex items-center justify-center">
                              <span className={cn(
                                'absolute inset-0 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100',
                                allVariants?.[index]?.inStock === false ? 'bg-red-400/20' : 'bg-green-400/20'
                              )} />
                              <span className={cn(
                                'w-2.5 h-2.5 rounded-full ring-[2.5px] ring-offset-[2px] ring-offset-background transition-all duration-300 group-hover:scale-110',
                                allVariants?.[index]?.inStock === false
                                  ? 'bg-red-500 ring-red-400/60'
                                  : 'bg-green-500 ring-green-400/60'
                              )} />
                            </span>
                          </button>
                        </div>
                        <div className="flex items-center justify-center w-11 h-11">
                          <button
                            type="button"
                            onClick={() => openEditModal(index)}
                            title="Edit variant"
                            aria-label="Edit variant"
                            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center text-primary/40 hover:text-primary transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-center w-11 h-11">
                          <button
                            type="button"
                            onClick={() => setDeleteIndex(index)}
                            title="Remove variant"
                            aria-label="Remove variant"
                            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400/50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {variantFields.length > 0 && !allVariants?.some((v) => v.isDefault) && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 mt-2">
                  No default variant set — the first variant will be shown in the shop.
                </p>
              )}
            </div>
          </div>

          {/* ── Right sidebar ────────────────────── */}
          <div className="space-y-3">

            {/* Availability */}
            <div className="bg-card border border-border p-4 space-y-0">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium">In Stock</p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {allVariants.length > 0 ? 'Master switch — turns all variants off' : 'Available to order'}
                  </p>
                </div>
                <Switch
                  checked={inStock}
                  onCheckedChange={(v) => {
                    setValue('inStock', v);
                    (allVariants ?? []).forEach((variant, i) => {
                      updateVariant(i, { ...variant, inStock: v });
                    });
                  }}
                />
              </div>
              <div className="border-t border-border/40 mt-3 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-xs text-muted-foreground">Show on the homepage</p>
                </div>
                <Switch checked={featured} onCheckedChange={(v) => setValue('featured', v)} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-4">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="flex-1 h-11 border border-border text-xs uppercase tracking-widest font-light hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingImages || isPending}
                className="flex-1 h-11 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {uploadingImages ? 'Uploading...' : isPending ? 'Saving...' : isEditing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>

        </div>
      </form>

      <VariantModal
        open={modalOpen}
        onClose={closeModal}
        initialData={editingIndex !== null ? allVariants?.[editingIndex] : null}
        onSave={handleSaveVariant}
      />

      <AlertDialog open={deleteIndex !== null} onOpenChange={(v) => { if (!v) setDeleteIndex(null); }}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete variant?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteIndex !== null && allVariants?.[deleteIndex]?.color
              ? `"${allVariants[deleteIndex].color}" will be permanently removed from this product.`
              : 'This variant will be permanently removed from this product.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteIndex(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            // If the removed variant was the default, promote the first remaining
            // variant to default so the catalog always has a defined entry-point.
            const removingDefault = allVariants?.[deleteIndex]?.isDefault === true;
            removeVariant(deleteIndex);
            if (removingDefault) {
              const remaining = (allVariants ?? []).filter((_, i) => i !== deleteIndex);
              if (remaining.length > 0) {
                // useFieldArray indices shift after remove — the new index 0 is
                // whichever variant was previously at index 0 (or 1 if we just
                // deleted index 0). updateVariant operates on the new array.
                setTimeout(() => updateVariant(0, { ...remaining[0], isDefault: true }), 0);
              }
            }
            setDeleteIndex(null);
          }}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </motion.div>
  );
};
