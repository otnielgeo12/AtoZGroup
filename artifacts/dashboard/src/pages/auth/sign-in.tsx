import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lock, User, Loader2 } from "lucide-react";

export default function SignInPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loggedInUser = await login(username, password);
      if (loggedInUser?.role === "admin_karaoke") {
        setLocation("/ladies");
      } else {
        setLocation("/home");
      }
    } catch (err: any) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Decorative colored glow spheres */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-red-850/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center transition-transform hover:scale-105 duration-300">
              <img 
                src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo-atoz.png`} 
                alt="AtoZ Group Logo" 
                className="h-24 w-auto object-contain" 
              />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">AtoZ Group</h1>
          <p className="text-zinc-400 font-medium">Dashboard Administration</p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your admin credentials to access operations
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-900/50 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-300">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold transition-all shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
