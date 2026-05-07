import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoreLayout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import {
  useListProducts,
  useListCategories,
  getListProductsQueryKey,
  type Product,
} from "@/lib/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;
const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5";

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [offset, setOffset] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

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

  // Scroll active tab into view when category changes
  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;
    const active = container.querySelector("[data-active='true']") as HTMLElement;
    if (active) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const offset = activeRect.left - containerRect.left - containerRect.width / 2 + activeRect.width / 2;
      container.scrollBy({ left: offset, behavior: "smooth" });
    }
  }, [activeCategory]);

  const updateScrollState = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, categories]);

  const scrollTabs = (dir: "left" | "right") => {
    tabsRef.current?.scrollBy({ left: dir === "right" ? 160 : -160, behavior: "smooth" });
  };

  // Intercept vertical wheel/trackpad events and redirect to horizontal scroll.
  // Must be non-passive so we can call preventDefault() to stop page scroll.
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      // If the gesture is already clearly horizontal, let it pass through
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [isFetching, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
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
        <header className="md:mb-12 mb-[20px]">
          <h1 className="text-3xl md:text-4xl font-serif tracking-widest md:mb-8 mb-[20px]">Collection</h1>

          {/* Category scroll strip */}
          <div className="relative border-b border-border overflow-x-hidden">

            {/* Left fade + arrow */}
            <div
              className={`absolute left-0 top-0 bottom-[1px] z-10 flex items-center transition-opacity duration-300 ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent w-16" />
              <button
                onClick={() => scrollTabs("left")}
                className="relative z-10 hidden md:flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable tabs */}
            <div
              ref={tabsRef}
              className="flex items-end gap-0 overflow-x-auto scrollbar-hide"
              style={{
                overflowY: "hidden",
                touchAction: "pan-x",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {allCategories.map((category) => (
                <button
                  key={category}
                  data-active={activeCategory === category}
                  onClick={() => handleCategoryChange(category)}
                  className={`
                    relative shrink-0 pb-3 px-4 text-xs sm:text-sm uppercase tracking-widest
                    transition-colors duration-200 whitespace-nowrap
                    ${activeCategory === category
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {category}
                  {activeCategory === category && (
                    <span className="absolute bottom-[-1px] left-3 right-3 h-[1.5px] bg-foreground rounded-full" />
                  )}
                </button>
              ))}
              {/* Trailing spacer so last item isn't flush against the fade */}
              <span className="shrink-0 w-4" aria-hidden="true" />
            </div>

            {/* Right fade + arrow */}
            <div
              className={`absolute right-0 top-0 bottom-[1px] z-10 flex items-center justify-end transition-opacity duration-300 ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-background via-background/80 to-transparent w-16" />
              <button
                onClick={() => scrollTabs("right")}
                className="relative z-10 hidden md:flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground transition-colors mr-0.5"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
