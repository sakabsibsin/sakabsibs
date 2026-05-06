import { Link } from "wouter";
import { StoreLayout } from "@/components/layout";
import { ProductCard } from "@/components/product-card";
import { useGetFeaturedProducts } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: featuredProducts, isLoading } = useGetFeaturedProducts();

  return (
    <StoreLayout>
      {/* Hero Section */}
      <section className="relative h-[calc(100dvh-4rem)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-muted -z-10">
          <img 
            src="https://images.unsplash.com/photo-1599643478514-4a4e09b5220c?q=80&w=2940&auto=format&fit=crop" 
            alt="Aurum Jewelry Collection" 
            className="w-full h-full object-cover opacity-90"
          />
        </div>
        <div className="text-center z-10 p-8 bg-background/50 backdrop-blur-sm border border-border/50">
          <h1 className="text-6xl md:text-8xl lg:text-9xl tracking-[0.1em] text-foreground font-serif">AURUM</h1>
          <p className="mt-6 text-sm md:text-base tracking-[0.2em] uppercase text-foreground/80">Whisper-quiet luxury</p>
          <div className="mt-12">
            <Link href="/products" className="inline-block border border-foreground px-8 py-3 text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors duration-500">
              Discover the Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="py-32 px-4 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl leading-relaxed text-foreground font-serif italic">
          "Every piece is considered, every interaction unhurried. Pure lines, absolute precision, and nothing unnecessary."
        </h2>
      </section>

      {/* Featured Products */}
      <section className="px-4 md:px-8 pb-32">
        <div className="flex items-end justify-between mb-12 border-b border-border pb-4">
          <h2 className="text-2xl font-serif tracking-widest uppercase">Featured</h2>
          <Link href="/products" className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full rounded-none" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2 rounded-none" />
                  <Skeleton className="h-3 w-1/4 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
