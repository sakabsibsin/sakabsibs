import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '@/features/auth/hooks';
import { STORE_NAME } from '@/constants/config';

export const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    login.mutate(password.trim(), {
      onSuccess: () => navigate('/admin/dashboard'),
      onError: () => {
        setError('Incorrect password. Please try again.');
        setPassword('');
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center">
          <h1 className="font-serif text-4xl tracking-widest mb-2">{STORE_NAME}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin Access</p>
        </div>

        {/* Form */}
        <div className="border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="uppercase tracking-widest text-xs text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Enter admin password"
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
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={login.isPending || !password.trim()}
              className="w-full h-12 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {login.isPending ? 'Verifying...' : 'Enter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
};
