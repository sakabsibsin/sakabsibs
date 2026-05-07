import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedAdminRoute } from "@/components/protected-admin-route";
import NotFound from "@/pages/not-found";

import Home from "./pages/home";
import Catalog from "./pages/catalog";
import ProductDetail from "./pages/product-detail";
import AdminLogin from "./pages/admin-login";
import AdminDashboard from "./pages/admin-dashboard";
import AdminProductForm from "./pages/admin-product-form";
import AdminCategories from "./pages/admin-categories";
import AdminSettings from "./pages/admin-settings";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Catalog} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin">
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        </Route>
        <Route path="/admin/products/new">
          <ProtectedAdminRoute>
            <AdminProductForm />
          </ProtectedAdminRoute>
        </Route>
        <Route path="/admin/products/:id/edit">
          <ProtectedAdminRoute>
            <AdminProductForm />
          </ProtectedAdminRoute>
        </Route>
        <Route path="/admin/categories">
          <ProtectedAdminRoute>
            <AdminCategories />
          </ProtectedAdminRoute>
        </Route>
        <Route path="/admin/settings">
          <ProtectedAdminRoute>
            <AdminSettings />
          </ProtectedAdminRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
