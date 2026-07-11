import { useAuth } from "@/lib/auth-context";
import { Redirect, useLocation } from "wouter";

export function RedirectToSignIn() {
  const [, setLocation] = useLocation();
  // Ensure we push state cleanly
  setLocation("/sign-in");
  return null;
}

export function RequireAuth({ children }: { children: React.ReactNode | ((userId: string, location: ReturnType<typeof useLocation>[1]) => React.ReactNode) }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <RedirectToSignIn />;
  }

  const userIdStr = user.id.toString();
  return <>{typeof children === "function" ? children(userIdStr, { setLocation } as any) : children}</>;
}

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Redirect to="/home" />;
  }

  return <>{children}</>;
}
