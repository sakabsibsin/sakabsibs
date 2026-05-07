import { useLocation, Redirect } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAdminAuth();
  const [location] = useLocation();

  if (!isAuthed) {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
}
