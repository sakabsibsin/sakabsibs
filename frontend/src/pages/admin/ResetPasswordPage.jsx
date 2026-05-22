import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { STORE_NAME } from '@/constants/config';
import { getApiError } from '@/lib/utils';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success
  const [errorMsg, setErrorMsg] = useState('');

  // Missing token = link was opened without ?token= param. Surface immediately
  // so the user isn't presented with a form that's guaranteed to fail.
  const missingToken = !token;

  useEffect(() => {
    if (missingToken) {
      setErrorMsg('Invalid reset link. Please request a new one.');
    }
  }, [missingToken]);

  const validate = () => {
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return false;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading' || missingToken) return;
    if (!validate()) return;

    setStatus('loading');
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setStatus('success');
      toast.success('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setErrorMsg(getApiError(err, 'Reset link is invalid or has expired.'));
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center">
          <h1 className="font-serif text-4xl tracking-widest mb-2">{STORE_NAME}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Set New Password</p>
        </div>

        {/* Card */}
        <div className="border border-border p-8">
          {status === 'success' ? (
            <div className="space-y-3 text-center">
              <p className="font-serif text-lg font-light">Password reset successfully</p>
              <p className="text-xs text-muted-foreground">Redirecting to login...</p>
            </div>
          ) : missingToken ? (
            <div className="space-y-3 text-center">
              <p className="font-serif text-lg font-light">Invalid link</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This reset link is missing or malformed. Please request a new one.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="uppercase tracking-widest text-xs text-foreground">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="flex h-10 w-full border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="uppercase tracking-widest text-xs text-foreground">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Repeat new password"
                  className="flex h-10 w-full border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
                />
              </div>

              {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}

              <button
                type="submit"
                disabled={status === 'loading' || !password.trim() || !confirm.trim()}
                className="w-full h-12 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/admin/login" className="hover:text-foreground transition-colors">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};
