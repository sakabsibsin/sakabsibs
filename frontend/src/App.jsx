import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { getToken } from '@/lib/apiClient';
import { ScrollManager } from '@/components/ScrollManager';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { HomePage } from '@/pages/store/HomePage';
import { CatalogPage } from '@/pages/store/CatalogPage';
import { ProductDetailPage } from '@/pages/store/ProductDetailPage';
import { AboutPage } from '@/pages/store/AboutPage';
import { ContactPage } from '@/pages/store/ContactPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { CategoriesPage } from '@/pages/admin/CategoriesPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { ProductForm } from '@/components/admin/ProductForm';
import { RestockPage } from '@/pages/admin/RestockPage';

/* ── Layouts ──────────────────────────────────── */
const StoreLayout = () => (
  <div className="flex min-h-[100dvh] flex-col">
    <Navbar />
    <main className="flex-1"><Outlet /></main>
    <Footer />
  </div>
);

const AdminLayout = () => {
  // Synchronous localStorage check — no token means definitely not logged in.
  // Redirect before any admin content renders, eliminating the flash.
  if (!getToken()) return <Navigate to="/admin/login" replace />;
  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/20">
      <AdminSidebar />
      <main className="flex-1 container mx-auto px-4 pt-4 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

const NewProductPage = () => <ProductForm />;
const EditProductPage = () => {
  const { id } = useParams();
  return <ProductForm productId={id} />;
};

/* ── 404 ──────────────────────────────────────── */
const NotFoundPage = () => (
  <div className="flex min-h-[100dvh] flex-col items-center justify-center text-center px-4">
    <p className="font-serif text-[8rem] font-light leading-none text-muted-foreground/15 select-none">404</p>
    <h1 className="mt-2 font-serif text-2xl font-light">Page not found</h1>
    <p className="mt-3 text-sm font-light text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
    <a
      href="/"
      className="group mt-8 inline-flex items-center gap-2 text-2xs tracking-[0.2em] uppercase font-light text-muted-foreground hover:text-foreground transition-colors border-b border-border hover:border-foreground pb-0.5"
    >
      <ArrowLeft className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
      Go home
    </a>
  </div>
);

/* ── Router ───────────────────────────────────── */
export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
      {/* ── Store (public) ─────────────────── */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* ── Admin (protected via 401 redirect) ─ */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<NewProductPage />} />
        <Route path="products/:id/edit" element={<EditProductPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="restock" element={<RestockPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* ── 404 ────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
