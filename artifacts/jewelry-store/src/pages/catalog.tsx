import { useState } from "react";
import { StoreLayout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import {
  useListProducts,
  useListCategories,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="container mx-auto px-4 md:px-8 py-16">
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-serif tracking-widest mb-12">Collection</h1>

          <div className="flex flex-wrap gap-8 border-b border-border">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`pb-4 text-sm uppercase tracking-widest transition-colors relative
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full rounded-none" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2 rounded-none" />
                  <Skeleton className="h-3 w-1/4 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center text-muted-foreground font-serif italic text-xl">
            No pieces found in this collection.
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
