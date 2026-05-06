import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex-1 flex items-center gap-6">
          <Link href="/products" className="text-sm uppercase tracking-widest hover:text-muted-foreground transition-colors">
            Shop
          </Link>
          <Link href="/admin" className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors hidden md:block">
            Admin
          </Link>
        </div>

        <Link href="/" className="font-serif text-3xl tracking-widest cursor-pointer text-center flex-1">
          AURUM
        </Link>

        <div className="flex-1" />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-32 py-16">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="font-serif text-2xl tracking-widest">AURUM</div>
        <div className="text-sm text-muted-foreground font-light">
          Whisper-quiet luxury.
        </div>
        <div className="flex gap-6 text-sm uppercase tracking-widest">
          <a href="#" className="hover:text-muted-foreground transition-colors">Instagram</a>
          <a href="#" className="hover:text-muted-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col pt-16">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products/new", label: "Add Product" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/20">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-xl tracking-widest shrink-0">AURUM</Link>
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
              className="md:hidden p-2 -mr-2"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              data-testid="button-mobile-menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-2 text-sm ${location === link.href ? "font-medium" : "text-muted-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/products"
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm text-muted-foreground border-t border-border mt-2 pt-3"
              >
                View Store &rarr;
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
