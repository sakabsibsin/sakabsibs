import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { useInfiniteProducts } from '@/features/products/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CategoryFilter } from '@/components/store/CategoryFilter';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const sortOptions = [
  { label: 'Default',             value: '' },
  { label: 'Bestseller',          value: 'featured' },
  { label: 'Price: Low to High',  value: 'price_asc' },
  { label: 'Price: High to Low',  value: 'price_desc' },
];

export const CatalogPage = () => {
  useEffect(() => { document.title = 'Sakab Sibs — Shop'; }, []);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const { data: categoriesData } = useCategories();

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
    sort,
  });

  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  // ── Intersection observer ─────────────────────────────────────────────
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

  // ── Filters ───────────────────────────────────────────────────────────
  const hasFilters = !!selectedCategory || !!debouncedSearch || !!sort;
  const clearAll = () => { setSearch(''); setSelectedCategory(''); setSort(''); };
  const activeSortLabel = sortOptions.find((o) => o.value === sort)?.label;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="container-store pt-4 pb-12 sm:pb-16"
    >

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, material or code…"
          className="pl-10 pr-10 h-11"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category filter */}
      {categoriesData?.length > 0 && (
        <div className="mb-3 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 overflow-hidden">
          <CategoryFilter
            categories={categoriesData}
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>
      )}

      {/* Count + Sort row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <motion.p
          key={`${totalCount}-${selectedCategory}-${sort}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="text-xs font-light text-muted-foreground/70 shrink-0"
        >
          {!isLoading && totalCount > 0
            ? `${totalCount} ${totalCount === 1 ? 'piece' : 'pieces'}${selectedCategory ? ` · ${selectedCategory}` : ''}`
            : ''}
        </motion.p>

        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-2xs tracking-[0.15em] uppercase font-light text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Clear
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className={cn(
                'flex items-center gap-2 h-9 px-3 border text-xs font-light transition-colors',
                sort
                  ? 'border-foreground text-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {activeSortLabel && sort ? activeSortLabel : 'Sort'}
            </button>

            {sortOpen && (
              <>
                {/* Click-outside catcher */}
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-background border border-border shadow-md min-w-[180px]">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value || 'default'}
                      type="button"
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-xs transition-colors',
                        sort === opt.value
                          ? 'bg-muted text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <ProductGrid products={products} isLoading={isLoading} isError={isError} onRetry={refetch} />

      {/* Sentinel — invisible trigger for intersection observer */}
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />

      {/* Loading next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground animate-spin" />
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && products.length > 0 && !isLoading && (
        <p className="text-center text-xs tracking-[0.2em] uppercase text-muted-foreground/50 py-8">
          You&apos;ve seen all {totalCount} pieces
        </p>
      )}

    </motion.div>
  );
};
