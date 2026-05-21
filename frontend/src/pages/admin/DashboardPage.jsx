import { Link } from 'react-router-dom';
import { Package, CheckCircle2, XCircle, Star, Plus, Tag, Settings, TrendingUp } from 'lucide-react';
import { Breadcrumb } from '@/components/admin/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProductStats, useProducts } from '@/features/products/hooks';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  { label: 'Categories',  sub: 'Organise collections',   to: '/admin/categories',   icon: Tag,      primary: false },
  { label: 'All Products', sub: 'Manage your catalog',    to: '/admin/products',     icon: Package,  primary: false },
  { label: 'Settings',    sub: 'WhatsApp & password',     to: '/admin/settings',     icon: Settings, primary: false },
  { label: 'Add Product',  sub: 'Create a new listing',   to: '/admin/products/new', icon: Plus,     primary: true  },

];

// Stale-while-revalidate: show cached data instantly on remount,
// kick off a background refetch, swap in fresh data when it arrives.
const SWR = { refetchOnMount: 'always' };

export const DashboardPage = () => {
  const { data: stats, isLoading: statsLoading } = useProductStats(SWR);
  const { data: outOfStockData } = useProducts({ anyOutOfStock: true, limit: 50 }, SWR);

  const demandCount = (outOfStockData?.products ?? []).filter((p) => {
    const variantDemand = (p.variants ?? []).some((v) => (v.demandCount ?? 0) > 0 && v.inStock === false);
    return (p.demandCount ?? 0) > 0 || variantDemand;
  }).length;

  const STATS = [
    { label: 'Total Products', value: stats?.total,      icon: Package,      accent: false },
    { label: 'In Stock',       value: stats?.inStock,    icon: CheckCircle2, accent: false },
    { label: 'Out of Stock',   value: stats?.outOfStock, icon: XCircle,      accent: (stats?.outOfStock ?? 0) > 0 },
    { label: 'Featured',       value: stats?.featured,   icon: Star,         accent: false },
  ];

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-serif tracking-wide mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your accessories catalog.</p>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className={cn(
              'bg-card p-5 border',
              accent ? 'border-border border-l-2 border-l-red-300' : 'border-border'
            )}
          >
            <Icon className="h-4 w-4 text-muted-foreground/40 mb-3" />
            {statsLoading ? (
              <Skeleton className="h-8 w-12 mb-1" />
            ) : (
              <p className="text-3xl font-serif mb-1">{value ?? 0}</p>
            )}
            <p className="text-xs text-muted-foreground font-light">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ label, sub, to, icon: Icon, primary }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'group flex flex-col gap-3 p-4 border transition-all duration-200',
                primary
                  ? 'bg-foreground text-background border-foreground hover:bg-foreground/90'
                  : 'bg-card border-border hover:border-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', primary ? 'text-background/70' : 'text-muted-foreground')} />
              <div>
                <p className={cn('text-sm font-medium', primary ? 'text-background' : '')}>{label}</p>
                <p className={cn('text-xs mt-0.5', primary ? 'text-background/60' : 'text-muted-foreground')}>{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Restock Demand quick link ────────────────────── */}
      <Link
        to="/admin/restock"
        className="group flex items-center justify-between w-full border border-border bg-card hover:border-foreground/40 hover:bg-muted/20 transition-all duration-200 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
          <div>
            <p className="text-sm font-medium">Restock Demand</p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">
              {demandCount > 0
                ? `${demandCount} product${demandCount > 1 ? 's' : ''} with customer interest`
                : 'Track which out-of-stock products customers want'}
            </p>
          </div>
        </div>
        <span className="text-muted-foreground/35 group-hover:text-foreground/60 transition-colors text-sm">→</span>
      </Link>
    </div>
  );
};
