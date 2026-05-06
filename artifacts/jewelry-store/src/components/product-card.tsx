import { Link } from "wouter";
import type { Product } from "@workspace/api-client-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="group block cursor-pointer">
      <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-muted border border-border">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-serif italic">
            No image
          </div>
        )}
        
        {!product.inStock && (
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 text-xs uppercase tracking-widest border border-border">
            Sold Out
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium tracking-wide">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{product.material}</p>
        </div>
        <p className="text-sm tracking-wide">${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
    </Link>
  );
}
