import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react';
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
  const all         = [...(data?.products ?? [])].sort((a, b) => getTotalDemand(b) - getTotalDemand(a));
  const withDemand  = all.filter(p => getTotalDemand(p) > 0);
  const noDemand    = all.filter(p => getTotalDemand(p) === 0);

  const totalOos = all.reduce((n, p) => {
    if (!p.variants?.length) return n + (!p.inStock ? 1 : 0);
    const oosCount = p.variants.filter(v => v.inStock === false).length;
    return n + oosCount + (!p.inStock && oosCount === 0 ? 1 : 0);
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
        toast.success(`${variant.color} is back in stock.`);
        qc.invalidateQueries({ queryKey: productKeys.lists() });
      },
      onError: () => toast.error('Failed to update stock.'),
    });

  /* ── product card ────────────────────────────────── */
  const renderCard = (product, faded = false) => {
    const thumb       = getProductThumbnail(product);
    const hasVariants = product.variants?.length > 0;
    const oosVariants = hasVariants ? product.variants.filter(v => v.inStock === false) : [];
    const masterOos   = !product.inStock && (!hasVariants || oosVariants.length === 0);
    const demand      = getTotalDemand(product);
    const isOpen      = expanded.has(product.id);

    return (
      <div key={product.id} className={cn(
        'border bg-card overflow-hidden',
        faded ? 'border-border/50' : 'border-border'
      )}>

        {/* ── Product header ───────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-4">

          {/* Thumbnail */}
          <div
            className="h-12 w-12 shrink-0 overflow-hidden"
            style={{ background: 'hsl(34,40%,94%)' }}
          >
            {thumb
              ? <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full" />
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold truncate', faded ? 'text-foreground/60' : 'text-foreground')}>
              {product.name}
            </p>
            <div className="flex items-center flex-wrap gap-x-1 mt-0.5">
              <span className="text-[11px] text-muted-foreground/70">{product.category}</span>
              {product.productCode && (
                <span className="text-[11px] text-muted-foreground/55">· {product.productCode}</span>
              )}
              {hasVariants && oosVariants.length > 0 && (
                <span className="text-[11px] font-semibold text-red-600">
                  · {oosVariants.length}/{product.variants.length} OOS
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {hasVariants ? (
            /* Variant product → expand toggle */
            <div className="flex items-center gap-2.5 shrink-0">
              {demand > 0 && (
                <div className="text-right">
                  <p className="text-xl font-serif leading-none text-foreground">{demand}</p>
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground/65 mt-0.5">
                    {demand === 1 ? 'request' : 'requests'}
                  </p>
                </div>
              )}
              <button
                onClick={() => toggle(product.id)}
                aria-expanded={isOpen}
                className={cn(
                  'h-8 w-8 flex items-center justify-center border transition-all duration-200 shrink-0',
                  isOpen
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-foreground/65 hover:border-foreground hover:bg-muted/30'
                )}
              >
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex items-center justify-center"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>
            </div>
          ) : masterOos ? (
            /* Simple product → inline restock */
            <div className="flex items-center gap-3 shrink-0">
              {demand > 0 && (
                <div className="text-right">
                  <p className="text-xl font-serif leading-none text-foreground">{demand}</p>
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground/65 mt-0.5">
                    {demand === 1 ? 'request' : 'requests'}
                  </p>
                </div>
              )}
              <button
                onClick={() => restockProduct(product)}
                disabled={toggleStock.isPending}
                className={cn(
                  'h-9 px-4 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 disabled:opacity-40 shrink-0',
                  demand > 0
                    ? 'bg-foreground text-background hover:bg-foreground/85'
                    : 'border border-border text-foreground/70 hover:bg-muted/30'
                )}
              >
                Restock
              </button>
            </div>
          ) : null}
        </div>

        {/* ── Accordion: variant list ───────────────── */}
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
                {/* Master offline banner */}
                {!product.inStock && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border-t border-b border-amber-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-semibold text-amber-800">
                        Product offline — master switch is off
                      </span>
                    </div>
                    <button
                      onClick={() => restockProduct(product)}
                      disabled={toggleStock.isPending}
                      className="shrink-0 h-8 px-3 text-[10px] uppercase tracking-wider font-bold border border-amber-400 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-40"
                    >
                      Bring Online
                    </button>
                  </div>
                )}

                {/* Variant rows */}
                <div className="divide-y divide-border/40 border-t border-border/40">
                  {product.variants.map((variant) => {
                    const isOos  = variant.inStock === false;
                    const vDemand = variant.demandCount ?? 0;
                    return (
                      <div
                        key={variant.id}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 transition-colors duration-150',
                          isOos ? 'bg-red-50/50 hover:bg-red-50/80' : 'hover:bg-muted/15'
                        )}
                      >
                        {/* Status dot + Color name */}
                        <span className={cn(
                          'h-2.5 w-2.5 rounded-full shrink-0',
                          isOos ? 'bg-red-500' : 'bg-green-500/70'
                        )} />

                        <span className={cn(
                          'flex-1 text-sm font-medium capitalize min-w-0 truncate',
                          isOos ? 'text-foreground' : 'text-foreground/55'
                        )}>
                          {variant.color}
                        </span>

                        {/* Status badge */}
                        <span className={cn(
                          'shrink-0 text-[9px] uppercase tracking-wider font-bold px-2 py-1 border leading-none',
                          isOos
                            ? 'text-red-700 bg-red-100 border-red-300'
                            : 'text-green-700 bg-green-50 border-green-200'
                        )}>
                          {isOos ? 'Stock Out' : 'In Stock'}
                        </span>

                        {/* Demand count */}
                        <div className="shrink-0 w-14 text-right">
                          {vDemand > 0 ? (
                            <span className="inline-flex items-baseline gap-0.5">
                              <span className="text-base font-serif text-foreground leading-none">{vDemand}</span>
                              <span className="text-[9px] text-muted-foreground/65">req</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 text-sm">—</span>
                          )}
                        </div>

                        {/* Action */}
                        <div className="shrink-0 w-[72px] flex justify-end">
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
                            <span className="text-muted-foreground/35 text-sm">—</span>
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

  /* ── Page ────────────────────────────────────────── */
  return (
    <div className="max-w-2xl pb-16">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase font-medium text-muted-foreground/65 hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Dashboard
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-light tracking-wide">Restock Demand</h1>
        <p className="text-sm text-muted-foreground/65 mt-1.5">
          Customer interest signals for out-of-stock items
        </p>
      </div>

      {/* Stat strip */}
      {!isLoading && all.length > 0 && (
        <div className="grid grid-cols-3 border border-border bg-card mb-10">
          {[
            { value: totalOos,        label: 'Stock Out'  },
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
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border bg-card flex items-center gap-3 px-4 py-4">
              <Skeleton className="h-12 w-12 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-9 w-20 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && all.length === 0 && (
        <div className="border border-border bg-card py-24 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif text-2xl font-light text-muted-foreground/60 mb-1">All clear</p>
          <p className="text-sm text-muted-foreground/55">Every product is currently in stock.</p>
        </div>
      )}

      {/* Most Wanted */}
      {!isLoading && withDemand.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-foreground/75 shrink-0">
              Most Wanted
            </span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground/60 shrink-0">Prioritise these first</span>
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
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-foreground/60 shrink-0">
              Stock Out · No Requests
            </span>
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[11px] font-semibold text-muted-foreground/55 shrink-0 tabular-nums">
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
