import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, X, LogOut, LayoutDashboard, Package, PackagePlus,
  Tag, Settings, Store, ChevronDown,
} from 'lucide-react';
import { useLogout } from '@/features/auth/hooks';
import { STORE_NAME } from '@/constants/config';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', label: 'All Products', icon: Package },
      { to: '/admin/products/new', label: 'Add Product', icon: PackagePlus, exact: true },
      { to: '/admin/categories', label: 'Categories', icon: Tag },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const productsLinks = navGroups.find((g) => g.label === 'Catalog')?.items ?? [];

const isLinkActive = (pathname, link) =>
  link.exact ? pathname === link.to : pathname.startsWith(link.to);

export const AdminSidebar = () => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const productsRef = useRef(null);
  const logout = useLogout();

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (productsRef.current && !productsRef.current.contains(e.target)) {
        setProductsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isProductsActive = productsLinks.some((l) => isLinkActive(pathname, l));

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">

          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-1">
            <Link to="/" className="font-serif text-xl tracking-widest shrink-0 mr-5">
              {STORE_NAME}
            </Link>

            <nav className="hidden md:flex items-center">
              {/* Dashboard */}
              <Link
                to="/admin/dashboard"
                className={cn(
                  'px-3 py-2 text-sm transition-colors',
                  pathname === '/admin/dashboard' ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Dashboard
              </Link>

              {/* Products dropdown */}
              <div ref={productsRef} className="relative">
                <button
                  onClick={() => setProductsOpen((o) => !o)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 text-sm transition-colors',
                    isProductsActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Products
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', productsOpen && 'rotate-180')} />
                </button>
                {productsOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-background border border-border shadow-md min-w-[160px]">
                    {productsLinks.map(({ to, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setProductsOpen(false)}
                        className={cn(
                          'block px-4 py-2.5 text-sm transition-colors',
                          isLinkActive(pathname, { to, exact: to === '/admin/products/new' })
                            ? 'bg-foreground text-background'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Categories + Settings */}
              {[
                { to: '/admin/categories', label: 'Categories' },
                { to: '/admin/settings', label: 'Settings' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-3 py-2 text-sm transition-colors whitespace-nowrap',
                    pathname === to ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground hidden md:flex items-center gap-1.5 transition-colors">
              <Store className="h-3.5 w-3.5" />
              View Store
            </Link>
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
            <button
              className="md:hidden p-2 -mr-2 relative z-50"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="absolute top-14 left-0 right-0 bg-background border-b border-border shadow-lg"
            style={{ animation: 'slideDown 0.22s cubic-bezier(0.25,0.1,0.25,1) both' }}
          >
            <div className="container mx-auto px-4 py-2">
              {navGroups.map((group, gi) => (
                <div key={gi} className={cn('py-2', gi > 0 && 'border-t border-border')}>
                  {group.label && (
                    <p className="px-1 py-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                      {group.label}
                    </p>
                  )}
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        'flex items-center gap-3 py-2.5 px-1 text-sm transition-colors',
                        isLinkActive(pathname, { to, exact: to === '/admin/products/new' || to === '/admin/dashboard' })
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="border-t border-border py-3 space-y-1">
                <Link to="/products" className="flex items-center gap-3 py-2.5 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Store className="h-4 w-4" /> View Store
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); logout.mutate(); }}
                  className="flex items-center gap-3 py-2.5 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};
