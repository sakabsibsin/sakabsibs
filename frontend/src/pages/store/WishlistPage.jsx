import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import { Heart, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { useWishlist } from '@/features/wishlist/useWishlist';
import { fetchProduct } from '@/features/products/api';
import { productKeys } from '@/features/products/hooks';
import { ProductCard } from '@/components/store/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';

const CardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="space-y-2 px-0.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-20" />
    </div>
  </div>
);

export const WishlistPage = () => {
  useEffect(() => { document.title = 'Sakab Sibs — Wishlist'; }, []);

  const { wishlist, count, remove, clear } = useWishlist();

  // Resolve every wishlisted ID in parallel. React Query caches per-id, so
  // anything the user already viewed in this session is served from cache
  // instantly. Deleted products (404 from backend) are filtered out below.
  const results = useQueries({
    queries: wishlist.map((id) => ({
      queryKey: productKeys.detail(id),
      queryFn: () => fetchProduct(id),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const products = results
    .map((r) => r.data)
    .filter(Boolean);

  // Prune wishlist of any IDs whose product was deleted on the backend.
  // Run after the query settles (no more loading) so we don't churn during
  // initial fetch — and only if at least one result genuinely errored 404.
  useEffect(() => {
    if (isLoading) return;
    results.forEach((r, i) => {
      if (r.isError) remove(wishlist[i]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="container-store pt-4 pb-12 sm:pb-16"
    >
      {/* Row 1 — back link (left) + count (right) */}
      <div className="flex items-center justify-between mb-3">
        <Link
          to="/products"
          className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
            strokeWidth={1.5}
          />
          <span className="text-2xs tracking-[0.25em] uppercase font-light">
            Continue Shopping
          </span>
        </Link>
        {count > 0 && (
          <p className="text-xs font-light text-muted-foreground/60">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {/* Row 2 — heading (left) + clear button (right) */}
      <div className="flex items-baseline justify-between gap-4 mb-8 pb-5 border-b border-border/40">
        <h1 className="font-sans text-xl sm:text-3xl font-light tracking-[0.18em] uppercase">
          Wishlist
        </h1>
        {count > 0 && (
          <button
            onClick={() => clear()}
            className="inline-flex items-center gap-1.5 text-2xs tracking-[0.2em] uppercase font-light text-muted-foreground hover:text-foreground transition-colors duration-200 shrink-0"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Empty state */}
      {count === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="flex items-center justify-center h-16 w-16 bg-muted/30 mb-5">
            <Heart className="h-7 w-7 text-muted-foreground/30" strokeWidth={1.5} />
          </div>
          <p className="font-sans text-xl font-light tracking-[0.12em] uppercase text-foreground/70">Your wishlist is empty</p>
          <p className="mt-3 text-xs font-light text-muted-foreground/55 tracking-wide max-w-xs">
            Tap the heart on any piece to save it here for later.
          </p>
          <Link
            to="/products"
            className="group mt-8 inline-flex items-center gap-2 px-8 h-11 bg-foreground text-background text-2xs tracking-[0.22em] uppercase font-light hover:bg-foreground/88 transition-colors"
          >
            Browse Pieces
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      )}

      {/* Loading skeletons — only while no products have resolved yet */}
      {count > 0 && isLoading && products.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
          {Array.from({ length: Math.min(count, 8) }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </motion.div>
  );
};
