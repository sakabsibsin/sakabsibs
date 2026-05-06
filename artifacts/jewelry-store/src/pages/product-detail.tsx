import { useState } from "react";
import { useParams } from "wouter";
import { StoreLayout } from "@/components/layout";
import { useGetProduct, useListSettings, getGetProductQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const params = useParams();
  const id = Number(params.id);
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
        <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="space-y-8 pt-8">
            <Skeleton className="h-10 w-2/3 rounded-none" />
            <Skeleton className="h-6 w-1/3 rounded-none" />
            <Skeleton className="h-32 w-full rounded-none" />
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
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

          {/* Images */}
          <div className="space-y-3">
            {images.length > 0 ? (
              <>
                <div className="aspect-[3/4] w-full bg-muted border border-border overflow-hidden">
                  <img
                    src={images[activeImage]}
                    alt={`${product.name} view ${activeImage + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`w-16 h-16 border overflow-hidden shrink-0 transition-all ${
                          i === activeImage ? "border-foreground" : "border-border opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[3/4] w-full bg-muted flex items-center justify-center border border-border">
                <span className="text-muted-foreground font-serif italic">No image available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-32 self-start space-y-12">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{product.productCode}</p>
              <h1 className="text-4xl font-serif tracking-wide mb-4">{product.name}</h1>
              <p className="text-xl tracking-wider">
                ₹{product.price.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
              <p>{product.description}</p>

              <ul className="space-y-2 border-t border-border pt-6 mt-6">
                <li className="flex gap-4">
                  <span className="text-muted-foreground w-24 uppercase tracking-widest text-xs">Material</span>
                  <span className="capitalize">{product.material}</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-muted-foreground w-24 uppercase tracking-widest text-xs">Category</span>
                  <span className="capitalize">{product.category}</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-muted-foreground w-24 uppercase tracking-widest text-xs">Code</span>
                  <span>{product.productCode}</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-muted-foreground w-24 uppercase tracking-widest text-xs">Status</span>
                  <span>{product.inStock ? "In Stock" : "Sold Out"}</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={handleOrder}
                disabled={!product.inStock}
                className={`w-full py-4 text-sm uppercase tracking-widest border transition-colors duration-500
                  ${product.inStock
                    ? "bg-foreground text-background border-foreground hover:bg-background hover:text-foreground"
                    : "bg-muted text-muted-foreground border-border cursor-not-allowed"}
                `}
              >
                {product.inStock ? "Enquire / Order via WhatsApp" : "Sold Out"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </StoreLayout>
  );
}
