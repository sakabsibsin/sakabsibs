import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { AdminLayout } from "@/components/layout";
import {
  useListSettings,
  useUpsertSetting,
  getListSettingsQueryKey,
} from "@/lib/api-hooks";
import { uploadImage } from "@/services/uploadService";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function validateWhatsApp(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "WhatsApp number is required.";
  if (digits.length < 10) return "Enter a valid number with country code, e.g. +919876543210";
  return null;
}

function ImageSettingUpload({
  label,
  currentUrl,
  onUploaded,
}: {
  label: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUploaded(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="uppercase tracking-widest text-xs">{label}</Label>
      <div className="flex items-start gap-3">
        {currentUrl ? (
          <div className="w-20 h-20 border border-border overflow-hidden shrink-0 bg-muted">
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 border border-dashed border-border flex items-center justify-center shrink-0 bg-muted/30 text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-none uppercase tracking-widest text-xs h-8"
          >
            {uploading ? "Uploading…" : currentUrl ? "Change Image" : "Upload Image"}
          </Button>
          {currentUrl && (
            <p className="text-[10px] text-muted-foreground break-all max-w-[200px] truncate">{currentUrl}</p>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useListSettings();
  const upsertSetting = useUpsertSetting();

  const [storeName, setStoreName] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    if (settings["store_name"]) setStoreName(settings["store_name"]);
    if (settings["store_logo"]) setStoreLogo(settings["store_logo"]);
    if (settings["hero_image"]) setHeroImage(settings["hero_image"]);
    if (settings["hero_title"]) setHeroTitle(settings["hero_title"]);
    if (settings["hero_subtitle"]) setHeroSubtitle(settings["hero_subtitle"]);
    if (settings["instagram_link"]) setInstagram(settings["instagram_link"]);
    if (settings["whatsapp_number"]) setWhatsapp(settings["whatsapp_number"]);
  }, [settings]);

  const saveKey = (key: string, value: string) =>
    new Promise<void>((resolve, reject) => {
      upsertSetting.mutate(
        { key, data: { value } },
        { onSuccess: () => resolve(), onError: reject }
      );
    });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const waError = validateWhatsApp(whatsapp);
    if (waError) { setWhatsappError(waError); return; }
    setWhatsappError(null);
    setSaving(true);
    try {
      await Promise.all([
        storeName && saveKey("store_name", storeName.trim()),
        storeLogo && saveKey("store_logo", storeLogo),
        heroImage && saveKey("hero_image", heroImage),
        heroTitle && saveKey("hero_title", heroTitle.trim()),
        heroSubtitle && saveKey("hero_subtitle", heroSubtitle.trim()),
        instagram && saveKey("instagram_link", instagram.trim()),
        saveKey("whatsapp_number", whatsapp.trim()),
      ].filter(Boolean));
      queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() });
      toast({ title: "Settings saved", description: "All store settings have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save one or more settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-serif tracking-wide mb-1">Settings</h1>
          <p className="text-muted-foreground text-sm">Configure your store branding and contact details.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Store Branding ── */}
          <div className="bg-card border border-border p-6 md:p-8 space-y-6">
            <h2 className="text-xs uppercase tracking-widest pb-4 border-b border-border">Store Branding</h2>

            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">Store Name</Label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Aurum"
                disabled={isLoading}
                className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground"
              />
              <p className="text-xs text-muted-foreground">Displayed in navbar, footer, and browser tab.</p>
            </div>

            <ImageSettingUpload
              label="Store Logo"
              currentUrl={storeLogo}
              onUploaded={setStoreLogo}
            />
          </div>

          {/* ── Homepage ── */}
          <div className="bg-card border border-border p-6 md:p-8 space-y-6">
            <h2 className="text-xs uppercase tracking-widest pb-4 border-b border-border">Homepage</h2>

            <ImageSettingUpload
              label="Hero Banner Image"
              currentUrl={heroImage}
              onUploaded={setHeroImage}
            />

            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">Hero Title</Label>
              <Input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="AURUM"
                disabled={isLoading}
                className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">Hero Subtitle</Label>
              <Input
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Whisper-quiet luxury"
                disabled={isLoading}
                className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground"
              />
            </div>
          </div>

          {/* ── Contact & Social ── */}
          <div className="bg-card border border-border p-6 md:p-8 space-y-6">
            <h2 className="text-xs uppercase tracking-widest pb-4 border-b border-border">Contact & Social</h2>

            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">Instagram Link</Label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                disabled={isLoading}
                className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">WhatsApp Number</Label>
              <Input
                value={whatsapp}
                onChange={(e) => { setWhatsapp(e.target.value); if (whatsappError) setWhatsappError(null); }}
                placeholder="+91 98765 43210"
                disabled={isLoading}
                className={`rounded-none focus-visible:ring-1 focus-visible:ring-foreground ${whatsappError ? "border-destructive" : "border-border"}`}
              />
              {whatsappError ? (
                <p className="text-xs text-destructive">{whatsappError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Include country code. Customers are directed here when enquiring.</p>
              )}
            </div>

            {/* WhatsApp message preview */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">WhatsApp Message Preview</p>
              <div className="bg-muted/50 border border-border p-4 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {`Hi, I want to enquire about this product.\n\nProduct Name: [Product Name]\nProduct Code: [e.g. BA101]\nPrice: ₹[Price]\nProduct Link: [Product URL]`}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving || isLoading}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs h-12 px-8"
            >
              {saving ? "Saving…" : "Save All Settings"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
