import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Search, X, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  AlertDialog, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/AlertDialog';
import { useInfiniteProducts, useToggleStock, useToggleVariantStock, productKeys } from '@/features/products/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { getProductThumbnail, cn, getApiError } from '@/lib/utils';

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
      (product.variants ?? []).filter((v) => v.inStock === false).forEach((variant) => {
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

/* mobile: 2 cols — product+thumb | demand+button
   md+:    4 cols — product | code | demand | button */
const GRID = 'grid grid-cols-[1fr_auto] md:grid-cols-[1fr_76px_52px_44px] items-center gap-x-3 px-4';

export const RestockPage = () => {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const toggleStock        = useToggleStock();
  const toggleVariantStock = useToggleVariantStock();

  const [search, setSearch]           = useState('');
  const [activeCategory, setCategory] = useState('ALL');
  const debouncedSearch  = useDebounce(search, 350);
  const selectedCategory = activeCategory === 'ALL' ? '' : activeCategory;

  // Mirrors the All Products page: server-paginated infinite query with
  // anyOutOfStock + search/category pushed server-side so pagination doesn't
  // silently hide search matches that haven't been fetched yet.
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteProducts({
    search: debouncedSearch,
    category: selectedCategory,
    anyOutOfStock: true,
  });

  const loadedProducts = useMemo(
    () => data?.pages.flatMap((page) => page.products) ?? [],
    [data]
  );
  const totalOos     = data?.pages[0]?.total ?? 0;
  const allItems     = useMemo(() => flattenOos(loadedProducts), [loadedProducts]);
  const totalSignals = useMemo(() => allItems.reduce((s, i) => s + i.demand, 0), [allItems]);

  // Search and category are server-side now — `allItems` already reflects
  // the active filters, no second client-side pass needed.
  const filtered   = allItems;
  const withDemand = filtered.filter((i) => i.demand > 0);
  const noDemand   = filtered.filter((i) => i.demand === 0);
  const isPending  = toggleStock.isPending || toggleVariantStock.isPending;
  const isFiltered = !!debouncedSearch.trim() || activeCategory !== 'ALL';
  const chips      = ['ALL', ...categories.map((c) => c.name)];
  const [pendingRestock, setPendingRestock] = useState(null);
  const [selectedItem,   setSelectedItem]   = useState(null);

  // ── Infinite scroll observer ─────────────────────
  const sentinelRef = useRef(null);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  const confirmRestock = () => {
    if (!pendingRestock) return;
    handleRestock(pendingRestock);
    setPendingRestock(null);
  };

  const handleRestock = (item) => {
    if (item.type === 'variant') {
      toggleVariantStock.mutate(
        { productId: item.product.id, variantId: item.variant.id, inStock: true },
        {
          onSuccess: () => { toast.success(`${item.variant.color} is back in stock.`); qc.invalidateQueries({ queryKey: productKeys.lists() }); qc.invalidateQueries({ queryKey: productKeys.detail(item.product.id) }); },
          onError: (err) => toast.error(getApiError(err, 'Failed to update stock.')),
        }
      );
    } else {
      toggleStock.mutate(
        { id: item.product.id, inStock: true },
        {
          onSuccess: () => { toast.success(`"${item.product.name}" is back in stock.`); qc.invalidateQueries({ queryKey: productKeys.stats() }); qc.invalidateQueries({ queryKey: productKeys.lists() }); },
          onError: (err) => toast.error(getApiError(err, 'Failed to update stock.')),
        }
      );
    }
  };

  /* ── Table header ───────────────────────────── */
  // sticky -top-px + shadow extends the bg 1px upward to eliminate the
  // sub-pixel sliver browsers briefly render above a top:0 sticky element
  // during fast scrolls. Same trick as the All Products thead.
  // bg-muted is fully opaque so scrolled rows can't bleed through.
  const THead = () => (
    <div className={cn(
      GRID,
      'sticky -top-px z-10 py-2.5 bg-muted border-b border-border shadow-[0_-1px_0_0_hsl(var(--muted))]'
    )}>
      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold">Product</span>
      {/* desktop-only columns */}
      <span className="hidden md:block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold text-center">Code</span>
      <span className="hidden md:block text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold text-center">Demand</span>
      {/* last col: "Action" on mobile, "Stock" on desktop */}
      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold text-center">
        <span className="md:hidden">Action</span>
        <span className="hidden md:inline">Stock</span>
      </span>
    </div>
  );

  /* ── Single row ─────────────────────────────── */
  const Row = ({ item, dim }) => (
    <div
      onClick={() => setSelectedItem(item)}
      className={cn(
        GRID, 'py-3 border-b border-border/20 last:border-0 transition-colors duration-100 cursor-pointer',
        dim ? 'opacity-40 hover:opacity-60' : 'hover:bg-muted/20'
      )}
    >
      {/* Thumbnail + product info in one cell */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 overflow-hidden bg-muted/60">
          {item.thumbnail
            ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
            : <div className="w-full h-full" />}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground leading-snug truncate">{item.name}</p>
          {item.variant_label && (
            <p className="text-xs text-muted-foreground/65 leading-tight truncate mt-0.5">{item.variant_label}</p>
          )}
          <p className="text-[10px] text-muted-foreground/40 leading-tight truncate mt-0.5">
            {item.category}{item.code && <span className="md:hidden"> · {item.code}</span>}
          </p>
        </div>
      </div>

      {/* Code — desktop only */}
      <div className="hidden md:flex items-center justify-center">
        <span className="text-[11px] font-mono text-muted-foreground/55 tabular-nums">{item.code || '—'}</span>
      </div>

      {/* Demand — desktop only */}
      <div className="hidden md:flex items-center justify-center">
        {item.demand > 0
          ? <span className="text-sm font-bold text-amber-600 tabular-nums leading-none">{item.demand}</span>
          : <span className="text-muted-foreground/20 text-sm">—</span>
        }
      </div>

      {/* Last col: demand+button on mobile, button-only on desktop */}
      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        {item.demand > 0 && (
          <span className="md:hidden text-sm font-bold text-amber-600 tabular-nums leading-none">{item.demand}</span>
        )}
        {/* 44x44 hit area for mobile per accessibility guidance — visual circle
            stays 28x28 inside the padded button. */}
        <button
          onClick={() => setPendingRestock(item)}
          disabled={isPending}
          title="Mark as in stock"
          aria-label="Mark as in stock"
          className="h-11 w-11 -mr-2 flex items-center justify-center transition-opacity duration-200 disabled:opacity-30 disabled:pointer-events-none group"
        >
          <span className="h-7 w-7 rounded-full border border-green-300 flex items-center justify-center text-green-500 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all duration-200">
            <RotateCcw className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>
    </div>
  );

  /* ── Loading skeleton ───────────────────────── */
  const LoadingSkeleton = () => (
    <div className="border border-border bg-card">
      <div className={cn(GRID, 'py-2.5 bg-muted/50 border-b border-border')}>
        <Skeleton className="h-2 w-14" />
        <Skeleton className="hidden md:block h-2 w-10 mx-auto" />
        <Skeleton className="hidden md:block h-2 w-10 mx-auto" />
        <Skeleton className="h-2 w-10 ml-auto" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cn(GRID, 'py-3 border-b border-border/20 last:border-0')}>
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="h-10 w-10 shrink-0" />
            <div className="space-y-1.5 min-w-0 flex-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
          <div className="hidden md:flex justify-center"><Skeleton className="h-2.5 w-12" /></div>
          <div className="hidden md:flex justify-center"><Skeleton className="h-4 w-5" /></div>
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-4 w-5 md:hidden" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    // Same height math as the All Products page: 100dvh minus the admin
    // navbar (h-14 = 56px) minus the main element's vertical padding (2rem).
    // Header + search + chips stay above this; only the inner div scrolls.
    <div className="flex flex-col h-[calc(100dvh-56px-2rem)] min-h-0 overflow-hidden max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/dashboard"
            className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-serif tracking-wide truncate">Restock</h1>
        </div>
        {!isLoading && totalOos > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-lg font-serif tabular-nums leading-none">{totalOos}</p>
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

      {/* Search — also visible while a filter is active so the user can clear
          when results narrow to zero. */}
      {!isLoading && (totalOos > 0 || isFiltered) && (
        <div className="space-y-2 mb-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, variant or code…"
              className="w-full h-9 pl-10 pr-9 border border-border/50 bg-background text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/25 transition-colors"
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

      {/* Scrollable content — header + search/chips stay sticky above; only
          this region scrolls. The THead inside has its own sticky positioning
          relative to this container. */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-12">

      {/* Loading */}
      {isLoading && <LoadingSkeleton />}

      {/* Error — distinct from "all in stock" so admin can retry */}
      {!isLoading && isError && (
        <div className="border border-border bg-card py-16 flex flex-col items-center gap-3 text-center px-4">
          <p className="font-serif text-lg font-light text-muted-foreground/60">Couldn&apos;t load products</p>
          <p className="text-xs text-muted-foreground/45 max-w-xs">Check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-2xs tracking-[0.2em] uppercase font-light text-muted-foreground hover:text-foreground border-b border-border hover:border-foreground pb-0.5 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* All in stock — truly zero OOS products (no filter) */}
      {!isLoading && !isError && totalOos === 0 && !isFiltered && (
        <div className="border border-border bg-card py-20 flex flex-col items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground/20" />
          <div className="text-center">
            <p className="font-serif text-xl font-light text-muted-foreground/50">All in stock</p>
            <p className="text-xs text-muted-foreground/35 mt-1">Every product is currently available.</p>
          </div>
        </div>
      )}

      {/* No filter match — OOS products exist but none match the current filter */}
      {!isLoading && totalOos === 0 && isFiltered && (
        <div className="border border-border bg-card py-12 flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground/50">No results.</p>
          <button onClick={() => { setSearch(''); setCategory('ALL'); }} className="text-xs text-foreground/50 underline hover:text-foreground transition-colors">Clear filters</button>
        </div>
      )}


      {!isLoading && filtered.length > 0 && (
        <div className="border border-border bg-card">
          <THead />
          {withDemand.map((item) => <Row key={item.key} item={item} dim={false} />)}
          {withDemand.length > 0 && noDemand.length > 0 && (
            <div className="border-b border-border/40" />
          )}
          {noDemand.map((item) => <Row key={item.key} item={item} dim={!isFiltered} />)}
        </div>
      )}

      {/* Sentinel — invisible trigger for the infinite-scroll observer */}
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />

      {/* Loading next page — same three-dot wave as the All Products page */}
      {isFetchingNextPage && (
        <div
          className="flex items-center justify-center gap-2 py-8"
          role="status"
          aria-label="Loading more products"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="block h-1.5 w-1.5 rounded-full bg-foreground"
              animate={{ opacity: [0.18, 1, 0.18], y: [0, -2, 0] }}
              transition={{ duration: 1.05, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* End of list */}
      {!hasNextPage && filtered.length > 0 && !isLoading && (
        <p className="text-center text-xs tracking-[0.2em] uppercase text-muted-foreground/50 py-6">
          All {totalOos} {totalOos === 1 ? 'item' : 'items'} loaded
        </p>
      )}

      {isFiltered && filtered.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground/35 text-center">
          Showing filtered results ·{' '}
          <button onClick={() => { setSearch(''); setCategory('ALL'); }} className="underline hover:text-foreground transition-colors">Clear</button>
        </p>
      )}

      </div>{/* /scrollable content */}

      {/* ── Product detail modal ─────────────────── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative z-10 w-full max-w-sm bg-background border border-border shadow-xl">

            {/* Image */}
            <div className="aspect-square w-full overflow-hidden bg-muted/50">
              {selectedItem.thumbnail
                ? <img src={selectedItem.thumbnail} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-muted" />}
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-serif text-xl font-light leading-snug">{selectedItem.name}</h2>
                {selectedItem.variant_label && (
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedItem.variant_label}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-border pt-4">
                {[
                  { label: 'Category', value: selectedItem.category },
                  { label: 'Code',     value: selectedItem.code || '—' },
                  { label: 'Demand',   value: selectedItem.demand > 0 ? `${selectedItem.demand} waiting` : 'No requests yet' },
                  { label: 'Status',   value: 'Out of Stock' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium mb-0.5">{label}</p>
                    <p className={cn(
                      'text-sm font-medium',
                      label === 'Demand' && selectedItem.demand > 0 && 'text-amber-600',
                      label === 'Status' && 'text-red-500'
                    )}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="h-10 px-5 border border-border text-xs uppercase tracking-widest font-light hover:bg-muted transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setPendingRestock(selectedItem); setSelectedItem(null); }}
                  className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white text-xs uppercase tracking-widest font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Mark In Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!pendingRestock} onOpenChange={(v) => { if (!v) setPendingRestock(null); }}>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark as in stock?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingRestock?.variant_label
              ? <><span className="font-medium text-foreground">{pendingRestock.name}</span> · {pendingRestock.variant_label} will be marked as available in your store.</>
              : <><span className="font-medium text-foreground">{pendingRestock?.name}</span> will be marked as available in your store.</>
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingRestock(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmRestock} className="bg-green-600 hover:bg-green-700 text-white border-0">Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>

    </div>
  );
};
