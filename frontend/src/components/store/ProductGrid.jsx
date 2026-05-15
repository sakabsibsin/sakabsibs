import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';

const CardSkeleton = ({ i }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay: i * 0.04 }}
    className="space-y-4"
  >
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="space-y-2 px-0.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-20" />
    </div>
  </motion.div>
);

export const ProductGrid = ({ products = [], isLoading }) => {
  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
      {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} i={i} />)}
    </div>
  );

  if (!products.length) return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      <p className="font-serif text-2xl font-light text-muted-foreground/60">No pieces found</p>
      <p className="mt-3 text-xs font-light text-muted-foreground/50 tracking-wide">
        Try adjusting your filters
      </p>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-12">
      {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
};
