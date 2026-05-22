import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { useInfiniteProducts } from '@/features/products/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CategoryFilter } from '@/components/store/CategoryFilter';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// 'Latest' (empty string) maps to the backend's default sort — createdAt DESC.
// Same label as the admin page so the vocabulary is consistent across the app.
const sortOptions = [
  { label: 'Latest',              value: '' },
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
    // "Bestseller" is conceptually a filter — show *only* featured pieces,
    // not all products with featured ones floated to the top.
    featured: sort === 'featured',
  });

  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  // Pagination is explicit ("Show More" button) instead of scroll-triggered.
  // Auto-fetching on scroll trapped users — they could never reach the footer
  // because every scroll-to-bottom queued another fetch. With a manual button,
  // the footer is always reachable and users decide when they want more.

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
      <div className="relative mb-2 -mt-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, material or code…"
          className="pl-10 pr-10 h-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3.5" />
          </button>
        )}
      </div>

      {/* Category filter */}
      {categoriesData?.length > 0 && (
        <div className="mb-2 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 overflow-hidden">
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
                'flex items-center gap-2 h-8 px-3 border text-xs font-light transition-colors',
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

      {/* Show More — explicit pagination so the footer is always reachable */}
      {hasNextPage && products.length > 0 && (
        <div className="flex flex-col items-center gap-3 py-10">
          {isFetchingNextPage ? (
            <div
              className="flex items-center justify-center gap-2 h-11"
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
          ) : (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              className="px-10 h-11 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-200 text-2xs tracking-[0.22em] uppercase font-light"
            >
              Show More
            </button>
          )}
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/45 font-light">
            Viewing {products.length} of {totalCount}
          </p>
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
