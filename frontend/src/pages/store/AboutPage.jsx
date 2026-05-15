import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { STORE_NAME } from '@/constants/config';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
});

export const AboutPage = () => (
  <div className="container-store py-10 sm:py-16 max-w-3xl">
    <motion.div {...fadeUp(0)} className="mb-8 space-y-3">
      <p className="label-overline">Our Story</p>
      <h1 className="font-serif text-[2.5rem] font-light leading-tight">About {STORE_NAME}</h1>
    </motion.div>

    <motion.div {...fadeUp(0.15)} className="space-y-8 text-sm font-light text-muted-foreground leading-[1.9]">
      <p>
        <span className="font-serif text-base font-normal text-foreground">{STORE_NAME}</span> was born out of a simple belief — that beautiful accessories shouldn't cost a fortune. We curate tarnish-free, affordable pieces that help you elevate your everyday look without compromise.
      </p>

      <p>
        Every piece in our collection is handpicked for quality, style, and durability. From delicate bracelets to bold chains, we believe accessories are the finishing touch that makes an outfit truly yours.
      </p>

      <div className="border-l-2 border-primary/30 pl-6 py-2">
        <p className="font-serif text-base italic text-foreground/80">
          &ldquo;Curated collections to make you shine.&rdquo;
        </p>
      </div>

      <p>
        We connect directly with our customers through Instagram and WhatsApp, keeping things personal, fast, and friendly. Browse our collection, ask questions, and place your order — all through a simple conversation.
      </p>
    </motion.div>

    <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-col sm:flex-row gap-4">
      <Link
        to="/products"
        className="inline-flex items-center justify-center h-11 px-8 bg-primary text-primary-foreground text-2xs tracking-[0.2em] uppercase font-light hover:bg-primary/85 transition-colors"
      >
        Shop Collection
      </Link>
      <Link
        to="/contact"
        className="inline-flex items-center justify-center h-11 px-8 border border-border text-2xs tracking-[0.2em] uppercase font-light hover:border-foreground hover:text-foreground transition-colors"
      >
        Get in Touch
      </Link>
    </motion.div>
  </div>
);
