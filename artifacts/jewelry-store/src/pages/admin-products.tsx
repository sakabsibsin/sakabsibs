import { useState, useMemo, useRef, useCallback, useEffect } from "react";
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
} from "@/lib/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const PAGE_SIZE = 20;

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts();

  const toggleStock = useToggleProductStock();
  const deleteProduct = useDeleteProduct();

  const allCategories = ["All", ...(categories?.map((c) => c.name) ?? [])];

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q);
      const matchCategory = activeCategory === "All" || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

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
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleToggleStock = (id: string, inStock: boolean) => {
    toggleStock.mutate(
      { id, data: { inStock } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          toast({ title: "Stock updated" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          toast({ title: "Product deleted" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div>

        {/* Sticky header: title + search + category tabs */}
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 pt-4 pb-0 border-b border-border mb-4">

          {/* Header row */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-xl font-serif tracking-wide leading-tight">Products</h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                {isLoading ? "Loading…" : `${filtered.length} of ${products?.length ?? 0} products`}
              </p>
            </div>
            <Button
              asChild
              className="bg-foreground text-background hover:bg-foreground/90 rounded-none uppercase tracking-widest text-xs h-9 px-5 shrink-0"
            >
              <a href="/admin/products/new">+ Add</a>
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category or product code…"
              className="pl-9 rounded-none border-border bg-card h-9 text-sm"
            />
          </div>

          {/* Category filter tabs */}
          <div className="relative overflow-x-hidden">
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none">
                <div className="h-full w-12 bg-gradient-to-r from-background to-transparent" />
              </div>
            )}
            <div
              ref={tabsRef}
              className="flex items-end gap-0 overflow-x-auto scrollbar-hide"
              style={{ overflowY: "hidden", touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
            >
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    relative shrink-0 pb-2.5 px-4 text-xs uppercase tracking-widest
                    transition-colors duration-200 whitespace-nowrap
                    ${activeCategory === cat ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
                  `}
                >
                  {cat}
                  {activeCategory === cat && (
                    <span className="absolute bottom-[-1px] left-3 right-3 h-[1.5px] bg-foreground" />
                  )}
                </button>
              ))}
              <span className="shrink-0 w-4" aria-hidden="true" />
            </div>
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none">
                <div className="h-full w-12 bg-gradient-to-l from-background to-transparent" />
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[56px] pl-[5px] pr-[5px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-11 w-11" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-serif italic">
                      {search || activeCategory !== "All"
                        ? "No products match your search."
                        : "No products yet. Add your first piece."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-11 w-11 bg-muted border border-border overflow-hidden shrink-0">
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[160px]">
                        <span className="line-clamp-2 text-sm">{product.name}</span>
                        {product.featured && (
                          <span className="mt-1 block text-[10px] uppercase tracking-widest bg-muted px-1.5 py-0.5 border border-border w-fit">
                            Featured
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs font-mono">
                        {product.productCode}
                      </TableCell>
                      <TableCell className="hidden md:table-cell capitalize text-muted-foreground text-sm">
                        {product.category}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        ₹{product.price.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.inStock}
                          onCheckedChange={(checked) => handleToggleStock(product.id, checked)}
                          disabled={toggleStock.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-none border-border h-8 w-8"
                            onClick={() => setLocation(`/admin/products/${product.id}/edit`)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="rounded-none border-border text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {!isLoading && filtered.length > PAGE_SIZE && (
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest">
            Showing first {PAGE_SIZE} results — refine your search to narrow down.
          </p>
        )}

      </div>
    </AdminLayout>
  );
}
