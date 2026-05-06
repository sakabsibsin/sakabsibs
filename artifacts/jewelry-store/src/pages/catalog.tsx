import { useState } from "react";
import { StoreLayout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import {
  useListProducts,
  useListCategories,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5";
const SKELETON_COUNT = 10;

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: categories } = useListCategories();

  const queryParams = activeCategory === "All" ? {} : { category: activeCategory };

  const { data: products, isLoading } = useListProducts(queryParams, {
    query: {
      queryKey: getListProductsQueryKey(queryParams),
    },
  });

  const allCategories = ["All", ...(categories?.map((c) => c.name) ?? [])];

  return (
    <StoreLayout>
      <div className="container mx-auto px-3 sm:px-4 md:px-8 py-10 md:py-14">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest mb-6 md:mb-8">Collection</h1>

          <div className="flex flex-wrap gap-5 sm:gap-8 border-b border-border overflow-x-auto pb-0 scrollbar-none">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
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

        {isLoading ? (
          <div className={GRID}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/5] w-full rounded-none" />
                <Skeleton className="h-3 w-3/4 rounded-none" />
                <Skeleton className="h-2.5 w-1/3 rounded-none" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className={GRID}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center text-muted-foreground font-serif italic text-lg">
            No pieces found in this collection.
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
