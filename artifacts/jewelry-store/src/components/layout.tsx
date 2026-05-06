import { Link, useLocation } from "wouter";

export function Navbar() {
  const [location] = useLocation();

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
        
        <div className="flex-1 flex items-center justify-end">
          <button className="text-sm uppercase tracking-widest hover:text-muted-foreground transition-colors">
            Bag (0)
          </button>
        </div>
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

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/20">
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-serif text-xl tracking-widest">AURUM</Link>
            <nav className="flex items-center gap-4">
              <Link href="/admin" className={`text-sm ${location === '/admin' ? 'font-medium' : 'text-muted-foreground'}`}>
                Dashboard
              </Link>
              <Link href="/admin/products/new" className={`text-sm ${location === '/admin/products/new' ? 'font-medium' : 'text-muted-foreground'}`}>
                Add Product
              </Link>
            </nav>
          </div>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            View Store &rarr;
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
