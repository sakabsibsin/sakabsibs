import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useUpdateSetting } from '@/features/auth/hooks';
import { getApiError } from '@/lib/utils';
import { removeToken } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/Skeleton';

const inputCls = 'flex h-10 w-full border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground';
const btnCls = 'h-12 px-8 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none';

export const SettingsPage = () => {
  const navigate = useNavigate();
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
      onError: (err) => toast.error(getApiError(err, 'Failed to save. Please try again.')),
    });
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    const trimmed = newPassword.trim();
    // Server enforces 8 chars (auth.controller resetPassword + setting.controller upsert).
    // Mirror it here so the user gets immediate feedback instead of a round-trip rejection.
    if (trimmed.length < 8) return toast.error('Password must be at least 8 characters.');
    update.mutate({ key: 'admin_password', value: trimmed }, {
      onSuccess: (data) => {
        setNewPassword('');
        // Backend signals a password change — invalidate the current session
        // by clearing the token and redirecting to login. The old JWT remains
        // technically valid until expiry but is no longer attached to any request.
        if (data?.passwordChanged) {
          toast.success('Password changed. Please log in again.');
          setTimeout(() => {
            removeToken();
            navigate('/admin/login');
          }, 1500);
        } else {
          toast.success('Password updated.');
        }
      },
      onError: (err) => toast.error(getApiError(err, 'Failed to update password.')),
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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/admin/dashboard"
            className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-serif tracking-wide">Settings</h1>
        </div>
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
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              className={inputCls}
            />
            <p className="text-xs text-muted-foreground/70">
              You will be logged out and asked to sign in again after changing.
            </p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={update.isPending || !newPassword.trim()} className={btnCls}>
              {update.isPending ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
