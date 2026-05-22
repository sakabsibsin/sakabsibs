import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutDashboard, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrolled } from '@/hooks/useScrolled';
import { useAuthStatus } from '@/features/auth/hooks';
import { useWishlist } from '@/features/wishlist/useWishlist';
import { STORE_NAME } from '@/constants/config';

const navLinks = [
  { to: '/', label: 'Home', exact: true },
  { to: '/products', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/policy', label: 'Policy' },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrolled = useScrolled(8);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  const { data: auth } = useAuthStatus();
  const isAdmin = auth?.authenticated === true;
  const { count: wishlistCount } = useWishlist();

  const isActive = (link) =>
    link.exact ? pathname === link.to : pathname.startsWith(link.to);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-400 ease-luxury',
          scrolled
            ? 'bg-background/98 backdrop-blur-md border-b border-border shadow-[0_1px_0_0_hsl(var(--border))]'
            : 'bg-background/80 backdrop-blur-sm'
        )}
      >
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* Logo */}
          <Link
            to="/"
            className="font-serif text-xl font-semibold tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity duration-300"
          >
            {STORE_NAME}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'relative text-2xs tracking-[0.2em] uppercase font-light transition-colors duration-300 group',
                  isActive(link) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
                <span className={cn(
                  'absolute -bottom-0.5 left-0 h-px bg-foreground transition-all duration-300 ease-out-expo',
                  isActive(link) ? 'w-full' : 'w-0 group-hover:w-full'
                )} />
              </Link>
            ))}

            {/* Wishlist — heart with spring-animated count badge.
                Subtle burgundy halo on the heart when items exist;
                the badge value pops via AnimatePresence on every change. */}
            <Link
              to="/wishlist"
              aria-label={`Wishlist (${wishlistCount} ${wishlistCount === 1 ? 'item' : 'items'})`}
              className={cn(
                'inline-flex items-center gap-1.5 transition-colors duration-300',
                pathname === '/wishlist' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <motion.span
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="flex"
              >
                <Heart
                  strokeWidth={1.5}
                  style={{
                    filter: undefined,
                  }}
                  className={cn(
                    'h-[18px] w-[18px] transition-[color,fill] duration-300',
                    wishlistCount > 0 && 'fill-primary text-primary'
                  )}
                />
              </motion.span>
            </Link>

            {/* Admin badge — only when logged in */}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 text-2xs tracking-[0.18em] uppercase font-light px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/85 transition-colors duration-200"
              >
                <LayoutDashboard className="h-3 w-3" />
                Admin
              </Link>
            )}
          </nav>

          {/* Mobile: wishlist + menu toggle */}
          <div className="flex items-center gap-1 sm:hidden">
            <Link
              to="/wishlist"
              aria-label={`Wishlist (${wishlistCount} ${wishlistCount === 1 ? 'item' : 'items'})`}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-300 px-1"
            >
              <motion.span
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="flex"
              >
                <Heart
                  strokeWidth={1.5}
                  style={{
                    filter: undefined,
                  }}
                  className={cn(
                    'h-[18px] w-[18px] transition-[color,fill] duration-300',
                    wishlistCount > 0 && 'fill-primary text-primary'
                  )}
                />
              </motion.span>
            </Link>
            <button
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Reading progress bar */}
        <div
          className="absolute bottom-0 left-0 h-[1.5px] bg-primary/40 transition-none"
          style={{ width: `${progress}%` }}
        />
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 sm:hidden transition-all duration-400 ease-luxury',
          open ? 'visible' : 'invisible'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity duration-400',
            open ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setOpen(false)}
        />
        <nav
          className={cn(
            'absolute top-[60px] left-0 right-0 bg-background border-b border-border px-5 py-3 transition-all duration-400 ease-out-expo',
            open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          )}
        >
          {navLinks.map((link, i) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={cn(
                'flex py-3 text-2xs tracking-[0.25em] uppercase font-light transition-colors',
                i < navLinks.length - 1 && 'border-b border-border',
                isActive(link) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 py-3 text-2xs tracking-[0.25em] uppercase font-light text-primary hover:text-primary/70 transition-colors border-t border-border mt-1"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Admin Dashboard
            </Link>
          )}
        </nav>
      </div>

      {/* Spacer */}
      <div className="h-[60px]" />
    </>
  );
};
