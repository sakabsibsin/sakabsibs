import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, getEffectivePrice, getProductThumbnail } from '@/lib/utils';

export const ProductCard = ({ product, index = 0 }) => {
  const thumbnail = getProductThumbnail(product);
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
        <img
          src={thumbnail}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out-expo group-hover:scale-[1.07]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="font-serif italic text-sm text-muted-foreground/40">No image</span>
        </div>
      )}

      {/* Hover warm overlay */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.03] transition-colors duration-500" />

      {/* Featured badge — top right */}
      {product.featured && (
        <div className="absolute top-2.5 right-2.5">
          <Badge>bestseller</Badge>
        </div>
      )}

      {/* Out of stock badge — bottom left, never conflicts with featured */}
      {(!product.inStock ||
        (product.variants?.length > 0 &&
          product.variants.every((v) => v.inStock === false))) && (
        <div className="absolute bottom-2.5 left-2.5">
          <span className="bg-background/80 text-muted-foreground text-[9px] uppercase font-medium px-2 py-1 leading-none">
            Stock Out
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
