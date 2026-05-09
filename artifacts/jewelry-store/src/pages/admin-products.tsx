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

// Column widths — must be identical between the header row and every data row
// so the two sibling divs (header outside scroll, rows inside scroll) align.
const COL = {
  thumb: "w-11 shrink-0",
  name:  "flex-1 min-w-0",
  code:  "w-[76px] shrink-0 hidden sm:block",
  cat:   "w-[90px] shrink-0 hidden md:block",
  price: "w-[88px] shrink-0",
  stock: "w-[58px] shrink-0",
  acts:  "w-[76px] shrink-0",
};

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60">
      <div className={COL.thumb}><Skeleton className="h-10 w-10" /></div>
      <div className={COL.name}><Skeleton className="h-4 w-40" /></div>
      <div className={`${COL.code} hidden sm:block`}><Skeleton className="h-4 w-14" /></div>
      <div className={`${COL.cat} hidden md:block`}><Skeleton className="h-4 w-18" /></div>
      <div className={COL.price}><Skeleton className="h-4 w-16" /></div>
      <div className={COL.stock}><Skeleton className="h-5 w-9" /></div>
      <div className={`${COL.acts} flex justify-end gap-1`}>
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [offset, setOffset] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tabsRef  = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const search = useDebounce(searchInput, 250);

  const { data: categories } = useListCategories();
  const toggleStock  = useToggleProductStock();
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

  // Accumulate pages
  useEffect(() => {
    if (pageData === undefined) return;
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
  }, [pageData, offset]);

  // Reset on filter change
  useEffect(() => {
    setOffset(0);
    setAllProducts([]);
    setHasMore(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [search, activeCategory]);

  // Infinite scroll trigger
  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) setOffset((prev) => prev + PAGE_SIZE);
  }, [isFetching, hasMore]);

  useEffect(() => {
    const sentinel  = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { root: container, rootMargin: "200px" }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [loadMore]);

  // Category tab scroll-fade indicators
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
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, [updateScrollState, categories]);

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

  return (
    <AdminLayout fullHeight>

      {/*
       * ══════════════════════════════════════════════════
       *  WORKSPACE ARCHITECTURE
       *  AdminLayout renders: flex flex-col h-[100dvh] overflow-hidden
       *    └─ admin navbar  (shrink-0, h-14)
       *    └─ <main>        (flex-1 overflow-hidden flex flex-col)
       *         ├─ [A] Toolbar    — shrink-0  → never scrolls
       *         ├─ [B] Col header — shrink-0  → never scrolls
       *         └─ [C] Row list   — flex-1 min-h-0 overflow-y-auto → ONLY thing that scrolls
       *
       *  No <table>, no sticky, no z-index fights.
       *  [A] and [B] are plain flex siblings above [C].
       *  Column widths are kept in COL constants so [B] and [C] rows always align.
       * ══════════════════════════════════════════════════
       */}

      {/* ── [A] TOOLBAR ─────────────────────────────────── */}
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
            className="pl-9 pr-3 rounded-none border-border bg-background h-9 text-sm placeholder:text-muted-foreground/60 border-t-[1px] border-r-[1px] border-b-[1px] border-l-[1px] pt-[5px] pb-[5px]"
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

      {/* ── [B] COLUMN HEADER — sibling of scroll area, never inside it ─── */}
      <div className="shrink-0 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium select-none">
          <div className={COL.thumb}>Img</div>
          <div className={COL.name}>Name</div>
          <div className={COL.code}>Code</div>
          <div className={COL.cat}>Category</div>
          <div className={COL.price}>Price</div>
          <div className={COL.stock}>Stock</div>
          <div className={`${COL.acts} text-right`}>Actions</div>
        </div>
      </div>

      {/* ── [C] SCROLLABLE ROW LIST — the ONLY element that scrolls ──────── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
      >
        {/* Initial loading skeletons */}
        {isLoading && offset === 0 && (
          Array.from({ length: 12 }).map((_, i) => <RowSkeleton key={i} />)
        )}

        {/* Empty state */}
        {!isLoading && allProducts.length === 0 && !isFetching && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="font-serif italic text-sm text-muted-foreground">
              {search || activeCategory !== "All"
                ? "No products match your search."
                : "No products yet. Add your first piece."}
            </p>
          </div>
        )}

        {/* Product rows */}
        {allProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 hover:bg-muted/20 transition-colors"
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
                  />
                ) : (
                  <div className="h-full w-full bg-muted/60" />
                )}
              </div>
            </div>

            {/* Name */}
            <div className={COL.name}>
              <p className="text-sm font-medium leading-tight line-clamp-2">{product.name}</p>
              {product.featured && (
                <span className="mt-0.5 inline-block text-[8px] uppercase tracking-widest bg-muted border border-border px-1.5 py-px leading-none">
                  Featured
                </span>
              )}
            </div>

            {/* Code */}
            <div className={`${COL.code} text-xs font-mono text-muted-foreground`}>
              {product.productCode}
            </div>

            {/* Category */}
            <div className={`${COL.cat} text-sm text-muted-foreground capitalize`}>
              {product.category}
            </div>

            {/* Price */}
            <div className={`${COL.price} text-sm whitespace-nowrap`}>
              ₹{product.price.toLocaleString("en-IN")}
            </div>

            {/* Stock toggle */}
            <div className={COL.stock}>
              <Switch
                checked={product.inStock}
                onCheckedChange={(checked) => handleToggleStock(product.id, checked)}
                disabled={toggleStock.isPending}
              />
            </div>

            {/* Actions */}
            <div className={`${COL.acts} flex justify-end gap-1`}>
              <Button
                variant="outline"
                size="icon"
                className="rounded-none border-border h-8 w-8 shrink-0"
                onClick={() => setLocation(`/admin/products/${product.id}/edit`)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-none border-border text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
                    <AlertDialogCancel className="rounded-none uppercase tracking-widest text-xs">
                      Cancel
                    </AlertDialogCancel>
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

        {/* Load-more skeletons — appear inline, no layout shift */}
        {isFetching && offset > 0 && (
          Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={`sk-${i}`} />)
        )}

        {/* IntersectionObserver sentinel */}
        <div ref={sentinelRef} className="h-px" aria-hidden />

        {/* End-of-list message */}
        {!hasMore && allProducts.length > PAGE_SIZE && (
          <p className="text-center py-5 text-[10px] uppercase tracking-widest text-muted-foreground border-t border-border/60">
            All {total} products loaded
          </p>
        )}
      </div>

    </AdminLayout>
  );
}
