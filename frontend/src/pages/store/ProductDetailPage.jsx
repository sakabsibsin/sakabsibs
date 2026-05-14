import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useProduct, useRegisterDemand, useRegisterVariantDemand } from '@/features/products/hooks';
import { useSettings } from '@/features/auth/hooks';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice, cn } from '@/lib/utils';

/* ── Skeleton ─────────────────────────────────── */
const LoadingSkeleton = () => (
  <div className="container-store pt-4 sm:pt-6 pb-10 sm:pb-14">
    <Skeleton className="h-3 w-24 mb-5" />
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_0.88fr] lg:gap-16">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-5 pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="pt-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5 border-b border-border/40">
              <Skeleton className="h-2.5 w-20 shrink-0" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[54px] w-full" />
      </div>
    </div>
  </div>
);

/* ── Detail row ──────────────────────────────── */
const DetailRow = ({ label, value }) => (
  <div className="flex items-baseline gap-4 py-1.5">
    <span className="text-2xs tracking-[0.22em] uppercase font-light text-muted-foreground/55 w-24 shrink-0">
      {label}
    </span>
    {value
      ? <span className="text-sm font-light text-foreground">{value}</span>
      : <span className="text-sm font-light text-muted-foreground/30 italic">—</span>
    }
  </div>
);

/* ── Main page ───────────────────────────────── */
export const ProductDetailPage = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: settings } = useSettings();

  const navigate = useNavigate();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [hasDemanded, setHasDemanded] = useState(false);
  const touchStartX = useRef(null);
  const registerDemand = useRegisterDemand();
  const registerVariantDemand = useRegisterVariantDemand();

  // Auto-select the default variant (or first) once product loads
  useEffect(() => {
    if (!product?.variants?.length) return;
    const defaultIdx = product.variants.findIndex((v) => v.isDefault);
    setSelectedVariant(defaultIdx !== -1 ? defaultIdx : 0);
    setActiveImgIndex(0);
  }, [product?.id]);

  // Read localStorage demand state — scoped to variant when applicable.
  // If demandCount is 0 the product was restocked and demand was reset, so
  // clear any stale "already pressed" entry so the button shows again.
  useEffect(() => {
    if (!product?.id) return;
    const pvariants = product.variants ?? [];

    if (pvariants.length > 0 && selectedVariant !== null) {
      const variant = pvariants[selectedVariant];
      const variantId = variant?.id;
      if (variantId) {
        const key = `demanded_${product.id}_${variantId}`;
        if (localStorage.getItem(key) && (variant?.demandCount ?? 0) === 0) {
          localStorage.removeItem(key);
          setHasDemanded(false);
        } else {
          setHasDemanded(!!localStorage.getItem(key));
        }
        return;
      }
    }

    const key = `demanded_${product.id}`;
    if (localStorage.getItem(key) && (product.demandCount ?? 0) === 0) {
      localStorage.removeItem(key);
      setHasDemanded(false);
    } else {
      setHasDemanded(!!localStorage.getItem(key));
    }
  }, [product?.id, selectedVariant]);

  const handleDemand = () => {
    if (hasDemanded || registerDemand.isPending || registerVariantDemand.isPending) return;
    if (hasVariants && selectedVariant !== null && variants[selectedVariant]?.id) {
      const variantId = variants[selectedVariant].id;
      registerVariantDemand.mutate({ productId: product.id, variantId }, {
        onSuccess: () => {
          localStorage.setItem(`demanded_${product.id}_${variantId}`, '1');
          setHasDemanded(true);
        },
      });
    } else {
      registerDemand.mutate(product.id, {
        onSuccess: () => {
          localStorage.setItem(`demanded_${product.id}`, '1');
          setHasDemanded(true);
        },
      });
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  if (!product) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="font-serif text-3xl font-light text-muted-foreground/50 mb-5">Not found</p>
      <Link to="/products"
        className="text-2xs tracking-[0.2em] uppercase font-light text-muted-foreground hover:text-foreground border-b border-border hover:border-foreground pb-0.5 transition-colors">
        Back to collection
      </Link>
    </div>
  );

  const phoneNumber = (settings?.whatsapp_number || '').replace(/\D/g, '');
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  const activePrice = hasVariants && selectedVariant !== null
    ? variants[selectedVariant].price
    : product.price;

  const activeImages = hasVariants && selectedVariant !== null
    ? (variants[selectedVariant].images?.length > 0 ? variants[selectedVariant].images : [])
    : product.images ?? [];

  const hasMultiple = activeImages.length > 1;

  const activeVariant = hasVariants && selectedVariant !== null ? variants[selectedVariant] : null;
  const isCurrentlyAvailable = !hasVariants
    ? product.inStock
    : product.inStock && (activeVariant ? activeVariant.inStock !== false : true);

  const selectVariant = (i) => {
    if (i === selectedVariant) return;
    setSelectedVariant(i);
    setActiveImgIndex(0);
  };

  const prev = () => setActiveImgIndex((i) => (i - 1 + activeImages.length) % activeImages.length);
  const next = () => setActiveImgIndex((i) => (i + 1) % activeImages.length);

  const onTouchStart = (e) => { touchStartX.current = e.targetTouches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="container-store pt-4 sm:pt-6 pb-10 sm:pb-14"
    >
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="group mb-5 inline-flex items-center gap-2 text-2xs tracking-[0.2em] uppercase font-light text-muted-foreground/60 hover:text-foreground transition-colors duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Collection
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.88fr] lg:gap-16 xl:gap-24">

        {/* ── Image Gallery ─────────────────────── */}
        <div className="space-y-3">
          <div
            className="relative aspect-square overflow-hidden select-none"
            style={{ background: 'hsl(34, 38%, 93%)' }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {activeImages.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif italic text-sm text-muted-foreground/40">No photo</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${selectedVariant}-${activeImgIndex}`}
                  src={activeImages[activeImgIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  draggable={false}
                />
              </AnimatePresence>
            )}

            {hasMultiple && (
              <>
                <button onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-background/85 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-background/85 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {activeImages.map((_, i) => (
                    <button key={i} onClick={() => setActiveImgIndex(i)}
                      className={cn('h-[3px] rounded-full transition-all duration-300',
                        i === activeImgIndex ? 'w-6 bg-foreground' : 'w-2 bg-foreground/20 hover:bg-foreground/40'
                      )} />
                  ))}
                </div>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {activeImages.map((img, i) => (
                <button key={img} onClick={() => setActiveImgIndex(i)}
                  className={cn('h-[68px] w-[68px] flex-shrink-0 overflow-hidden transition-all duration-200',
                    i === activeImgIndex ? 'ring-1 ring-foreground ring-offset-2 opacity-100' : 'opacity-40 hover:opacity-70'
                  )}>
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ──────────────────────── */}
        <motion.div
          className="flex flex-col pt-1"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
          }}
        >
          {/* ② Name */}
          <motion.h1
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } } }}
            className="font-serif text-[2rem] sm:text-[2.5rem] font-light leading-[1.08] tracking-[-0.01em] mb-2"
          >
            {product.name}
          </motion.h1>

          {/* ③ Price — cross-dissolves when variant switches */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } } }}
            className="mb-4"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={activePrice}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-[1.2rem] sm:text-[2.4rem] font-bold leading-none tracking-tight"
              >
                {formatPrice(activePrice)}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* ④ Variants */}
          {hasVariants && (
            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } } }}
              className="mb-7"
            >
              <p className="text-2xs tracking-[0.22em] uppercase font-light text-muted-foreground/55 mb-3">
                Variants
              </p>
              <div className="variant-pills flex overflow-x-auto gap-2 pb-0.5">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => selectVariant(i)}
                    className={cn(
                      'relative flex-shrink-0 h-9 px-4 border text-xs font-light whitespace-nowrap overflow-hidden transition-colors duration-200',
                      v.inStock === false
                        ? selectedVariant === i
                          ? 'border-red-400 text-red-500'
                          : 'border-red-200 text-red-400 hover:border-red-400 hover:text-red-500'
                        : selectedVariant === i
                          ? 'border-foreground text-foreground'
                          : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
                    )}
                  >
                    {selectedVariant === i && (
                      <motion.span
                        layoutId="variant-active-bg"
                        className="absolute inset-0 bg-muted/30"
                        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{v.color}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ⑤ Description */}
          {product.description && (
            <motion.p
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } } }}
              className="text-sm font-light text-foreground/70 leading-[1.9] whitespace-pre-line mb-4"
            >
              {product.description}
            </motion.p>
          )}

          {/* ⑥ Details */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } } }}
            className="mb-5">
            <DetailRow label="Material" value={product.material} />
            <DetailRow label="Category" value={product.category} />
            <DetailRow label="Code"     value={product.productCode} />
            <DetailRow
              label="Status"
              value={
                <span className={isCurrentlyAvailable ? 'text-green-700' : 'text-muted-foreground/50'}>
                  {isCurrentlyAvailable ? 'In Stock' : 'Out of Stock'}
                </span>
              }
            />
          </motion.div>

          {/* ⑦ CTA — WhatsApp if in stock, Interest if out of stock */}
          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } } }}>
          {isCurrentlyAvailable ? (
            <>
              <WhatsAppButton
                phoneNumber={phoneNumber}
                productName={hasVariants && selectedVariant !== null
                  ? `${product.name} (${variants[selectedVariant].color})`
                  : product.name}
                productCode={product.productCode}
                price={formatPrice(activePrice)}
                disabled={false}
              />
              <p className="mt-4 text-center text-2xs tracking-[0.12em] text-muted-foreground/45 font-light">
                Opens WhatsApp &nbsp;·&nbsp; We typically reply within a few hours
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleDemand}
                disabled={hasDemanded || registerDemand.isPending || registerVariantDemand.isPending}
                className={cn(
                  'w-full h-[54px] flex items-center justify-center gap-2 text-xs tracking-[0.2em] uppercase font-light transition-all duration-300',
                  hasDemanded
                    ? 'bg-muted text-muted-foreground cursor-default border border-border'
                    : 'bg-foreground text-background hover:bg-foreground/85 active:scale-[0.98]'
                )}
              >
                {hasDemanded ? 'Interest Noted ✓' : registerDemand.isPending ? 'Noting...' : "I'm Interested"}
              </button>
              <p className="text-center text-2xs tracking-[0.12em] text-muted-foreground/45 font-light">
                {hasDemanded
                  ? "We'll restock this soon — thanks for letting us know"
                  : 'Tap to let us know you want this restocked'}
              </p>
            </div>
          )}
          </motion.div>

        </motion.div>

      </div>

      <style>{`
        .variant-pills::-webkit-scrollbar { display: none; }
        .variant-pills { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>
  );
};
