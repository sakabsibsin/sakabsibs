import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, SquarePen, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  useProducts,
  useDeleteProduct,
  useToggleStock,
} from "@/features/products/hooks";
import { useCategories } from "@/features/categories/hooks";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
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
  const { data, isLoading } = useProducts({ limit: 200 });
  const { data: categories = [] } = useCategories();
  const allProducts = data?.products ?? [];
  const deleteProduct = useDeleteProduct();
  const toggleStock = useToggleStock();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [deletingId, setDeletingId] = useState(null);

  const filtered = allProducts.filter((p) => {
    const matchCat =
      activeCategory === "ALL" ||
      p.category.toLowerCase() === activeCategory.toLowerCase();
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.productCode || "").toLowerCase().includes(q) ||
      (p.material || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleDelete = (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    setDeletingId(product.id);
    deleteProduct.mutate(product.id, {
      onSuccess: () => toast.success("Product deleted"),
      onError: () => toast.error("Failed to delete"),
      onSettled: () => setDeletingId(null),
    });
  };

  const chips = ["ALL", ...categories.map((c) => c.name)];

  return (
    <div className="flex flex-col h-[calc(100vh-56px-1rem)] min-h-0 overflow-hidden">
      {/* ── Top bar ──────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-serif text-xl font-light tracking-tight">
            Products
          </h1>
          {data && (
            <span className="text-xs font-light text-muted-foreground/50 tabular-nums">
              {filtered.length}/{data.total}
            </span>
          )}
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
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/28 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code or material..."
          className="w-full h-10 pl-10 pr-9 text-[13px] bg-background border border-border/50 focus:border-foreground/20 placeholder:text-muted-foreground/28 focus:outline-none transition-colors duration-200"
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
      <div className="cat-tabs-scroll flex overflow-x-auto border-b border-border/35 mb-0">
        {chips.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-shrink-0 px-4 pb-3 pt-0.5 text-[10px] tracking-[0.2em] uppercase font-medium whitespace-nowrap transition-all duration-200 -mb-px border-b-[1.5px]",
              activeCategory === cat
                ? "text-foreground border-foreground"
                : "text-muted-foreground/38 border-transparent hover:text-muted-foreground/65",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Products ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 mt-0">
        {isLoading ? (
          <SkeletonRows />
        ) : filtered.length === 0 ? (
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
            {/* sticky: h-14 = 56 px (AdminSidebar height) */}
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
              <tr className="border-b border-border/35">
                <th className="w-[60px] pl-0 pr-2 py-3.5 text-left">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    IMG
                  </span>
                </th>
                <th className="px-2 py-3.5 text-left">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    NAME
                  </span>
                </th>
                <th className="w-28 px-2 py-3.5 text-right hidden sm:table-cell">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    PRICE
                  </span>
                </th>
                <th className="w-[88px] px-2 py-3.5 text-center">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    STOCK
                  </span>
                </th>
                <th className="w-[76px] pl-2 pr-0 py-3.5 text-right">
                  <span className="text-[9px] tracking-[0.28em] uppercase font-medium text-muted-foreground/70">
                    ACTIONS
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/15">
              {filtered.map((product) => (
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
                      <span className="text-[10px] text-muted-foreground/35 font-light">
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
                        onCheckedChange={() =>
                          toggleStock.mutate({
                            id: product.id,
                            inStock: !product.inStock,
                          })
                        }
                      />
                      {product.variants?.length > 0 && (
                        <span className="text-[9px] text-muted-foreground/40 tabular-nums leading-none">
                          {!product.inStock
                            ? 'offline'
                            : `${product.variants.filter((v) => v.inStock !== false).length}/${product.variants.length}`}
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
      </div>

      <style>{`
        .cat-tabs-scroll::-webkit-scrollbar { display: none; }
        .cat-tabs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
