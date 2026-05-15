import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSettings, useUpdateSetting } from '@/features/auth/hooks';
import { Skeleton } from '@/components/ui/Skeleton';
import { Breadcrumb } from '@/components/admin/Breadcrumb';

const inputCls = 'flex h-10 w-full border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground';
const btnCls = 'h-12 px-8 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none';

export const SettingsPage = () => {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSetting();

  const [whatsapp, setWhatsapp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!settings) return;
    if (settings.whatsapp_number) {
      // Strip country code prefix (+91 / 91) so the field shows only 10 digits
      const raw = settings.whatsapp_number.replace(/\D/g, '');
      setWhatsapp(raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw);
    }
  }, [settings]);

  const handleSave = (key, value, successMsg) => (e) => {
    e.preventDefault();
    update.mutate({ key, value: value.trim() }, {
      onSuccess: () => toast.success(successMsg),
      onError: () => toast.error('Failed to save. Please try again.'),
    });
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    update.mutate({ key: 'admin_password', value: newPassword }, {
      onSuccess: () => { toast.success('Password updated.'); setNewPassword(''); },
      onError: () => toast.error('Failed to update password.'),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Settings' }]} />

      <div>
        <h1 className="text-3xl font-serif tracking-wide mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm">Configure your store settings.</p>
      </div>

      {/* ── WhatsApp ───────────────────────────────── */}
      <div className="bg-card border border-border p-6 md:p-8">
        <h2 className="text-sm uppercase tracking-widest mb-6 pb-4 border-b border-border">WhatsApp</h2>
        <form onSubmit={handleSave('whatsapp_number', `+91${whatsapp}`, 'WhatsApp number updated.')} className="space-y-4">
          <div className="space-y-2">
            <label className="uppercase tracking-widest text-xs text-foreground">WhatsApp Number</label>
            <div className="flex">
              <span className="inline-flex items-center border border-border border-r-0 bg-muted/50 px-3 text-sm text-foreground/70 font-medium select-none shrink-0">
                +91
              </span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                inputMode="numeric"
                maxLength={10}
                className={inputCls}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your 10-digit number. The +91 country code is added automatically.
            </p>
          </div>
          <div className="border-t border-border pt-5">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-widest">Message Preview</p>
            <div className="bg-muted/50 border border-border p-4 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">{`Hello! I'm interested in ordering this product.

🛍️ Product: [Product Name]
🎨 Variant: [Selected Variant]
🔢 Quantity: [Qty]
📝 Note: [Note]
🔗 Product Link: [URL]

Could you please confirm availability and share more details? Thank you!`}</div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={update.isPending} className={btnCls}>Save WhatsApp</button>
          </div>
        </form>
      </div>

      {/* ── Admin Password ──────────────────────────── */}
      <div className="bg-card border border-border p-6 md:p-8">
        <h2 className="text-sm uppercase tracking-widest mb-6 pb-4 border-b border-border">Admin Password</h2>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="uppercase tracking-widest text-xs text-foreground">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className={inputCls} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={update.isPending} className={btnCls}>
              {update.isPending ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
