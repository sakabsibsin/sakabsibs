import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProducts, useToggleStock, useToggleVariantStock, productKeys } from '@/features/products/hooks';
import { getProductThumbnail, cn } from '@/lib/utils';

/* ── helpers ──────────────────────────────────────── */
const getTotalDemand = (product) => {
  const vd = (product.variants ?? []).reduce((s, v) => s + (v.demandCount ?? 0), 0);
  return (product.demandCount ?? 0) + vd;
};

/* ── Demand count ─────────────────────────────────── */
const DemandCount = ({ count, large = false }) =>
  count > 0 ? (
    <div className="text-right shrink-0">
      <p className={cn('font-serif leading-none tabular-nums text-foreground', large ? 'text-2xl' : 'text-xl')}>
        {count}
      </p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-0.5">
        {count === 1 ? 'request' : 'requests'}
      </p>
    </div>
  ) : null;

/* ── Restock button ───────────────────────────────── */
const RestockBtn = ({ onClick, disabled, hasDemand, faded, label = 'Restock' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'shrink-0 h-8 px-4 text-[10px] uppercase tracking-wider font-semibold transition-all duration-200 disabled:opacity-40',
      faded
        ? 'border border-border text-foreground/60 hover:border-foreground/50 hover:text-foreground hover:bg-muted/30'
        : hasDemand
          ? 'bg-foreground text-background hover:bg-foreground/85 active:scale-[0.97]'
          : 'border border-border text-foreground/70 hover:border-foreground hover:bg-muted/30'
    )}
  >
    {label}
  </button>
);

/* ── Page ─────────────────────────────────────────── */
export const RestockPage = () => {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const { data, isLoading } = useProducts({ anyOutOfStock: true, limit: 200 });
  const toggleStock        = useToggleStock();
  const toggleVariantStock = useToggleVariantStock();

  const [expanded, setExpanded] = useState(new Set());
  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  /* ── derived data ───────────────────────────────── */
  const allProducts   = [...(data?.products ?? [])].sort((a, b) => getTotalDemand(b) - getTotalDemand(a));
  const withDemand    = allProducts.filter(p => getTotalDemand(p) > 0);
  const noDemand      = allProducts.filter(p => getTotalDemand(p) === 0);

  const totalOosItems = allProducts.reduce((n, p) => {
    if (!p.variants?.length) return n + (!p.inStock ? 1 : 0);
    return n + p.variants.filter(v => v.inStock === false).length
             + (!p.inStock && !p.variants.some(v => v.inStock === false) ? 1 : 0);
  }, 0);
  const totalWithDemand = allProducts.reduce((n, p) => {
    if (!p.variants?.length) return n + ((p.demandCount ?? 0) > 0 ? 1 : 0);
    return n + p.variants.filter(v => v.inStock === false && (v.demandCount ?? 0) > 0).length;
  }, 0);
  const totalSignals = allProducts.reduce((s, p) => s + getTotalDemand(p), 0);

  /* ── handlers ───────────────────────────────────── */
  const handleRestockProduct = (product) =>
    toggleStock.mutate({ id: product.id, inStock: true }, {
      onSuccess: () => {
        toast.success(`"${product.name}" is back in stock.`);
        qc.invalidateQueries({ queryKey: productKeys.stats() });
        qc.invalidateQueries({ queryKey: productKeys.lists() });
      },
      onError: () => toast.error('Failed to update stock.'),
    });

  const handleRestockVariant = (product, variant) =>
    toggleVariantStock.mutate({ productId: product.id, variantId: variant.id, inStock: true }, {
      onSuccess: () => {
        toast.success(`"${variant.color}" is back in stock.`);
        qc.invalidateQueries({ queryKey: productKeys.lists() });
      },
      onError: () => toast.error('Failed to update variant stock.'),
    });

  /* ── product card ───────────────────────────────── */
  const renderCard = (product, faded = false) => {
    const thumb        = getProductThumbnail(product);
    const hasVariants  = product.variants?.length > 0;
    const oosVariants  = hasVariants ? product.variants.filter(v => v.inStock === false) : [];
    const masterOos    = !product.inStock && (!hasVariants || oosVariants.length === 0);
    const totalDemand  = getTotalDemand(product);
    const isOpen       = expanded.has(product.id);

    return (
      <div
        key={product.id}
        className={cn(
          'border bg-card overflow-hidden transition-all duration-200',
          faded ? 'border-border/60' : 'border-border hover:border-foreground/30'
        )}
      >
        {/* ── Header row ─────────────────────────── */}
        <div className={cn('flex items-center gap-3 px-4 py-3.5', faded && 'opacity-70')}>

          {/* Thumbnail */}
          <div className="h-12 w-12 shrink-0 overflow-hidden" style={{ background: 'hsl(34,40%,94%)' }}>
            {thumb
              ? <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full" />
            }
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-snug truncate text-foreground">
              {product.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 mt-0.5">
              <span className="text-[11px] text-muted-foreground/70">{product.category}</span>
              {product.productCode && (
                <>
                  <span className="text-muted-foreground/50 text-[11px]">·</span>
                  <span className="text-[11px] font-mono text-muted-foreground/65">{product.productCode}</span>
                </>
              )}
              {hasVariants && (
                <>
                  <span className="text-muted-foreground/50 text-[11px]">·</span>
                  <span className={cn('text-[11px] font-medium', oosVariants.length > 0 ? 'text-red-600/80' : 'text-muted-foreground/65')}>
                    {oosVariants.length} of {product.variants.length} variants out of stock
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {hasVariants ? (
            <div className="flex items-center gap-2.5 shrink-0">
              {totalDemand > 0 && <DemandCount count={totalDemand} large />}
              <button
                onClick={() => toggle(product.id)}
                aria-expanded={isOpen}
                className={cn(
                  'h-8 w-8 flex items-center justify-center border transition-all duration-200',
                  isOpen
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-foreground/60 hover:border-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
            </div>
          ) : masterOos ? (
            <div className="flex items-center gap-3 shrink-0">
              <DemandCount count={totalDemand} large />
              <RestockBtn
                onClick={() => handleRestockProduct(product)}
                disabled={toggleStock.isPending}
                hasDemand={totalDemand > 0}
                faded={faded}
              />
            </div>
          ) : null}
        </div>

        {/* ── Accordion panel (all variants) ────────── */}
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
                <div className="border-t border-border">

                  {/* Master offline banner */}
                  {!product.inStock && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-[12px] text-amber-800 font-medium truncate">
                          Entire product is offline — master switch is off
                        </span>
                      </div>
                      <RestockBtn
                        onClick={() => handleRestockProduct(product)}
                        disabled={toggleStock.isPending}
                        hasDemand={false}
                        faded={false}
                        label="Bring Online"
                      />
                    </div>
                  )}

                  {/* Column headers */}
                  <div className="flex items-center gap-3 pl-4 pr-4 py-2 border-b border-border bg-muted/30">
                    <span className="w-48 text-[10px] uppercase tracking-[0.18em] text-foreground/60 font-semibold">Variant</span>
                    <span className="w-28 text-center text-[10px] uppercase tracking-[0.18em] text-foreground/60 font-semibold shrink-0">Status</span>
                    <span className="w-20 text-right text-[10px] uppercase tracking-[0.18em] text-foreground/60 font-semibold shrink-0">Interest</span>
                    <span className="w-20 shrink-0" />
                  </div>

                  {/* ALL variant rows */}
                  <div className="divide-y divide-border/40">
                    {product.variants.map((variant) => {
                      const isOos  = variant.inStock === false;
                      const demand = variant.demandCount ?? 0;
                      return (
                        <div
                          key={variant.id}
                          className={cn(
                            'flex items-center gap-3 pl-4 pr-4 py-3 transition-colors duration-150',
                            isOos ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-muted/20'
                          )}
                        >
                          {/* Status dot */}
                          <div className="w-48 flex items-center gap-2.5 min-w-0">
                            <span className={cn(
                              'h-2.5 w-2.5 rounded-full shrink-0',
                              isOos ? 'bg-red-500' : 'bg-green-500/70'
                            )} />
                            <span className={cn(
                              'text-[13px] font-medium capitalize truncate',
                              isOos ? 'text-foreground' : 'text-foreground/55'
                            )}>
                              {variant.color}
                            </span>
                          </div>

                          {/* Stock status badge */}
                          <div className="w-28 flex justify-center shrink-0">
                            {isOos ? (
                              <span className="inline-flex items-center text-[10px] tracking-wide uppercase font-bold text-red-700 bg-red-100 border border-red-300 px-2.5 py-1 leading-none">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] tracking-wide uppercase font-medium text-green-700/80 bg-green-50 border border-green-200 px-2.5 py-1 leading-none">
                                In Stock
                              </span>
                            )}
                          </div>

                          {/* Demand count */}
                          <div className="w-20 text-right shrink-0">
                            {demand > 0 ? (
                              <div className="inline-flex items-baseline gap-1 justify-end">
                                <span className="text-lg font-serif text-foreground leading-none">{demand}</span>
                                <span className="text-[10px] text-muted-foreground/70">
                                  {demand === 1 ? 'req.' : 'req.'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground/45">—</span>
                            )}
                          </div>

                          {/* Action */}
                          <div className="w-20 flex justify-end shrink-0">
                            {isOos ? (
                              <RestockBtn
                                onClick={() => handleRestockVariant(product, variant)}
                                disabled={toggleVariantStock.isPending}
                                hasDemand={demand > 0}
                                faded={false}
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground/40">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="max-w-2xl pb-16">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-medium text-muted-foreground/65 hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Dashboard
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-light tracking-wide">Restock Demand</h1>
        <p className="text-sm text-muted-foreground/70 mt-1.5 font-light">
          Customer interest signals for out-of-stock items
        </p>
      </div>

      {/* Stat strip */}
      {!isLoading && allProducts.length > 0 && (
        <div className="grid grid-cols-3 border border-border bg-card mb-10">
          {[
            { value: totalOosItems,   label: 'Out of Stock'  },
            { value: totalWithDemand, label: 'Have Demand'   },
            { value: totalSignals,    label: 'Total Signals' },
          ].map(({ value, label }, i) => (
            <div
              key={label}
              className={cn('flex flex-col items-center justify-center py-5', i < 2 && 'border-r border-border')}
            >
              <p className="text-3xl font-serif mb-1">{value}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/65 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border bg-card flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="h-12 w-12 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-8 w-20 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && allProducts.length === 0 && (
        <div className="border border-border bg-card py-24 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-5" />
          <p className="font-serif text-2xl font-light text-muted-foreground/60 mb-2">All clear</p>
          <p className="text-sm text-muted-foreground/55 tracking-wide">Every product is currently in stock.</p>
        </div>
      )}

      {/* Most Wanted */}
      {!isLoading && withDemand.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/70 font-semibold shrink-0">
              Most Wanted
            </p>
            <div className="flex-1 h-px bg-border" />
            <p className="text-[11px] text-muted-foreground/60 shrink-0">Prioritise these first</p>
          </div>
          <div className="space-y-2">
            {withDemand.map(p => renderCard(p, false))}
          </div>
        </div>
      )}

      {/* No demand */}
      {!isLoading && noDemand.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/60 font-semibold shrink-0">
              Out of Stock · No Requests
            </p>
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[11px] text-muted-foreground/60 shrink-0 tabular-nums font-medium">
              {noDemand.length}
            </span>
          </div>
          <div className="space-y-2">
            {noDemand.map(p => renderCard(p, true))}
          </div>
        </div>
      )}
    </div>
  );
};
