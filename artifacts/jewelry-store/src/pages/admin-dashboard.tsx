import { Link, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout";
import {
  useGetProductStats,
  useListProducts,
  useToggleProductStock,
  useDeleteProduct,
  getListProductsQueryKey,
  getGetProductStatsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";
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

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetProductStats();
  const { data: products, isLoading: productsLoading } = useListProducts();

  const toggleStock = useToggleProductStock();
  const deleteProduct = useDeleteProduct();

  const handleToggleStock = (id: number, inStock: boolean) => {
    toggleStock.mutate(
      { id, data: { inStock } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          toast({ title: "Stock updated", description: "Product stock status has been updated." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          toast({ title: "Product deleted", description: "The product has been removed." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif tracking-wide mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your jewelry catalog.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Products", value: stats?.total },
            { label: "In Stock", value: stats?.inStock },
            { label: "Out of Stock", value: stats?.outOfStock },
            { label: "Featured", value: stats?.featured },
          ].map((stat, i) => (
            <div key={i} className="bg-card p-6 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-serif">{stat.value ?? 0}</p>
              )}
            </div>
          ))}
        </div>

        {/* Products Table */}
        <div className="bg-card border border-border">
          <div className="p-4 md:p-6 border-b border-border flex justify-between items-center gap-4 flex-wrap">
            <h2 className="text-xl font-serif tracking-wide">All Products</h2>
            <Button asChild className="bg-foreground text-background hover:bg-foreground/90 rounded-none uppercase tracking-widest text-xs h-10 px-6">
              <Link href="/admin/products/new">Add Product</Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[64px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Code</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-12 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-serif italic">
                      No products found. Add your first piece.
                    </TableCell>
                  </TableRow>
                ) : (
                  products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-12 w-12 bg-muted border border-border overflow-hidden shrink-0">
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[140px]">
                        <span className="line-clamp-2">{product.name}</span>
                        {product.featured && (
                          <span className="ml-0 mt-1 block text-[10px] uppercase tracking-widest bg-muted px-2 py-0.5 border border-border w-fit">
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
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.inStock}
                            onCheckedChange={(checked) => handleToggleStock(product.id, checked)}
                            disabled={toggleStock.isPending}
                          />
                          <span className="text-xs uppercase tracking-widest text-muted-foreground hidden lg:block">
                            {product.inStock ? "In Stock" : "Out"}
                          </span>
                        </div>
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
      </div>
    </AdminLayout>
  );
}
