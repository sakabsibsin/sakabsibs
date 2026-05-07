import { useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { StoreLayout } from "@/components/layout";
import { useGetProduct, useListSettings, getGetProductQueryKey } from "@/lib/api-hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const params = useParams();
  const id = params.id as string;
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading, error } = useGetProduct(id, {
    query: {
      enabled: !!id,
      queryKey: getGetProductQueryKey(id),
    },
  });

  const { data: settings } = useListSettings();
  const whatsappNumber = settings?.["whatsapp_number"] ?? "1234567890";

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 md:px-8 pt-6 pb-12 md:pt-10 md:pb-16">
          <Skeleton className="h-4 w-24 rounded-none mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-8 md:gap-12 lg:gap-16 items-start">
            <Skeleton className="aspect-[3/4] w-full rounded-none" />
            <div className="space-y-5 md:pt-2">
              <Skeleton className="h-4 w-24 rounded-none" />
              <Skeleton className="h-9 w-3/4 rounded-none" />
              <Skeleton className="h-6 w-1/3 rounded-none" />
              <Skeleton className="h-20 w-full rounded-none" />
              <Skeleton className="h-px w-full rounded-none" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-full rounded-none" />)}
              </div>
              <Skeleton className="h-14 w-full rounded-none" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (error || !product) {
    return (
      <StoreLayout>
        <div className="py-32 text-center text-muted-foreground font-serif italic text-xl">
          Product not found.
        </div>
      </StoreLayout>
    );
  }

  const productUrl = `${window.location.origin}/products/${product.id}`;

  const handleOrder = () => {
    const message = [
      `Hi, I want to enquire about this product.`,
      ``,
      `Product Name: ${product.name}`,
      `Product Code: ${product.productCode}`,
      `Price: ₹${product.price.toLocaleString("en-IN")}`,
      `Product Link: ${productUrl}`,
    ].join("\n");
    const number = whatsappNumber.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const images = product.images ?? [];

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 md:px-8 pt-6 pb-12 md:pt-10 md:pb-16">

        {/* Breadcrumb */}
        <Link href="/products" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-8">
          <ChevronLeft className="w-3.5 h-3.5" />
          Collection
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-8 md:gap-12 lg:gap-16 items-start">

          {/* ── Images column ── */}
          <div>
            {/* Main image */}
            <div className="aspect-[3/4] w-full bg-muted border border-border overflow-hidden">
              {images.length > 0 ? (
                <img
                  key={activeImage}
                  src={images[activeImage]}
                  alt={`${product.name} — view ${activeImage + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground font-serif italic text-sm">No image available</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 border overflow-hidden shrink-0 transition-all duration-200 ${
                      i === activeImage
                        ? "border-foreground"
                        : "border-border opacity-50 hover:opacity-90"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details column ── */}
          <div className="md:sticky md:top-24 space-y-6">

            {/* Header */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                {product.productCode}
              </p>
              <h1 className="text-2xl md:text-3xl font-serif tracking-wide leading-snug mb-3">
                {product.name}
              </h1>
              <p className="text-2xl tracking-wider font-light">
                ₹{product.price.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm leading-relaxed text-foreground/75">
                {product.description}
              </p>
            )}

            {/* Specs */}
            <ul className="space-y-3 border-t border-border pt-5 text-sm">
              {[
                { label: "Material", value: product.material },
                { label: "Category", value: product.category },
                { label: "Code", value: product.productCode, mono: true },
                { label: "Status", value: product.inStock ? "In Stock" : "Sold Out" },
              ].map(({ label, value, mono }) => (
                <li key={label} className="flex gap-4">
                  <span className="text-muted-foreground w-20 uppercase tracking-widest text-[11px] shrink-0 pt-px">
                    {label}
                  </span>
                  <span className={`capitalize ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={handleOrder}
              disabled={!product.inStock}
              className={`w-full py-4 text-xs uppercase tracking-[0.2em] border transition-colors duration-500
                ${product.inStock
                  ? "bg-foreground text-background border-foreground hover:bg-background hover:text-foreground"
                  : "bg-muted text-muted-foreground border-border cursor-not-allowed"}
              `}
            >
              {product.inStock ? "Enquire / Order via WhatsApp" : "Sold Out"}
            </button>

            {!product.inStock && (
              <p className="text-center text-xs text-muted-foreground tracking-wide">
                This piece is currently unavailable. Contact us to be notified.
              </p>
            )}
          </div>

        </div>
      </div>
    </StoreLayout>
  );
}
