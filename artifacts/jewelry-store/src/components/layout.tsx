import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useListSettings } from "@/lib/api-hooks";

export function Navbar() {
  const { isAuthed } = useAdminAuth();
  const { data: settings } = useListSettings();
  const storeName = settings?.["store_name"] || "AURUM";
  const storeLogo = settings?.["store_logo"] || "";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center">
        {/* Left — Shop */}
        <div className="flex-1 flex items-center">
          <Link href="/products" className="text-sm uppercase tracking-widest hover:text-muted-foreground transition-colors">
            Shop
          </Link>
        </div>

        {/* Center — Brand */}
        <Link href="/" className="flex-1 flex items-center justify-center cursor-pointer">
          {storeLogo ? (
            <img src={storeLogo} alt={storeName} className="h-8 max-w-[120px] object-contain" />
          ) : (
            <span className="font-serif text-3xl tracking-widest">{storeName}</span>
          )}
        </Link>

        {/* Right — Admin (only if logged in) */}
        <div className="flex-1 flex items-center justify-end">
          {isAuthed && (
            <Link href="/admin" className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { data: settings } = useListSettings();
  const storeName = settings?.["store_name"] || "AURUM";
  const instagramLink = settings?.["instagram_link"] || "#";

  return (
    <footer className="bg-background border-t border-border mt-8 py-8">
      <div className="container mx-auto px-4 md:px-8 flex flex-col items-center gap-4 text-center">
        <span className="font-serif text-xl tracking-widest">{storeName}</span>
        <div className="flex items-center gap-6 text-xs uppercase tracking-widest">
          <a
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Instagram
          </a>
          <a
            href={`https://wa.me/${(settings?.["whatsapp_number"] || "").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </a>
        </div>
        <a
          href="https://shopflow.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted-foreground/60 tracking-wide hover:text-muted-foreground transition-colors border-t border-border/50 pt-4 mt-1 w-full"
        >
          Powered by <span className="font-medium text-muted-foreground">ShopFlo</span>
        </a>
      </div>
    </footer>
  );
}

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col pt-16 overflow-x-hidden w-full">
      <Navbar />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer />
    </div>
  );
}

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/products/new", label: "Add Product" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAdminAuth();
  const { data: settings } = useListSettings();
  const storeName = settings?.["store_name"] || "AURUM";

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/20">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-xl tracking-widest shrink-0">{storeName}</Link>
            <nav className="hidden md:flex items-center gap-4">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm whitespace-nowrap ${location === link.href ? "font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground hidden md:block">
              View Store &rarr;
            </Link>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
            <button
              className="md:hidden p-2 -mr-2"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — fixed overlay, never shifts page content */}
      {menuOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setMenuOpen(false)} />
          <div className="md:hidden fixed top-14 left-0 right-0 z-50 bg-background border-b border-border shadow-lg">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-2.5 text-sm border-b border-border/50 last:border-0 ${location === link.href ? "font-medium" : "text-muted-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/products"
                onClick={() => setMenuOpen(false)}
                className="py-2.5 text-sm text-muted-foreground border-t border-border mt-1 pt-3"
              >
                View Store &rarr;
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="py-2.5 text-sm text-muted-foreground text-left flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </nav>
          </div>
        </>
      )}

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
