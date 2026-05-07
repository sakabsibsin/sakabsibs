import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout";
import {
  useListSettings,
  useUpsertSetting,
  getListSettingsQueryKey,
} from "@/lib/api-hooks";
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

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useListSettings();
  const upsertSetting = useUpsertSetting();

  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.["whatsapp_number"]) {
      setWhatsapp(settings["whatsapp_number"]);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateWhatsApp(whatsapp);
    if (error) {
      setWhatsappError(error);
      return;
    }
    setWhatsappError(null);

    upsertSetting.mutate(
      { key: "whatsapp_number", data: { value: whatsapp.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSettingsQueryKey() });
          toast({ title: "Settings saved", description: "WhatsApp number has been updated." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-serif tracking-wide mb-2">Settings</h1>
          <p className="text-muted-foreground text-sm">Configure your store settings.</p>
        </div>

        <div className="bg-card border border-border p-6 md:p-8">
          <h2 className="text-sm uppercase tracking-widest mb-6 pb-4 border-b border-border">WhatsApp</h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label className="uppercase tracking-widest text-xs">WhatsApp Number</Label>
              <Input
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  if (whatsappError) setWhatsappError(null);
                }}
                placeholder="+91 98765 43210"
                disabled={isLoading}
                className={`rounded-none focus-visible:ring-1 focus-visible:ring-foreground ${whatsappError ? "border-destructive" : "border-border"}`}
              />
              {whatsappError ? (
                <p className="text-xs text-destructive">{whatsappError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Include country code, e.g. +919876543210. Customers will be directed here when they tap "Enquire via WhatsApp".
                </p>
              )}
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-widest">Message Preview</p>
              <div className="bg-muted/50 border border-border p-4 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {`Hi, I want to enquire about this product.\n\nProduct Name: [Product Name]\nProduct Code: [e.g. BA101]\nPrice: ₹[Price]\nProduct Link: [Product URL]`}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={upsertSetting.isPending || isLoading}
                className="rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs h-12 px-8 transition-colors duration-200"
              >
                {upsertSetting.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
