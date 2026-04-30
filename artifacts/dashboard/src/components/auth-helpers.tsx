import { useAuth } from "@clerk/react";
import { Redirect, useLocation } from "wouter";

export function RedirectToSignIn() {
  const [, setLocation] = useLocation();
  setLocation("/sign-in");
  return null;
}

export function RequireAuth({ children }: { children: React.ReactNode | ((userId: string, location: ReturnType<typeof useLocation>[1]) => React.ReactNode) }) {
  const { isLoaded, userId } = useAuth();
  const [, setLocation] = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!userId) {
    return <RedirectToSignIn />;
  }

  return <>{typeof children === "function" ? children(userId, { setLocation } as any) : children}</>;
}
