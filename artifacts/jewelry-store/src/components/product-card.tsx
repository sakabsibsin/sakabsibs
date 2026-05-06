import { Link } from "wouter";
import type { Product } from "@workspace/api-client-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="group block cursor-pointer">
      <div className="relative aspect-[4/5] mb-2.5 overflow-hidden bg-muted border border-border">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-serif italic">
            No image
          </div>
        )}

        {!product.inStock && (
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 text-[10px] uppercase tracking-widest border border-border">
            Sold Out
          </div>
        )}

        {product.featured && product.inStock && (
          <div className="absolute top-2 right-2 bg-foreground/90 text-background px-2 py-0.5 text-[10px] uppercase tracking-widest">
            Featured
          </div>
        )}
      </div>

      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-medium tracking-wide leading-snug truncate">{product.name}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 capitalize">{product.material}</p>
        </div>
        <p className="text-xs sm:text-sm tracking-wide shrink-0">
          ₹{product.price.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>
    </Link>
  );
}
