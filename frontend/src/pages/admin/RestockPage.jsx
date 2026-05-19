import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Search, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { useProducts, useToggleStock, useToggleVariantStock, productKeys } from '@/features/products/hooks';
import { useCategories } from '@/features/categories/hooks';
import { getProductThumbnail, cn } from '@/lib/utils';

/* ── Flatten OOS items into flat sortable list ── */
const flattenOos = (products) => {
  const rows = [];
  for (const product of products) {
    const hasVariants = product.variants?.length > 0;
    if (!hasVariants) {
      if (!product.inStock) {
        rows.push({
          key: product.id, type: 'product', product, variant: null,
          demand: product.demandCount ?? 0,
          thumbnail: getProductThumbnail(product),
          name: product.name, variant_label: null,
          category: product.category, code: product.productCode,
        });
      }
    } else {
      product.variants.filter((v) => v.inStock === false).forEach((variant) => {
        rows.push({
          key: `${product.id}-${variant.id}`, type: 'variant', product, variant,
          demand: variant.demandCount ?? 0,
          thumbnail: variant.images?.[0] || getProductThumbnail(product),
          name: product.name, variant_label: variant.color,
          category: product.category, code: product.productCode,
        });
      });
    }
  }
  return rows.sort((a, b) => b.demand - a.demand);
};

/* ── grid shared by header + every data row ─────
   col widths: img | product | code | demand | restock
   min-w on wrapper prevents collapse on small screens ── */
const GRID = 'grid grid-cols-[44px_1fr_88px_60px_56px] items-center gap-x-2 px-4';

export const RestockPage = () => {
  const qc = useQueryClient();
  const { data, isLoading }       = useProducts({ anyOutOfStock: true, limit: 200 });
  const { data: categories = [] } = useCategories();
  const toggleStock               = useToggleStock();
  const toggleVariantStock        = useToggleVariantStock();

  const [search, setSearch]           = useState('');
  const [activeCategory, setCategory] = useState('ALL');

  const allItems     = useMemo(() => flattenOos(data?.products ?? []), [data]);
  const totalSignals = useMemo(() => allItems.reduce((s, i) => s + i.demand, 0), [allItems]);

  const filtered = useMemo(() => {
    let rows = allItems;
    if (activeCategory !== 'ALL')
      rows = rows.filter((r) => r.category?.toLowerCase() === activeCategory.toLowerCase());
    if (search.trim())
      rows = rows.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.variant_label ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.code ?? '').toLowerCase().includes(search.toLowerCase())
      );
    return rows;
  }, [allItems, search, activeCategory]);

  const withDemand = filtered.filter((i) => i.demand > 0);
  const noDemand   = filtered.filter((i) => i.demand === 0);
  const isPending  = toggleStock.isPending || toggleVariantStock.isPending;
  const isFiltered = !!search.trim() || activeCategory !== 'ALL';
  const chips      = ['ALL', ...categories.map((c) => c.name)];

  const handleRestock = (item) => {
    if (item.type === 'variant') {
      toggleVariantStock.mutate(
        { productId: item.product.id, variantId: item.variant.id, inStock: true },
        {
          onSuccess: () => { toast.success(`${item.variant.color} is back in stock.`); qc.invalidateQueries({ queryKey: productKeys.lists() }); },
          onError:   () => toast.error('Failed to update.'),
        }
      );
    } else {
      toggleStock.mutate(
        { id: item.product.id, inStock: true },
        {
          onSuccess: () => { toast.success(`"${item.product.name}" is back in stock.`); qc.invalidateQueries({ queryKey: productKeys.stats() }); qc.invalidateQueries({ queryKey: productKeys.lists() }); },
          onError:   () => toast.error('Failed to update.'),
        }
      );
    }
  };

  /* ── Table header ───────────────────────────── */
  const THead = () => (
    <div className={cn(GRID, 'py-2.5 bg-muted/50 border-b border-border sticky top-0 z-10')}>
      <div />
      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold">Product</span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold text-center">Code</span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold text-center">Demand</span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold text-center">Restock</span>
    </div>
  );

  /* ── Single row ─────────────────────────────── */
  const Row = ({ item, dim }) => (
    <div className={cn(
      GRID, 'py-3 border-b border-border/20 last:border-0 transition-colors duration-100',
      dim ? 'opacity-40 hover:opacity-60' : 'hover:bg-muted/20'
    )}>
      {/* Thumbnail */}
      <div className="h-11 w-11 shrink-0 overflow-hidden bg-muted/60">
        {item.thumbnail
          ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full" />}
      </div>

      {/* Product name + variant + category */}
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground leading-snug truncate">
          {item.name}
        </p>
        {item.variant_label && (
          <p className="text-xs text-muted-foreground/65 leading-tight truncate mt-0.5">{item.variant_label}</p>
        )}
        <p className="text-[10px] text-muted-foreground/40 leading-tight truncate mt-0.5">{item.category}</p>
      </div>

      {/* Code */}
      <div className="flex items-center justify-center">
        <span className="text-[11px] font-mono text-muted-foreground/55 tabular-nums text-center">
          {item.code || '—'}
        </span>
      </div>

      {/* Demand */}
      <div className="flex items-center justify-center">
        {item.demand > 0
          ? <span className="text-base font-bold text-amber-600 tabular-nums leading-none">{item.demand}</span>
          : <span className="text-muted-foreground/25 text-sm">—</span>
        }
      </div>

      {/* Restock toggle */}
      <div className="flex items-center justify-center">
        <Switch checked={false} disabled={isPending} onCheckedChange={() => handleRestock(item)} />
      </div>
    </div>
  );

  /* ── Loading skeleton ───────────────────────── */
  const LoadingSkeleton = () => (
    <div className="border border-border bg-card overflow-x-auto">
      <div style={{ minWidth: 560 }}>
        <div className={cn(GRID, 'py-2.5 bg-muted/50 border-b border-border')}>
          <div /><Skeleton className="h-2 w-14" /><Skeleton className="h-2 w-10 mx-auto" />
          <Skeleton className="h-2 w-10 mx-auto" /><Skeleton className="h-2 w-10 mx-auto" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(GRID, 'py-3 border-b border-border/20 last:border-0')}>
            <Skeleton className="h-11 w-11" />
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-2 w-16" />
            </div>
            <div className="flex justify-center"><Skeleton className="h-2.5 w-14" /></div>
            <div className="flex justify-center"><Skeleton className="h-4 w-6" /></div>
            <div className="flex justify-center"><Skeleton className="h-5 w-10 rounded-full" /></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl pb-12">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/dashboard"
            className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-serif tracking-wide truncate">Restock</h1>
        </div>
        {!isLoading && allItems.length > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-lg font-serif tabular-nums leading-none">{allItems.length}</p>
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/40 mt-0.5">Out of Stock</p>
            </div>
            <div className="w-px h-7 bg-border" />
            <div className="text-right">
              <p className="text-lg font-serif tabular-nums leading-none">{totalSignals}</p>
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/40 mt-0.5">Signals</p>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!isLoading && allItems.length > 0 && (
        <div className="space-y-2.5 mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, variant or code…"
              className="w-full h-10 pl-10 pr-9 border border-border/50 bg-background text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/25 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => setCategory(chip)}
                className={cn(
                  'h-7 px-3 text-[10px] uppercase tracking-widest font-medium transition-all duration-150 shrink-0',
                  activeCategory === chip ? 'bg-foreground text-background' : 'border border-border text-foreground/50 hover:border-foreground/40 hover:text-foreground'
                )}
              >
                {chip === 'ALL' ? 'All' : chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingSkeleton />}

      {/* All in stock */}
      {!isLoading && allItems.length === 0 && (
        <div className="border border-border bg-card py-20 flex flex-col items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground/20" />
          <div className="text-center">
            <p className="font-serif text-xl font-light text-muted-foreground/50">All in stock</p>
            <p className="text-xs text-muted-foreground/35 mt-1">Every product is currently available.</p>
          </div>
        </div>
      )}

      {/* No filter match */}
      {!isLoading && allItems.length > 0 && filtered.length === 0 && (
        <div className="border border-border bg-card py-12 flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground/50">No results.</p>
          <button onClick={() => { setSearch(''); setCategory('ALL'); }} className="text-xs text-foreground/50 underline hover:text-foreground transition-colors">Clear filters</button>
        </div>
      )}

      {/* Table — overflow-x-auto so it scrolls rather than clips on narrow screens */}
      {!isLoading && filtered.length > 0 && (
        <div className="border border-border bg-card overflow-x-auto">
          <div style={{ minWidth: 540 }}>
            <THead />

            {withDemand.map((item) => <Row key={item.key} item={item} dim={false} />)}

            {withDemand.length > 0 && noDemand.length > 0 && (
              <div className="border-b border-border/40" />
            )}

            {noDemand.map((item) => <Row key={item.key} item={item} dim={!isFiltered} />)}
          </div>
        </div>
      )}

      {isFiltered && filtered.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground/35 text-center">
          {filtered.length} of {allItems.length} items ·{' '}
          <button onClick={() => { setSearch(''); setCategory('ALL'); }} className="underline hover:text-foreground transition-colors">Clear</button>
        </p>
      )}

    </div>
  );
};
