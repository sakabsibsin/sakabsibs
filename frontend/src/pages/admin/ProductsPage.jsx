import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, SquarePen, Trash2, Search, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  useInfiniteProducts,
  useDeleteProduct,
  useToggleStock,
} from "@/features/products/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  AlertDialog, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/AlertDialog";
import { formatPrice, cn, getProductThumbnail, getEffectivePrice } from "@/lib/utils";

/* ── Skeleton ─────────────────────────────────────── */
const SkeletonRows = () => (
  <div className="divide-y divide-border/15">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-0 h-[72px]">
        <Skeleton className="h-11 w-11 flex-shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="h-3 w-16 hidden sm:block" />
        <Skeleton className="h-6 w-12" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Page ─────────────────────────────────────────── */
export const ProductsPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [deletingId, setDeletingId]       = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const debouncedSearch  = useDebounce(search, 350);
  const selectedCategory = activeCategory === "ALL" ? "" : activeCategory;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteProducts({
    search: debouncedSearch,
    category: selectedCategory,
  });

  const products   = data?.pages.flatMap((page) => page.products) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  const { data: categories = [] } = useCategories();
  const deleteProduct = useDeleteProduct();
  const toggleStock   = useToggleStock();

  /* ── Infinite scroll observer ─────────────────── */
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

  const handleDelete = (product) => setPendingDelete(product);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    deleteProduct.mutate(pendingDelete.id, {
      onSuccess: () => toast.success("Product deleted"),
      onError:   () => toast.error("Failed to delete"),
      onSettled: () => setDeletingId(null),
    });
    setPendingDelete(null);
  };

  const chips = ["ALL", ...categories.map((c) => c.name)];

  return (
    <div className="flex flex-col h-[calc(100dvh-56px-2rem)] min-h-0 overflow-hidden">
      {/* ── Top bar ──────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-serif text-xl font-light tracking-tight">
              Products
            </h1>
            {!isLoading && (
              <span className="text-xs font-light text-muted-foreground/50 tabular-nums">
                {totalCount} {totalCount === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 h-9 px-5 bg-foreground text-background text-[10px] tracking-[0.22em] uppercase font-medium hover:bg-foreground/85 active:scale-[0.97] transition-all duration-200"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
          Add
        </Link>
      </div>

      {/* ── Search ───────────────────────────────── */}
      <div className="relative mb-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/28 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code or material..."
          className="w-full h-9 pl-10 pr-9 text-[13px] bg-background border border-border/50 focus:border-foreground/20 placeholder:text-muted-foreground/28 focus:outline-none transition-colors duration-200"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/28 hover:text-foreground/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Category tabs ────────────────────────── */}
      {/*
        Active tab: thick bottom border that overlaps the container's
        bottom border via -mb-px, giving a clean underline-tab effect.
      */}
      <div className="cat-tabs-scroll flex gap-1.5 overflow-x-auto pb-1 pt-0 mb-0" style={{ touchAction: 'pan-x' }}>
        {chips.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-shrink-0 h-7 px-3.5 text-[10px] tracking-[0.18em] uppercase font-medium whitespace-nowrap transition-all duration-150",
              activeCategory === cat
                ? "bg-foreground text-background"
                : "text-muted-foreground/55 hover:text-foreground border border-border hover:border-foreground/40",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Products ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 mt-0 pb-20">
        {isLoading ? (
          <SkeletonRows />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <p className="font-serif text-2xl font-light text-muted-foreground/38">
              Failed to load products
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <p className="font-serif text-2xl font-light text-muted-foreground/38">
              {search || activeCategory !== "ALL"
                ? "No products match"
                : "No products yet"}
            </p>
            {!search && activeCategory === "ALL" && (
              <Link
                to="/admin/products/new"
                className="mt-6 text-[10px] tracking-[0.22em] uppercase text-muted-foreground/38 hover:text-foreground border-b border-current pb-px transition-colors duration-200"
              >
                Add your first product
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            {/* sticky thead. -top-px and shadow extend coverage 1px upward to
                eliminate the sub-pixel sliver of scrolled rows that browsers
                briefly render above a top:0 sticky table header. */}
            <thead className="sticky -top-px z-10 bg-background shadow-[0_-1px_0_0_hsl(var(--background))]">
              <tr className="border-b border-border/35">
                <th className="w-[60px] pl-0 pr-2 py-2 text-left">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    IMG
                  </span>
                </th>
                <th className="px-2 py-2 text-left">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    NAME
                  </span>
                </th>
                <th className="w-28 px-2 py-2 text-right hidden sm:table-cell">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    PRICE
                  </span>
                </th>
                <th className="w-[88px] px-2 py-2 text-center">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    STOCK
                  </span>
                </th>
                <th className="w-[76px] pl-2 pr-0 py-2 text-right">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    ACTIONS
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/15">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="group bg-background hover:bg-muted/20 transition-colors duration-150"
                >
                  {/* Thumbnail */}
                  <td className="pl-0 pr-2 py-3">
                    <div className="h-11 w-11 bg-muted/30 overflow-hidden flex-shrink-0">
                      {getProductThumbnail(product) ? (
                        <img
                          src={getProductThumbnail(product)}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 ease-luxury group-hover:scale-[1.07]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted/40" />
                      )}
                    </div>
                  </td>

                  {/* Name + code + badge */}
                  <td className="px-2 py-3 max-w-0">
                    <p className="text-[13px] font-medium leading-tight tracking-tight truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground/70 font-mono">
                        {product.productCode}
                      </span>
                      {product.featured && (
                        <span className="inline-block text-[8px] tracking-[0.1em] uppercase font-semibold text-amber-700/70 bg-amber-50 border border-amber-200/60 px-1.5 py-[2px] leading-none rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-2 py-3 text-right hidden sm:table-cell">
                    <span className="text-[13px] font-medium tabular-nums text-foreground/80">
                      {formatPrice(getEffectivePrice(product))}
                    </span>
                  </td>

                  {/* Stock toggle */}
                  <td className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Switch
                        checked={product.inStock}
                        disabled={toggleStock.isPending && toggleStock.variables?.id === product.id}
                        onCheckedChange={() =>
                          toggleStock.mutate({
                            id: product.id,
                            inStock: !product.inStock,
                          })
                        }
                      />
                      {product.variants?.length > 0 && (
                        <span className="text-[9px] text-muted-foreground/40 tabular-nums leading-none">
                          {`${product.variants.filter((v) => v.inStock !== false).length}/${product.variants.length}`}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="pl-2 pr-0 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground/28 hover:text-foreground/65 transition-colors duration-150"
                        title="Edit"
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="h-7 w-7 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors duration-150 disabled:opacity-25"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Sentinel — invisible trigger for intersection observer */}
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />

        {/* Loading next page — three-dot wave loader, on-brand burgundy */}
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
                transition={{
                  duration: 1.05,
                  repeat: Infinity,
                  delay: i * 0.16,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        {/* End of list */}
        {!hasNextPage && products.length > 0 && !isLoading && (
          <p className="text-center text-xs tracking-[0.2em] uppercase text-muted-foreground/50 py-6">
            All {totalCount} products loaded
          </p>
        )}
      </div>

      <style>{`
        .cat-tabs-scroll::-webkit-scrollbar { display: none; }
        .cat-tabs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{pendingDelete?.name}</span>
            {' '}will be permanently removed from your catalog. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  );
};
