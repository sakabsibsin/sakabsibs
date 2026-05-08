import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { uploadImage } from "@/services/uploadService";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    const newIndex = value.length;
    setPreviews((prev) => ({ ...prev, [newIndex]: localPreview }));
    setUploading(true);

    try {
      const url = await uploadImage(file);
      onChange([...value, url]);
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[newIndex];
        URL.revokeObjectURL(localPreview);
        return next;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[newIndex];
        URL.revokeObjectURL(localPreview);
        return next;
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const allImages: { src: string; isPending: boolean }[] = [
    ...value.map((src) => ({ src, isPending: false })),
    ...Object.values(previews).map((src) => ({ src, isPending: true })),
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {allImages.map((img, i) => (
          <div key={i} className="relative aspect-square border border-border overflow-hidden bg-muted">
            <img
              src={img.src}
              alt={`Image ${i + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${img.isPending ? "opacity-40" : "opacity-100"}`}
            />
            {/* Single loader — only on the pending image tile */}
            {img.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!img.isPending && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 bg-background/90 border border-border p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
                data-testid={`button-remove-image-${i}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {/* Add button — disabled during upload, no secondary spinner */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="button-add-image"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs uppercase tracking-widest">
            {uploading ? "Uploading…" : "Add Image"}
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-image-file"
      />

      {value.length === 0 && Object.keys(previews).length === 0 && (
        <p className="text-xs text-muted-foreground">At least one image is required.</p>
      )}
    </div>
  );
}
