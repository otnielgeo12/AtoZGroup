import React from "react";

export function ClerkProvider({ children }: any) {
  return <>{children}</>;
}

export function useAuth() {
  return { 
    isLoaded: true, 
    userId: "local-dev-user", 
    sessionId: "mock-session" 
  };
}

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "local-dev-user",
      fullName: "Local Developer",
      primaryEmailAddress: { emailAddress: "dev@localhost" },
      imageUrl: "",
    }
  };
}

export function UserButton() {
  return (
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs cursor-pointer">
      DEV
    </div>
  );
}

export function SignIn() {
  return <div>Sign In (Mocked for Local Dev)</div>;
}

export function SignUp() {
  return <div>Sign Up (Mocked for Local Dev)</div>;
}

// Ensure internal utilities that are sometimes imported still exist
export const publishableKeyFromHost = () => "mock-key";
