import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { useProducts } from '@/features/products/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CategoryFilter } from '@/components/store/CategoryFilter';
import { Input } from '@/components/ui/Input';
import { cn, getEffectivePrice } from '@/lib/utils';

const sortOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Bestseller', value: 'featured' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export const CatalogPage = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useProducts({
    category: category || undefined,
    search: debouncedSearch || undefined,
    limit: 100,
  });

  const products = useMemo(() => {
    let sorted = [...(data?.products ?? [])];
    if (sort === 'price_asc') {
      sorted = sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sort === 'price_desc') {
      sorted = sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sort === 'featured') {
      sorted = sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return sorted;
  }, [data?.products, sort]);

  const hasFilters = !!category || !!debouncedSearch || !!sort;
  const clearAll = () => { setSearch(''); setCategory(''); setSort(''); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
            selected={category}
            onChange={setCategory}
          />
        </div>
      )}

      {/* Sort + result count row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <motion.p
          key={`${products.length}-${category}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-xs font-light text-muted-foreground/70 shrink-0"
        >
          {isLoading ? '' : `${products.length} ${products.length === 1 ? 'piece' : 'pieces'}${category ? ` · ${category}` : ''}`}
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
              onClick={() => setSortOpen((o) => !o)}
              className={cn(
                'flex items-center gap-2 h-9 px-3 border text-xs font-light transition-colors',
                sort ? 'border-foreground text-foreground' : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sort ? sortOptions.find((o) => o.value === sort)?.label : 'Sort'}
            </button>

            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-background border border-border shadow-md min-w-[180px]">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-xs transition-colors',
                        sort === opt.value
                          ? 'bg-foreground text-background'
                          : 'text-foreground hover:bg-muted'
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
      <ProductGrid products={products} isLoading={isLoading} />
    </motion.div>
  );
};