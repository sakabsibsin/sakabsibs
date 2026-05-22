import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { WishlistButton } from '@/components/store/WishlistButton';
import { formatPrice, getEffectivePrice, getProductThumbnail, getCloudinaryThumb } from '@/lib/utils';

export const ProductCard = ({ product, index = 0 }) => {
  const thumbnail = getProductThumbnail(product);
  const [loaded, setLoaded] = useState(false);

  // Out of stock = base product OOS OR every variant is OOS.
  const isOutOfStock =
    !product.inStock ||
    (product.variants?.length > 0 && product.variants.every((v) => v.inStock === false));

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block cursor-pointer animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 7) * 65}ms` }}
    >
      {/* Image */}
      <div
        className="relative aspect-[3/4] mb-2.5 overflow-hidden"
        style={{ background: 'hsl(34, 40%, 94%)' }}
      >
        {thumbnail ? (
          <>
            <div
              className={`absolute inset-0 bg-muted transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}
            />
            <img
              src={getCloudinaryThumb(thumbnail, 400)}
              alt={product.name}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`w-full h-full object-cover object-center transition-[transform,opacity,filter] duration-500 ease-out-expo group-hover:scale-[1.07] ${loaded ? 'opacity-100' : 'opacity-0'} ${isOutOfStock ? 'opacity-55 saturate-[0.6]' : ''}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif italic text-sm text-muted-foreground/40">No image</span>
          </div>
        )}

        {/* Soft bottom-up gradient — keeps the editorial bestseller tag
            legible against any photo color. pointer-events-none so taps
            travel through to the parent <Link>. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.08) 30%, transparent 60%)',
          }}
        />

        {/* Warm hover wash — barely-there primary tint on hover */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.04] transition-colors duration-500 pointer-events-none" />

        {/* Bestseller — top-left corner. Shown regardless of stock status:
            the badge reflects the product's track record, not its current
            availability, and pairing it with the sold-out signal nudges
            customers toward the restock-demand CTA on the PDP. */}
        {product.featured && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge>bestseller</Badge>
          </div>
        )}

        {/* Wishlist heart — top-right, no backdrop */}
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton productId={product.id} productName={product.name} size="sm" />
        </div>

        {/* Sold out — just a single line of text, centered on the dimmed
            photo. No box, no dividers. The photo itself does the heavy
            lifting via opacity + reduced saturation. */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="text-[11px] tracking-[0.35em] uppercase font-light text-white"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.65)' }}
            >
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <h3 className="font-serif text-[0.92rem] font-light leading-snug text-primary/90 group-hover:text-primary/60 transition-colors duration-300 truncate">
          {product.name}
        </h3>

        <p className="shrink-0 text-sm font-medium text-primary/80">
          {formatPrice(getEffectivePrice(product))}
        </p>
      </div>
    </Link>
  );
};
