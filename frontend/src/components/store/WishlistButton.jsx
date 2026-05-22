import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useWishlist } from '@/features/wishlist/useWishlist';
import { cn } from '@/lib/utils';

// ── Custom brand toast ────────────────────────────────────────────────────
const WishlistToast = ({ saved }) => (
  <div
    className="flex items-center gap-2.5 px-5 py-3"
    style={{
      background: '#F5ECE0',
      border: '1px solid rgba(74,30,30,0.14)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    }}
  >
    <Heart
      className={cn('h-3 w-3 shrink-0', saved ? 'fill-[#4A1E1E] text-[#4A1E1E]' : 'fill-transparent text-[#4A1E1E]/50')}
      strokeWidth={1.5}
    />
    <p
      className="text-[10px] font-light"
      style={{ letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(74,30,30,0.75)' }}
    >
      {saved ? 'Added to Wishlist' : 'Removed from Wishlist'}
    </p>
  </div>
);

// ── WishlistButton ────────────────────────────────────────────────────────
// Heart toggle used on ProductCard, PDP gallery, and inline rows.
// Sits inside a <Link>, so we stop propagation on click — tapping the heart
// must never trigger navigation.
//
// Variants:
//   - 'floating' (default): no backdrop, drop-shadow only. Hidden on desktop
//     until hover. Used over product photos.
//   - 'ghost': transparent, for inline use (lists, wishlist page rows).
export const WishlistButton = ({
  productId,
  productName,
  variant = 'floating',
  className,
  size = 'md',
}) => {
  const { has, toggle } = useWishlist();
  const active = has(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = toggle(productId);
    toast.custom(() => <WishlistToast saved={nowSaved} />, {
      duration: 2000,
      position: 'top-center',
    });
  };

  const sizeCls = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  if (variant === 'ghost') {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={active}
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        className={cn(
          'flex items-center justify-center transition-colors duration-200 hover:bg-muted',
          sizeCls,
          className
        )}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors duration-150',
            active
              ? 'fill-primary text-primary'
              : 'fill-transparent text-foreground/55 group-hover:text-foreground'
          )}
          strokeWidth={1.75}
        />
      </motion.button>
    );
  }

  // Floating variant — no backdrop. Hidden by default on desktop, revealed
  // on parent group hover. Always opacity-70 on touch (no hover events).
  const iconFilter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))';

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className={cn(
        'flex items-center justify-center transition-opacity duration-200',
        sizeCls,
        active
          ? 'opacity-100'
          : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100',
        className
      )}
    >
      <Heart
        style={{ filter: iconFilter }}
        className={cn(
          'h-[18px] w-[18px] transition-colors duration-200',
          active ? 'fill-primary text-primary' : 'fill-transparent text-foreground'
        )}
        strokeWidth={1.5}
      />
    </motion.button>
  );
};
