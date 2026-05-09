import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Edit, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout";
import {
  useListProducts,
  useListCategories,
  useToggleProductStock,
  useDeleteProduct,
  getListProductsQueryKey,
  getGetProductStatsQueryKey,
  type Product,
} from "@/lib/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 30;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Column widths ─────────────────────────────────────────────────────────────
// Byte-for-byte identical between header [B] and every data row in [C].
const COL = {
  thumb: "w-11 shrink-0",
  name:  "flex-1 min-w-0",
  code:  "w-[70px] shrink-0 hidden sm:block",
  cat:   "w-[88px] shrink-0 hidden md:block",
  price: "w-[68px] shrink-0",
  stock: "w-[44px] shrink-0",
  acts:  "w-[64px] shrink-0",
};

// Shared flex row — verbatim in both [B] header and [C] data rows
const ROW = "flex items-center gap-2 sm:gap-3 px-4";

function RowSkeleton() {
  return (
    <div className={`${ROW} py-2.5 border-b border-border/50`}>
      <div className={COL.thumb}><Skeleton className="h-10 w-10" /></div>
      <div className={COL.name}><Skeleton className="h-3.5 w-36" /></div>
      <div className={COL.code}><Skeleton className="h-3.5 w-12" /></div>
      <div className={COL.cat}><Skeleton className="h-3.5 w-16" /></div>
      <div className={COL.price}><Skeleton className="h-3.5 w-14" /></div>
      <div className={`${COL.stock} flex items-center`}><Skeleton className="h-5 w-9" /></div>
      <div className={`${COL.acts} flex items-center justify-end gap-1`}>
        <Skeleton className="h-7 w-7" /><Skeleton className="h-7 w-7" />
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [searchInput, setSearchInput]       = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [offset, setOffset]                 = useState(0);
  const [allProducts, setAllProducts]       = useState<Product[]>([]);
  const [hasMore, setHasMore]               = useState(true);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ── filterKey — the core fix for stale-cache category switching ──────────────
  // The accumulation effect depends on [pageData, offset]. When switching back to
  // a previously-visited category, React Query returns the SAME cached object
  // reference immediately. If offset is also still 0, neither dep changes, so the
  // effect never fires, allProducts stays [], and a false empty-state is shown.
  //
  // Fix: include filterKey in the accumulation effect deps. filterKey increments on
  // every category/search change, guaranteeing the accumulation effect always runs
  // when the filter changes — regardless of whether pageData or offset changed.
  const [filterKey, setFilterKey] = useState(0);

  const tabsRef     = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);

  // ── Stable refs for observer/scroll callbacks — never cause them to rebuild ───
  const isFetchingRef = useRef(false);
  const hasMoreRef    = useRef(true);
  const triggeredRef  = useRef(false); // prevents observer+scroll double-fire

  // ── allProductsRef — replaces dataReadyRef with a single clean guard ──────────
  // tryLoadMore checks allProductsRef.current.length > 0 instead of a separate
  // boolean. This blocks load-more in ALL cases where the container is empty:
  //   • initial mount (no data yet)
  //   • mid-reset transition (old products wiped, new page 0 not yet rendered)
  //   • genuine empty search/category (hasMore=false also blocks, belt+suspenders)
  //
  // The ref is written every render so it always reflects the current list length
  // without needing to be in any effect's dependency array.
  const allProductsRef = useRef<Product[]>([]);
  allProductsRef.current = allProducts;

  const queryClient = useQueryClient();
  const { toast }   = useToast();
  const [, setLocation] = useLocation();

  const search = useDebounce(searchInput, 250);

  const { data: categories } = useListCategories();
  const toggleStock   = useToggleProductStock();
  const deleteProduct = useDeleteProduct();

  const queryParams = {
    ...(activeCategory !== "All" ? { category: activeCategory } : {}),
    ...(search ? { search } : {}),
    limit: PAGE_SIZE,
    offset,
  };

  const { data: pageData, isFetching, isLoading } = useListProducts(queryParams, {
    query: { queryKey: getListProductsQueryKey(queryParams) },
  });

  // Keep refs in sync with React state each render
  useEffect(() => { isFetchingRef.current = isFetching; }, [isFetching]);
  useEffect(() => { hasMoreRef.current    = hasMore;    }, [hasMore]);
  // Unlock the per-cycle trigger guard once the current fetch completes
  useEffect(() => { if (!isFetching) triggeredRef.current = false; }, [isFetching]);

  // ── Load-more (stable ref-wrapper — safe inside empty-dep effects) ────────────
  const tryLoadMoreRef = useRef(() => {});
  tryLoadMoreRef.current = () => {
    if (
      allProductsRef.current.length === 0 || // page 0 not yet rendered (initial / reset)
      isFetchingRef.current               || // fetch already in flight
      !hasMoreRef.current                 || // no more pages
      triggeredRef.current                   // already triggered this fetch cycle
    ) return;
    triggeredRef.current = true;
    setOffset((prev) => prev + PAGE_SIZE);
  };

  // ── Accumulate pages ──────────────────────────────────────────────────────────
  // filterKey in deps is essential: when returning to a cached category, pageData
  // and offset may both be unchanged (same reference, same 0), so without filterKey
  // this effect would silently skip re-populating allProducts after a reset.
  useEffect(() => {
    if (!pageData) return;
    const incoming = pageData.products;
    if (offset === 0) {
      setAllProducts(incoming);
    } else {
      setAllProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...incoming.filter((p) => !seen.has(p.id))];
      });
    }
    setHasMore(pageData.hasMore);
  }, [pageData, offset, filterKey]); // ← filterKey ensures this always fires on filter change

  // ── Reset on filter change ────────────────────────────────────────────────────
  // Sets filterKey so the accumulation effect fires even for cached responses.
  // Sets allProducts=[] immediately so allProductsRef.current.length===0 blocks
  // load-more until page 0 of the new filter is rendered.
  useEffect(() => {
    triggeredRef.current = false;
    setFilterKey((k) => k + 1); // ← invalidates stale cache hit in accumulation
    setOffset(0);
    setAllProducts([]);
    setHasMore(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [search, activeCategory]);

  // ── IntersectionObserver — set up ONCE, never recreated ──────────────────────
  useEffect(() => {
    const sentinel  = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) tryLoadMoreRef.current(); },
      { root: container, rootMargin: "350px" }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []); // intentionally empty — reads mutable state from refs

  // ── Scroll fallback — catches sentinel-already-visible edge cases ─────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 400) tryLoadMoreRef.current();
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []); // intentionally empty

  // ── Category tab scroll-fade indicators ──────────────────────────────────────
  const updateTabScroll = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateTabScroll();
    el.addEventListener("scroll", updateTabScroll, { passive: true });
    const ro = new ResizeObserver(updateTabScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateTabScroll); ro.disconnect(); };
  }, [updateTabScroll, categories]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const handleToggleStock = (id: string, inStock: boolean) => {
    toggleStock.mutate({ id, data: { inStock } }, {
      onSuccess: () => {
        setAllProducts((prev) => prev.map((p) => (p.id === id ? { ...p, inStock } : p)));
        queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
        toast({ title: "Stock updated" });
      },
      onError: () => toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" }),
    });
  };

  const handleDelete = (id: string) => {
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        setAllProducts((prev) => prev.filter((p) => p.id !== id));
        queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Product deleted" });
      },
      onError: () => toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" }),
    });
  };

  const allCategories = ["All", ...(categories?.map((c) => c.name) ?? [])];
  const total = pageData?.total;

  // Empty state: only show after the filter response has settled
  // isLoading = true on initial mount; isFetching = true whenever a fetch is in flight.
  // We only show "empty" when: not loading, not fetching, and allProducts is still [].
  const showEmpty = !isLoading && !isFetching && allProducts.length === 0;

  return (
    <AdminLayout fullHeight>

      {/*
       * ══════════════════════════════════════════════════════════════════
       *  WORKSPACE ARCHITECTURE (AdminLayout fullHeight):
       *    h-[100dvh] overflow-hidden flex flex-col
       *      header   shrink-0  h-14
       *      main     flex-1 overflow-hidden flex flex-col
       *        [A] Toolbar    shrink-0
       *        [B] Col header shrink-0  ← never scrolls
       *        [C] Row list   flex-1 min-h-0 overflow-y-auto ← only scroll zone
       *
       *  No <table>. No sticky. No z-index.
       *  [B] and [C] share exact ROW class + COL widths → pixel-perfect alignment.
       * ══════════════════════════════════════════════════════════════════
       */}

      {/* ── [A] TOOLBAR ────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-background border-b border-border px-4 pt-3 pb-0">

        {/* Title + count + Add */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-base font-serif tracking-wide leading-none shrink-0">Products</h1>
            {!isLoading && total !== undefined && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {allProducts.length}/{total}
              </span>
            )}
          </div>
          <Button
            asChild
            className="bg-foreground text-background hover:bg-foreground/90 rounded-none uppercase tracking-widest text-[11px] h-8 px-4 shrink-0"
          >
            <a href="/admin/products/new">+ Add</a>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, code or material…"
            className="pl-9 pr-3 rounded-none border-border bg-background h-9 text-sm placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Category tabs */}
        <div className="relative -mx-4 overflow-hidden">
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none w-6 bg-gradient-to-r from-background to-transparent" />
          )}
          <div
            ref={tabsRef}
            className="flex items-end overflow-x-auto px-4"
            style={{ overflowY: "hidden", scrollbarWidth: "none", touchAction: "pan-x" }}
          >
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={[
                  "relative shrink-0 pb-2.5 px-3 text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors duration-150",
                  activeCategory === cat
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70",
                ].join(" ")}
              >
                {cat}
                {activeCategory === cat && (
                  <span className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-foreground rounded-full" />
                )}
              </button>
            ))}
            <span className="shrink-0 w-3" aria-hidden />
          </div>
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none w-6 bg-gradient-to-l from-background to-transparent" />
          )}
        </div>
      </div>

      {/* ── [B] COLUMN HEADER ─────────────────────────────────────────── */}
      <div className="shrink-0 bg-background border-b border-border">
        <div className={`${ROW} py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium select-none`}>
          <div className={COL.thumb}>Img</div>
          <div className={COL.name}>Name</div>
          <div className={COL.code}>Code</div>
          <div className={COL.cat}>Category</div>
          <div className={COL.price}>Price</div>
          <div className={`${COL.stock} flex items-center`}>Stock</div>
          <div className={`${COL.acts} flex items-center justify-end`}>Actions</div>
        </div>
      </div>

      {/* ── [C] SCROLLABLE ROW LIST ───────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
      >
        {/* Initial load skeletons (only on first mount, not on category switch) */}
        {isLoading && offset === 0 && allProducts.length === 0 &&
          Array.from({ length: 12 }).map((_, i) => <RowSkeleton key={i} />)
        }

        {/* Category-switch transition: show skeletons while fetching new filter */}
        {isFetching && !isLoading && allProducts.length === 0 &&
          Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={`tr-${i}`} />)
        }

        {/* Empty state — only when fetch fully settled and truly no results */}
        {showEmpty && (
          <div className="flex items-center justify-center h-48">
            <p className="font-serif italic text-sm text-muted-foreground text-center px-6">
              {search || activeCategory !== "All"
                ? "No products match your search."
                : "No products yet. Add your first piece."}
            </p>
          </div>
        )}

        {/* ── Product rows ──────────────────────────────────────────── */}
        {allProducts.map((product) => (
          <div
            key={product.id}
            className={`${ROW} py-2.5 border-b border-border/50 hover:bg-muted/20 transition-colors`}
          >
            {/* Thumbnail */}
            <div className={COL.thumb}>
              <div className="h-10 w-10 bg-muted border border-border overflow-hidden">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-full w-full bg-muted/60" />
                )}
              </div>
            </div>

            {/* Name */}
            <div className={COL.name}>
              <p className="text-[13px] font-medium leading-snug line-clamp-2">
                {product.name}
              </p>
              {product.featured && (
                <span className="mt-0.5 inline-block text-[8px] uppercase tracking-widest bg-muted border border-border px-1.5 py-px leading-none">
                  Featured
                </span>
              )}
            </div>

            {/* Code */}
            <div className={`${COL.code} text-xs font-mono text-muted-foreground tabular-nums`}>
              {product.productCode}
            </div>

            {/* Category */}
            <div className={`${COL.cat} text-xs text-muted-foreground capitalize truncate`}>
              {product.category}
            </div>

            {/* Price */}
            <div className={`${COL.price} text-xs whitespace-nowrap tabular-nums`}>
              ₹{product.price.toLocaleString("en-IN")}
            </div>

            {/* Stock toggle */}
            <div className={`${COL.stock} flex items-center`}>
              <Switch
                checked={product.inStock}
                onCheckedChange={(checked) => handleToggleStock(product.id, checked)}
                disabled={toggleStock.isPending}
                className="scale-90"
              />
            </div>

            {/* Actions */}
            <div className={`${COL.acts} flex items-center justify-end gap-1`}>
              <Button
                variant="outline"
                size="icon"
                className="rounded-none border-border h-7 w-7 shrink-0"
                onClick={() => setLocation(`/admin/products/${product.id}/edit`)}
              >
                <Edit className="h-3 w-3" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-none border-border text-destructive hover:bg-destructive hover:text-destructive-foreground h-7 w-7 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-none border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif">Delete Product</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{product.name}"? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none uppercase tracking-widest text-xs">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(product.id)}
                      className="rounded-none uppercase tracking-widest text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {/* Load-more skeletons — inline, no layout shift */}
        {isFetching && offset > 0 &&
          Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={`sk-${i}`} />)
        }

        {/* IntersectionObserver sentinel */}
        <div ref={sentinelRef} className="h-px" aria-hidden />

        {/* End-of-list */}
        {!hasMore && allProducts.length > PAGE_SIZE && (
          <p className="text-center py-5 text-[10px] uppercase tracking-widest text-muted-foreground border-t border-border/50">
            All {total} products loaded
          </p>
        )}
      </div>

    </AdminLayout>
  );
}
