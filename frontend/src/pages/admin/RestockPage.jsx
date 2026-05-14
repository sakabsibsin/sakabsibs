import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProducts, useToggleStock, useToggleVariantStock, productKeys } from '@/features/products/hooks';
import { getProductThumbnail, cn } from '@/lib/utils';

const getTotalDemand = (product) => {
  const variantDemand = (product.variants ?? []).reduce((s, v) => s + (v.demandCount ?? 0), 0);
  return (product.demandCount ?? 0) + variantDemand;
};

export const RestockPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useProducts({ anyOutOfStock: true, limit: 200 });
  const toggleStock = useToggleStock();
  const toggleVariantStock = useToggleVariantStock();

  const allProducts = [...(data?.products ?? [])].sort(
    (a, b) => getTotalDemand(b) - getTotalDemand(a)
  );
  const withDemand = allProducts.filter((p) => getTotalDemand(p) > 0);
  const noDemand   = allProducts.filter((p) => getTotalDemand(p) === 0);

  // Stat strip calculations
  const totalOosItems = allProducts.reduce((count, p) => {
    if (!p.variants?.length) return count + (!p.inStock ? 1 : 0);
    return count + p.variants.filter((v) => v.inStock === false).length +
      (!p.inStock && !p.variants.some((v) => v.inStock === false) ? 1 : 0);
  }, 0);
  const totalWithDemand = allProducts.reduce((count, p) => {
    if (!p.variants?.length) return count + ((p.demandCount ?? 0) > 0 ? 1 : 0);
    return count + p.variants.filter((v) => v.inStock === false && (v.demandCount ?? 0) > 0).length;
  }, 0);
  const totalSignals = allProducts.reduce((sum, p) => {
    const variantDemand = (p.variants ?? []).reduce((s, v) => s + (v.demandCount ?? 0), 0);
    return sum + (p.demandCount ?? 0) + variantDemand;
  }, 0);

  const handleRestockProduct = (product) => {
    toggleStock.mutate(
      { id: product.id, inStock: true },
      {
        onSuccess: () => {
          toast.success(`"${product.name}" is back in stock.`);
          qc.invalidateQueries({ queryKey: productKeys.stats() });
          qc.invalidateQueries({ queryKey: productKeys.lists() });
        },
        onError: () => toast.error('Failed to update stock.'),
      }
    );
  };

  const handleRestockVariant = (product, variant) => {
    toggleVariantStock.mutate(
      { productId: product.id, variantId: variant.id, inStock: true },
      {
        onSuccess: () => {
          toast.success(`"${product.name} — ${variant.color}" is back in stock.`);
          qc.invalidateQueries({ queryKey: productKeys.lists() });
        },
        onError: () => toast.error('Failed to update variant stock.'),
      }
    );
  };

  const renderProductCard = (product, faded = false) => {
    const thumb = getProductThumbnail(product);
    const hasVariants = (product.variants ?? []).length > 0;
    const oosVariants = hasVariants
      ? product.variants.filter((v) => v.inStock === false)
      : [];
    const productLevelOos = !product.inStock && (!hasVariants || oosVariants.length === 0);

    return (
      <div
        key={product.id}
        className={cn(
          'border bg-card',
          faded ? 'border-border/40 opacity-60' : 'border-border'
        )}
      >
        {/* Product header row */}
        <div className={cn(
          'flex items-center gap-4 px-4 py-3.5',
          hasVariants && 'border-b border-border/30'
        )}>
          <div className="h-11 w-11 shrink-0 overflow-hidden" style={{ background: 'hsl(34,40%,94%)' }}>
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-muted/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', faded && 'text-foreground/50')}>
              {product.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-muted-foreground/45">{product.category}</p>
              {product.productCode && (
                <>
                  <span className="text-muted-foreground/25 text-[10px]">·</span>
                  <p className="text-[10px] font-mono text-muted-foreground/40">{product.productCode}</p>
                </>
              )}
            </div>
          </div>

          {/* Product-level restock button — only when master switch is off with no OOS variants */}
          {productLevelOos && (
            <div className="flex items-center gap-3 shrink-0">
              {!faded && (
                <div className="text-center w-14">
                  <p className="text-xl font-serif leading-none">{product.demandCount ?? 0}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/35 mt-1">
                    {(product.demandCount ?? 0) === 1 ? 'request' : 'requests'}
                  </p>
                </div>
              )}
              <button
                onClick={() => handleRestockProduct(product)}
                disabled={toggleStock.isPending}
                className={cn(
                  'shrink-0 h-8 px-4 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40',
                  faded
                    ? 'border border-border/40 text-muted-foreground/40 hover:border-foreground/25 hover:text-foreground hover:bg-muted/30'
                    : 'bg-foreground text-background hover:bg-foreground/85'
                )}
              >
                Restock
              </button>
            </div>
          )}
        </div>

        {/* Variant sub-rows — one per OOS variant */}
        {oosVariants.map((variant) => (
          <div
            key={variant.id}
            className="flex items-center gap-4 px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/10 transition-colors"
          >
            <div className="w-11 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm truncate', faded ? 'text-foreground/40' : 'text-foreground/80')}>
                {variant.color}
              </p>
            </div>
            {!faded && (
              <div className="text-center shrink-0 w-14">
                <p className="text-xl font-serif leading-none">{variant.demandCount ?? 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground/35 mt-1">
                  {(variant.demandCount ?? 0) === 1 ? 'request' : 'requests'}
                </p>
              </div>
            )}
            <button
              onClick={() => handleRestockVariant(product, variant)}
              disabled={toggleVariantStock.isPending}
              className={cn(
                'shrink-0 h-8 px-4 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40',
                faded
                  ? 'border border-border/40 text-muted-foreground/40 hover:border-foreground/25 hover:text-foreground hover:bg-muted/30'
                  : 'bg-foreground text-background hover:bg-foreground/85'
              )}
            >
              Restock
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl pb-16">

      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-light text-muted-foreground/40 hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-serif font-light tracking-wide">Restock Demand</h1>
      </div>

      {/* Stat strip */}
      {!isLoading && allProducts.length > 0 && (
        <div className="grid grid-cols-3 border border-border bg-card mb-10">
          {[
            { value: totalOosItems,   label: 'Out of Stock' },
            { value: totalWithDemand, label: 'Have Demand'  },
            { value: totalSignals,    label: 'Total Signals'},
          ].map(({ value, label }, i) => (
            <div
              key={label}
              className={cn('flex flex-col items-center justify-center py-5', i < 2 && 'border-r border-border')}
            >
              <p className="text-3xl font-serif mb-1">{value}</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border bg-card p-5 flex items-center gap-4">
              <Skeleton className="h-11 w-11 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-24 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && allProducts.length === 0 && (
        <div className="border border-border bg-card py-24 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/15 mx-auto mb-5" />
          <p className="font-serif text-2xl font-light text-muted-foreground/40 mb-2">All clear</p>
          <p className="text-xs text-muted-foreground/30 tracking-wide">Every product is currently in stock.</p>
        </div>
      )}

      {/* Most Wanted */}
      {!isLoading && withDemand.length > 0 && (
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-4">
            Most Wanted — prioritise these
          </p>
          <div className="space-y-2">
            {withDemand.map((p) => renderProductCard(p, false))}
          </div>
        </div>
      )}

      {/* No demand */}
      {!isLoading && noDemand.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/35 mb-3">
            Out of Stock · No Customer Requests Yet ({noDemand.length})
          </p>
          <div className="space-y-2">
            {noDemand.map((p) => renderProductCard(p, true))}
          </div>
        </div>
      )}
    </div>
  );
};
