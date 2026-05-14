import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, AlertCircle, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProducts, useToggleStock, useToggleVariantStock, productKeys } from '@/features/products/hooks';
import { getProductThumbnail, cn } from '@/lib/utils';

const getTotalDemand = (p) => {
  const vd = (p.variants ?? []).reduce((s, v) => s + (v.demandCount ?? 0), 0);
  return (p.demandCount ?? 0) + vd;
};

/* ─── Stat card ────────────────────────────────────── */
const Stat = ({ value, label, accent = false }) => (
  <div className="flex flex-col items-center justify-center py-6 px-4">
    <span className={cn(
      'text-4xl font-serif leading-none mb-1.5',
      accent ? 'text-red-600' : 'text-foreground'
    )}>
      {value}
    </span>
    <span className="text-[10px] uppercase tracking-[0.22em] font-semibold text-muted-foreground/60">
      {label}
    </span>
  </div>
);

/* ─── Demand pill ──────────────────────────────────── */
const DemandPill = ({ count }) => {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-semibold px-2.5 py-1 shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
      {count} {count === 1 ? 'waiting' : 'waiting'}
    </span>
  );
};

/* ─── Page ─────────────────────────────────────────── */
export const RestockPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useProducts({ anyOutOfStock: true, limit: 200 });
  const toggleStock        = useToggleStock();
  const toggleVariantStock = useToggleVariantStock();

  const [expanded, setExpanded] = useState(new Set());
  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  /* ── derived ─────────────────────────────────────── */
  const all        = [...(data?.products ?? [])].sort((a, b) => getTotalDemand(b) - getTotalDemand(a));
  const withDemand = all.filter(p => getTotalDemand(p) > 0);
  const noDemand   = all.filter(p => getTotalDemand(p) === 0);

  const totalOos = all.reduce((n, p) => {
    if (!p.variants?.length) return n + (!p.inStock ? 1 : 0);
    const v = p.variants.filter(v => v.inStock === false).length;
    return n + v + (!p.inStock && v === 0 ? 1 : 0);
  }, 0);
  const totalWithDemand = all.reduce((n, p) => {
    if (!p.variants?.length) return n + ((p.demandCount ?? 0) > 0 ? 1 : 0);
    return n + p.variants.filter(v => v.inStock === false && (v.demandCount ?? 0) > 0).length;
  }, 0);
  const totalSignals = all.reduce((s, p) => s + getTotalDemand(p), 0);

  /* ── handlers ────────────────────────────────────── */
  const restockProduct = (product) =>
    toggleStock.mutate({ id: product.id, inStock: true }, {
      onSuccess: () => {
        toast.success(`"${product.name}" is back in stock.`);
        qc.invalidateQueries({ queryKey: productKeys.stats() });
        qc.invalidateQueries({ queryKey: productKeys.lists() });
      },
      onError: () => toast.error('Failed to update stock.'),
    });

  const restockVariant = (product, variant) =>
    toggleVariantStock.mutate({ productId: product.id, variantId: variant.id, inStock: true }, {
      onSuccess: () => {
        toast.success(`${variant.color} restocked.`);
        qc.invalidateQueries({ queryKey: productKeys.lists() });
      },
      onError: () => toast.error('Failed.'),
    });

  /* ── product card ────────────────────────────────── */
  const renderCard = (product, faded = false) => {
    const thumb       = getProductThumbnail(product);
    const hasVariants = product.variants?.length > 0;
    const oosVariants = hasVariants ? product.variants.filter(v => v.inStock === false) : [];
    const masterOos   = !product.inStock && (!hasVariants || oosVariants.length === 0);
    const demand      = getTotalDemand(product);
    const isOpen      = expanded.has(product.id);
    const hasDemand   = demand > 0;

    return (
      <div
        key={product.id}
        className={cn(
          'bg-card border border-border overflow-hidden transition-all duration-200',
          !faded && hasDemand && 'border-l-[3px] border-l-amber-400',
          !faded && !hasDemand && 'border-l-[3px] border-l-red-300',
          faded && 'opacity-65'
        )}
      >
        {/* ─── Product header ──────────────────────── */}
        <div className={cn(
          'flex items-center gap-4 px-5 py-4',
          !faded && hasDemand && 'bg-amber-50/20'
        )}>

          {/* Thumbnail */}
          <div
            className="h-14 w-14 shrink-0 overflow-hidden"
            style={{ background: 'hsl(34,40%,93%)' }}
          >
            {thumb
              ? <img src={thumb} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground/30" />
                </div>
            }
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-foreground leading-tight truncate">
              {product.name}
            </p>
            <div className="flex items-center flex-wrap gap-x-1.5 mt-1">
              <span className="text-xs text-muted-foreground/70">{product.category}</span>
              {product.productCode && (
                <span className="text-xs text-muted-foreground/55">· {product.productCode}</span>
              )}
            </div>
            {hasVariants && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {oosVariants.length > 0 ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 leading-none">
                    {oosVariants.length} of {product.variants.length} variants out of stock
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/55 italic">
                    All variants in stock — product master offline
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3 shrink-0">
            {hasDemand && <DemandPill count={demand} />}

            {hasVariants ? (
              <button
                onClick={() => toggle(product.id)}
                aria-expanded={isOpen}
                className={cn(
                  'h-9 w-9 flex items-center justify-center border transition-all duration-200',
                  isOpen
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-foreground/60 hover:border-foreground hover:bg-muted/30'
                )}
              >
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>
            ) : masterOos ? (
              <button
                onClick={() => restockProduct(product)}
                disabled={toggleStock.isPending}
                className={cn(
                  'h-9 px-5 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 disabled:opacity-40',
                  hasDemand
                    ? 'bg-foreground text-background hover:bg-foreground/85'
                    : 'border border-border text-foreground/75 hover:bg-muted/30'
                )}
              >
                Restock
              </button>
            ) : null}
          </div>
        </div>

        {/* ─── Variant accordion ───────────────────── */}
        {hasVariants && (
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ overflow: 'hidden' }}
              >
                {/* Master offline notice */}
                {!product.inStock && (
                  <div className="flex items-center justify-between gap-3 px-5 py-3 bg-amber-50 border-y border-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-xs font-semibold text-amber-800">
                        Entire product is offline — master switch is off
                      </p>
                    </div>
                    <button
                      onClick={() => restockProduct(product)}
                      disabled={toggleStock.isPending}
                      className="h-8 px-4 text-[10px] uppercase tracking-wider font-bold border border-amber-400 text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-40 shrink-0"
                    >
                      Bring Online
                    </button>
                  </div>
                )}

                {/* Variant list */}
                <div className="border-t border-border/50">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_120px_80px_88px] items-center gap-2 px-5 py-2 bg-muted/40 border-b border-border/40">
                    <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-foreground/50">Variant</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-foreground/50 text-center">Status</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-foreground/50 text-right">Interest</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-foreground/50 text-right">Action</span>
                  </div>

                  {/* Variant rows */}
                  {product.variants.map((variant, idx) => {
                    const isOos   = variant.inStock === false;
                    const vDemand = variant.demandCount ?? 0;
                    return (
                      <div
                        key={variant.id}
                        className={cn(
                          'grid grid-cols-[1fr_120px_80px_88px] items-center gap-2 px-5 py-3 border-b border-border/20 last:border-0 transition-colors duration-100',
                          isOos ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-muted/15'
                        )}
                      >
                        {/* Variant name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            isOos ? 'bg-red-500' : 'bg-green-500/80'
                          )} />
                          <span className={cn(
                            'text-sm font-medium capitalize truncate',
                            isOos ? 'text-foreground' : 'text-foreground/50'
                          )}>
                            {variant.color}
                          </span>
                        </div>

                        {/* Status badge */}
                        <div className="flex justify-center">
                          {isOos ? (
                            <span className="text-[9px] uppercase tracking-wide font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-1 leading-none whitespace-nowrap">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wide font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 leading-none whitespace-nowrap">
                              In Stock
                            </span>
                          )}
                        </div>

                        {/* Demand */}
                        <div className="text-right">
                          {vDemand > 0 ? (
                            <span className="inline-flex items-baseline gap-0.5 justify-end">
                              <span className="text-base font-serif text-foreground">{vDemand}</span>
                              <span className="text-[9px] text-muted-foreground/60"> req</span>
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground/35">—</span>
                          )}
                        </div>

                        {/* Action */}
                        <div className="flex justify-end">
                          {isOos ? (
                            <button
                              onClick={() => restockVariant(product, variant)}
                              disabled={toggleVariantStock.isPending}
                              className={cn(
                                'h-8 px-3 text-[10px] uppercase tracking-wider font-bold transition-all duration-200 disabled:opacity-40',
                                vDemand > 0
                                  ? 'bg-foreground text-background hover:bg-foreground/85'
                                  : 'border border-border text-foreground/70 hover:bg-muted/30'
                              )}
                            >
                              Restock
                            </button>
                          ) : (
                            <span className="text-sm text-muted-foreground/30">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  /* ── Page shell ──────────────────────────────────── */
  return (
    <div className="max-w-2xl pb-16">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase font-semibold text-muted-foreground/60 hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Dashboard
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-light tracking-wide">Restock Demand</h1>
        <p className="text-sm text-muted-foreground/65 mt-1.5">
          Track which out-of-stock items customers are waiting for
        </p>
      </div>

      {/* Stats */}
      {!isLoading && all.length > 0 && (
        <div className="grid grid-cols-3 border border-border bg-card mb-10">
          <div className="border-r border-border">
            <Stat value={totalOos} label="Out of Stock" accent />
          </div>
          <div className="border-r border-border">
            <Stat value={totalWithDemand} label="Have Demand" />
          </div>
          <Stat value={totalSignals} label="Total Signals" />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-border bg-card flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-14 w-14 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-24 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && all.length === 0 && (
        <div className="border border-border bg-card py-24 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500/40 mx-auto mb-4" />
          <p className="font-serif text-2xl font-light text-foreground/60 mb-2">All clear</p>
          <p className="text-sm text-muted-foreground/55">Every product is currently in stock.</p>
        </div>
      )}

      {/* ── Most Wanted ────────────────────────────── */}
      {!isLoading && withDemand.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/80">
                Most Wanted
              </h2>
              <span className="h-px flex-1 bg-border w-8" />
            </div>
            <span className="text-xs text-muted-foreground/60 font-medium">
              Prioritise these first
            </span>
          </div>
          <div className="space-y-3">
            {withDemand.map(p => renderCard(p, false))}
          </div>
        </section>
      )}

      {/* ── No Requests ────────────────────────────── */}
      {!isLoading && noDemand.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground/55">
              Out of Stock · No Requests
            </h2>
            <span className="text-xs font-bold text-muted-foreground/50 tabular-nums bg-muted/50 border border-border/60 px-2 py-0.5">
              {noDemand.length}
            </span>
          </div>
          <div className="space-y-3">
            {noDemand.map(p => renderCard(p, true))}
          </div>
        </section>
      )}
    </div>
  );
};
