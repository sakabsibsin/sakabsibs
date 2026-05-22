import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Package, RefreshCcw, MessageCircle, ArrowLeft } from 'lucide-react';

// Store-page rule: pure opacity, no translate motion.
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
});

const sections = [
  {
    icon: Package,
    title: 'Shipping',
    items: [
      'Orders are processed within 1–3 business days after confirmation.',
      'Delivery time varies by location and courier availability — we\'ll always do our best to get it to you quickly.',
      'Tracking details are shared as soon as your order is dispatched.',
      'Orders cannot be cancelled once they have been shipped.',
    ],
  },
  {
    icon: RefreshCcw,
    title: 'Returns & Refunds',
    items: [
      'We accept returns or exchanges only for items that are damaged, defective, or incorrect.',
      'Any issue must be reported within 48 hours of delivery — please don\'t wait.',
      'An unboxing video or clear photos are required so we can verify the concern quickly.',
      'Once approved, refunds are processed to your original payment method within a few business days.',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Support',
    body: 'For any order-related issue, concern, or question — reach out to us directly on WhatsApp or Instagram. We\'re a small team and we genuinely care about every order. We\'ll get back to you as soon as we can.',
  },
];

export const PolicyPage = () => {
  useEffect(() => { document.title = 'Sakab Sibs — Shipping & Returns'; }, []);
  const navigate = useNavigate();
  return (
  <div className="container-store pt-4 pb-10 sm:pt-6 sm:pb-16 max-w-3xl">

    <button
      onClick={() => navigate(-1)}
      className="group inline-flex items-center gap-2 mb-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span className="text-2xs tracking-[0.25em] uppercase font-light">Back</span>
    </button>

    {/* Header */}
    <motion.div {...fadeUp(0)} className="mb-10 space-y-3">
      <p className="label-overline">Policies</p>
      <h1 className="font-serif text-[2.5rem] font-light leading-tight">Shipping & Returns</h1>
      <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-xl">
        We want every order to reach you perfectly. Here&apos;s everything you need to know about
        how we ship, handle returns, and support our customers.
      </p>
    </motion.div>

    {/* Policy sections */}
    <div className="space-y-4">
      {sections.map(({ icon: Icon, title, items, body }, i) => (
        <motion.div
          key={title}
          {...fadeUp(0.1 + i * 0.1)}
          className="border border-border bg-card p-6 sm:p-7"
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-8 w-8 flex items-center justify-center border border-border/60 text-primary/70 shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <h2 className="font-serif text-lg font-light tracking-wide">{title}</h2>
          </div>

          {/* Bullet list */}
          {items && (
            <ul className="space-y-3">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="mt-[7px] h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                  <span className="text-sm font-light text-muted-foreground leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Plain body for support */}
          {body && (
            <p className="text-sm font-light text-muted-foreground leading-[1.9]">{body}</p>
          )}
        </motion.div>
      ))}
    </div>

    {/* Closing note */}
    <motion.div {...fadeUp(0.45)} className="mt-6 border border-border/50 bg-muted/30 px-6 py-5">
      <p className="text-sm font-light text-muted-foreground leading-relaxed">
        These policies exist to keep things fair and transparent for everyone. If something feels
        unclear or you have a special situation, just reach out — we&apos;re always happy to help.
      </p>
      <p className="mt-3 text-xs text-muted-foreground/60 font-light">— Team Sakab Sibs</p>
    </motion.div>

    {/* Footer CTA */}
    <motion.div {...fadeUp(0.55)} className="mt-8 flex flex-col sm:flex-row gap-3">
      <Link
        to="/contact"
        className="inline-flex items-center justify-center h-11 px-8 bg-primary text-primary-foreground text-2xs tracking-[0.2em] uppercase font-light hover:bg-primary/85 transition-colors"
      >
        Contact Us
      </Link>
      <Link
        to="/products"
        className="inline-flex items-center justify-center h-11 px-8 border border-border text-2xs tracking-[0.2em] uppercase font-light hover:border-foreground hover:text-foreground transition-colors"
      >
        Shop Collection
      </Link>
    </motion.div>

  </div>
  );
};
