import { useState, useRef } from "react";
import { Plus, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

async function uploadImageFile(file: File): Promise<string> {
  const res = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, objectPath } = await res.json();

  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Failed to upload image");

  return `/api/storage${objectPath}`;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    const newIndex = value.length;
    setPreviews((prev) => ({ ...prev, [newIndex]: localPreview }));

    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      const updated = [...value, url];
      onChange(updated);
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[newIndex];
        URL.revokeObjectURL(localPreview);
        return next;
      });
    } catch {
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
              className={`w-full h-full object-cover ${img.isPending ? "opacity-50" : ""}`}
            />
            {img.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!img.isPending && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-background/80 border border-border p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                data-testid={`button-remove-image-${i}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
          data-testid="button-add-image"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span className="text-xs uppercase tracking-widest">Add Image</span>
            </>
          )}
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
