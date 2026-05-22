import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { STORE_NAME } from '@/constants/config';
import { getApiError } from '@/lib/utils';

export const ForgotPasswordPage = () => {
  // status: idle | loading | success | error
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      // No body — backend reads admin_email from the Settings collection.
      // The frontend must never send or know the admin email.
      await apiClient.post('/auth/forgot-password');
      setStatus('success');
    } catch (err) {
      setErrorMsg(getApiError(err, 'Could not send reset link. Please try again.'));
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center">
          <h1 className="font-serif text-4xl tracking-widest mb-2">{STORE_NAME}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Reset Password</p>
        </div>

        {/* Card */}
        <div className="border border-border p-8">
          {status === 'success' ? (
            <div className="space-y-3 text-center">
              <p className="font-serif text-lg font-light">Reset link sent</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check your email inbox. The link expires in one hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-xs text-muted-foreground leading-relaxed text-center">
                A reset link will be sent to your email.
              </p>

              {status === 'error' && (
                <p className="text-xs text-destructive">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full h-12 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
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
