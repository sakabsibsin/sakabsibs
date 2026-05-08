import { Link } from "wouter";
import { Package, PlusCircle, Tag, Settings, ArrowRight } from "lucide-react";
import { AdminLayout } from "@/components/layout";
import { useGetProductStats, useListProducts } from "@/lib/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProductStats();
  const { data: recentData, isLoading: productsLoading } = useListProducts({ limit: 5 });

  const products = recentData?.products;

  const statCards = [
    { label: "Total Products", value: stats?.total },
    { label: "In Stock", value: stats?.inStock },
    { label: "Out of Stock", value: stats?.outOfStock },
    { label: "Featured", value: stats?.featured },
  ];

  const quickLinks = [
    { href: "/admin/products/new", icon: PlusCircle, label: "Add Product", desc: "Add a new piece to the catalog" },
    { href: "/admin/products", icon: Package, label: "Manage Products", desc: "Search, filter, edit and delete products" },
    { href: "/admin/categories", icon: Tag, label: "Categories", desc: "Manage jewelry categories" },
    { href: "/admin/settings", icon: Settings, label: "Settings", desc: "WhatsApp number and store settings" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif tracking-wide mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your Aurum jewelry catalog.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-card p-5 md:p-6 border border-border">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-serif">{stat.value ?? 0}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}>
                <div className="flex items-start gap-4 p-5 border border-border bg-card hover:border-foreground/30 transition-colors cursor-pointer group">
                  <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0 group-hover:text-foreground transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium tracking-wide">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent products preview */}
        <div className="bg-card border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-serif tracking-wide">Recent Products</h2>
            <Link href="/admin/products" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-10 w-10 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))
            ) : !products?.length ? (
              <div className="px-5 py-8 text-center text-muted-foreground font-serif italic text-sm">
                No products yet. Add your first piece.
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-10 w-10 bg-muted border border-border overflow-hidden shrink-0">
                    {product.images?.[0] && (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{product.category} · {product.productCode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm whitespace-nowrap">₹{product.price.toLocaleString("en-IN")}</p>
                    <p className={`text-[10px] uppercase tracking-widest mt-0.5 ${product.inStock ? "text-muted-foreground" : "text-destructive"}`}>
                      {product.inStock ? "In Stock" : "Sold Out"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
