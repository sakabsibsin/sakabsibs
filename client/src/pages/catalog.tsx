import { useState, useEffect, useRef, useCallback } from "react";
import { StoreLayout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import {
  useListProducts,
  useListCategories,
  getListProductsQueryKey,
  type Product,
} from "@/lib/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 20;
const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5";

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [offset, setOffset] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();

  const categoryFilter = activeCategory === "All" ? {} : { category: activeCategory };
  const queryParams = { ...categoryFilter, limit: PAGE_SIZE, offset };

  const { data: pageData, isFetching, isLoading } = useListProducts(queryParams, {
    query: {
      queryKey: getListProductsQueryKey(queryParams),
    },
  });

  useEffect(() => {
    if (pageData === undefined) return;
    if (offset === 0) {
      setAllProducts(pageData);
    } else {
      setAllProducts((prev) => [...prev, ...pageData]);
    }
    setHasMore(pageData.length === PAGE_SIZE);
  }, [pageData, offset]);

  const handleCategoryChange = useCallback((category: string) => {
    if (category === activeCategory) return;
    setActiveCategory(category);
    setOffset(0);
    setAllProducts([]);
    setHasMore(true);
  }, [activeCategory]);

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [isFetching, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const allCategories = ["All", ...(categories?.map((c) => c.name) ?? [])];
  const showInitialSkeleton = isLoading && offset === 0;

  return (
    <StoreLayout>
      <div className="container mx-auto px-3 sm:px-4 md:px-8 py-10 md:py-14">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest mb-6 md:mb-8">Collection</h1>

          <div className="flex flex-wrap gap-5 sm:gap-8 border-b border-border overflow-x-auto pb-0">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`pb-3 text-xs sm:text-sm uppercase tracking-widest transition-colors relative whitespace-nowrap
                  ${activeCategory === category ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
                `}
              >
                {category}
                {activeCategory === category && (
                  <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </header>

        {showInitialSkeleton ? (
          <div className={GRID}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/5] w-full rounded-none" />
                <Skeleton className="h-3 w-3/4 rounded-none" />
                <Skeleton className="h-2.5 w-1/3 rounded-none" />
              </div>
            ))}
          </div>
        ) : allProducts.length > 0 ? (
          <>
            <div className={GRID}>
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {isFetching && (
              <div className={`mt-5 ${GRID}`}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[4/5] w-full rounded-none" />
                    <Skeleton className="h-3 w-3/4 rounded-none" />
                    <Skeleton className="h-2.5 w-1/3 rounded-none" />
                  </div>
                ))}
              </div>
            )}

            {!hasMore && allProducts.length > PAGE_SIZE && (
              <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mt-10">
                All pieces shown
              </p>
            )}
          </>
        ) : (
          !isFetching && (
            <div className="py-24 text-center text-muted-foreground font-serif italic text-lg">
              No pieces found in this collection.
            </div>
          )
        )}

        <div ref={sentinelRef} className="h-1" />
      </div>
    </StoreLayout>
  );
}
