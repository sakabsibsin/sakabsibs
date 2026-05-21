import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { useFeaturedProducts } from '@/features/products/hooks';
import { ProductGrid } from '@/components/store/ProductGrid';
import { STORE_NAME, STORE_TAGLINE, STORE_SUB } from '@/constants/config';

// Pure opacity fade — store pages must not use translate per brand animation rule
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay },
});

export const HomePage = () => {
  useEffect(() => { document.title = 'Sakab Sibs — Tarnish Free Accessories'; }, []);
  const { data: products = [], isLoading } = useFeaturedProducts();

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[90svh] items-center justify-center overflow-hidden"
        style={{ background: 'hsl(34, 42%, 95%)' }}
      >
        {/* Warm dotted pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(hsl(8, 52%, 20%) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 max-w-2xl px-5 text-center">
          {/* Star overline — matches Instagram star emoji aesthetic */}
          <motion.div {...fadeUp(0.1)} className="mb-5 flex items-center justify-center gap-3">
            {/* <Star className="h-3 w-3 fill-primary text-primary opacity-70" /> */}
            <span className="text-primary/40 text-xs">✦</span>
            <span className="text-2xs tracking-[0.45em] uppercase font-light text-primary/70">
              Tarnish Free · Affordable
            </span>
            {/* <Star className="h-3 w-3 fill-primary text-primary opacity-70" /> */}
            <span className="text-primary/40 text-xs">✦</span>
          </motion.div>

          {/* Brand name — bold serif like the Instagram logo */}
          <motion.h1
            {...fadeUp(0.22)}
            className="font-serif font-semibold tracking-[0.06em] uppercase leading-[0.95] text-primary"
            style={{ fontSize: 'clamp(3.5rem, 12vw, 7.5rem)' }}
          >
            {STORE_NAME}
          </motion.h1>

          {/* Ornament */}
          <motion.div {...fadeUp(0.38)} className="mx-auto my-7 flex w-28 items-center gap-3">
            <span className="h-px flex-1 bg-primary/20" />
            <span className="text-primary/40 text-xs">✦</span>
            <span className="h-px flex-1 bg-primary/20" />
          </motion.div>

          {/* Tagline — matches Instagram bio */}
          <motion.p
            {...fadeUp(0.48)}
            className="mb-2 font-serif text-xl font-light italic text-primary/75 leading-snug"
          >
            {STORE_TAGLINE}
          </motion.p>
          <motion.p
            {...fadeUp(0.55)}
            className="mb-10 text-2xs tracking-[0.25em] uppercase font-light text-muted-foreground"
          >
            {STORE_SUB}
          </motion.p>

          {/* CTA */}
          <motion.div {...fadeUp(0.68)}>
            <Link
              to="/products"
              className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 h-12 text-2xs tracking-[0.25em] uppercase font-light hover:bg-primary/85 active:scale-[0.98] transition-all duration-300"
            >
              Shop Now
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Featured ──────────────────────────────────────── */}
      {(isLoading || products.length > 0) && (
        <section className="container-store py-14 sm:py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8 text-center space-y-3"
          >
            <p className="label-overline">Curated for you</p>
            <h2 className="font-serif font-light text-[2.25rem]">Featured Pieces</h2>
            <p className="text-xs font-light text-muted-foreground max-w-xs mx-auto">
              Handpicked styles to elevate your everyday look
            </p>
          </motion.div>

          <ProductGrid products={products} isLoading={isLoading} />

          {!isLoading && products.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 text-center"
            >
              <Link
                to="/products"
                className="group inline-flex items-center gap-3 text-2xs tracking-[0.25em] uppercase font-light text-primary border-b border-primary/30 hover:border-primary pb-1 transition-all duration-300"
              >
                View All Collections
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}
        </section>
      )}

      {/* ── Brand value strip ─────────────────────────────── */}
      <section className="border-t border-border" style={{ background: 'hsl(34, 38%, 94%)' }}>
        <div className="container-store py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: '✦', title: 'Tarnish Free', sub: 'Long-lasting quality finish' },
              { icon: '✦', title: 'Affordable Luxury', sub: 'Style that fits your budget' },
              { icon: '✦', title: 'WhatsApp Orders', sub: 'Direct & personal service' },
            ].map(({ icon, title, sub }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.12 }}
                className="space-y-2"
              >
                <p className="text-primary/50 text-xs">{icon}</p>
                <p className="font-serif text-base font-light text-primary">{title}</p>
                <p className="text-xs font-light text-muted-foreground">{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
