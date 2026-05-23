import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { STORE_NAME, STORE_TAGLINE } from '@/constants/config';

// Swap these two strings per client deployment.
const PLATFORM_NAME = 'Shopflow';
const PLATFORM_URL  = 'https://shopflow.in';

// Footer renders on every store page — pure opacity per the store-page rule.
const col = (i) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.1 },
});

export const Footer = () => (
  <footer className="border-t border-border" style={{ background: 'hsl(34, 38%, 90%)' }}>
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-10">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">

        {/* Brand */}
        <motion.div {...col(0)} className="space-y-3">
          <p className="font-serif text-lg font-semibold tracking-[0.15em] uppercase text-primary">
            {STORE_NAME}
          </p>
          <p className="text-xs text-muted-foreground font-light leading-relaxed max-w-[180px]">
            {STORE_TAGLINE}
          </p>
          <a
            href="https://www.instagram.com/sakab.sibs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-2xs tracking-[0.2em] uppercase font-light text-primary/60 hover:text-primary transition-colors duration-200"
          >
            @sakab.sibs
          </a>
        </motion.div>

        {/* Links */}
        <motion.div {...col(1)} className="space-y-4">
          <p className="text-2xs tracking-[0.3em] uppercase font-light text-muted-foreground">Navigate</p>
          <div className="space-y-3">
            <Link to="/" className="block text-xs font-light text-muted-foreground hover:text-primary transition-colors duration-200">Home</Link>
            <Link to="/products" className="block text-xs font-light text-muted-foreground hover:text-primary transition-colors duration-200">Shop</Link>
            <Link to="/about" className="block text-xs font-light text-muted-foreground hover:text-primary transition-colors duration-200">About</Link>
            <Link to="/contact" className="block text-xs font-light text-muted-foreground hover:text-primary transition-colors duration-200">Contact</Link>
            <Link to="/policy" className="block text-xs font-light text-muted-foreground hover:text-primary transition-colors duration-200">Shipping & Returns</Link>
          </div>
        </motion.div>

        {/* Connect */}
        <motion.div {...col(2)} className="space-y-4">
          <p className="text-2xs tracking-[0.3em] uppercase font-light text-muted-foreground">Connect</p>
          <div className="space-y-3">
            <a
              href="https://wa.me/919110225313"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs font-light text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              WhatsApp Us
            </a>
            <a
              href="https://www.instagram.com/sakab.sibs"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs font-light text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Instagram
            </a>
          </div>
        </motion.div>

      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 pt-10 border-t border-border/60 flex items-center justify-between gap-3"
      >
        <p className="text-xs font-light text-muted-foreground">
          &copy; {new Date().getFullYear()} {STORE_NAME}
        </p>
        <a
          href={PLATFORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          Powered by <span className="text-foreground">{PLATFORM_NAME}</span>
        </a>
      </motion.div>
    </div>
  </footer>
);
