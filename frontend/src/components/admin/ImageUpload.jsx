import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const getPreviewUrl = (item) =>
  typeof item === 'string' ? item : URL.createObjectURL(item);

export const ImageUpload = ({ images = [], onChange, maxImages = 8 }) => {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const picked = Array.from(e.target.files || []);
    const remaining = maxImages - images.length;
    const valid = [];

    for (const file of picked.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image. Only JPEG, PNG, and WebP are supported.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" is too large. Maximum file size is 10MB.`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length) onChange([...images, ...valid]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {images.map((item, i) => (
          <div key={i} className="relative aspect-square bg-muted border border-border overflow-hidden">
            <img src={getPreviewUrl(item)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md transition-colors z-10"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">Add</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleChange} className="hidden" />
      <p className="text-xs text-muted-foreground">{images.length}/{maxImages} images · JPEG, PNG, WebP · Max 10MB each</p>
    </div>
  );
};
