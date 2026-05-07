import { Link } from "wouter";
import { StoreLayout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { useGetFeaturedProducts } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5";

export default function Home() {
  const { data: featuredProducts, isLoading } = useGetFeaturedProducts();

  return (
    <StoreLayout>
      {/* Hero Section */}
      <section className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-muted">
        <img
          src="https://images.unsplash.com/photo-1599643478514-4a4e09b5220c?q=80&w=2940&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
        />
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="text-center p-8 sm:p-12 bg-background/50 backdrop-blur-sm border border-border/50">
            <h1 className="text-6xl md:text-8xl lg:text-9xl tracking-[0.1em] text-foreground font-serif">AURUM</h1>
            <p className="mt-6 text-sm md:text-base tracking-[0.2em] uppercase text-foreground/80">Whisper-quiet luxury</p>
            <div className="mt-10 md:mt-12">
              <Link href="/products" className="inline-block border border-foreground px-8 py-3 text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors duration-500">
                Discover the Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="py-20 md:py-28 px-4 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl leading-relaxed text-foreground font-serif italic">
          "Every piece is considered, every interaction unhurried. Pure lines, absolute precision, and nothing unnecessary."
        </h2>
      </section>

      {/* Featured Products */}
      <section className="px-3 sm:px-4 md:px-8 pb-16 md:pb-20">
        <div className="flex items-end justify-between mb-6 md:mb-8 border-b border-border pb-3">
          <h2 className="text-xl md:text-2xl font-serif tracking-widest uppercase">Featured</h2>
          <Link href="/products" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className={GRID}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/5] w-full rounded-none" />
                <Skeleton className="h-3 w-3/4 rounded-none" />
                <Skeleton className="h-2.5 w-1/3 rounded-none" />
              </div>
            ))}
          </div>
        ) : (
          <div className={GRID}>
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="mt-10 md:mt-12 text-center">
            <Link
              href="/products"
              className="inline-block border border-foreground px-10 py-3 text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors duration-500"
            >
              View All Products
            </Link>
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
