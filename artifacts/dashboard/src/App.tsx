import { Switch, Route, Router as WouterRouter, useLocation, useRoute, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

// Pages
import SignInPage from "./pages/auth/sign-in";
import SignUpPage from "./pages/auth/sign-up";
import HomePage from "./pages/home";
import BannersPage from "./pages/banners";
import OutletsPage from "./pages/outlets";
import OutletDetailPage from "./pages/outlets/detail";
import GalleryPage from "./pages/gallery";
import SiteInfoPage from "./pages/site-info";
import { Layout } from "./components/layout";
import { RequireAuth, RedirectToSignIn } from "./components/auth-helpers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ClerkQueryClientCacheInvalidator() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      queryClient.clear();
    }
  }, [userId, queryClient]);

  return null;
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPubKey) {
  throw new Error("Missing Publishable Key");
}
const pubKey = publishableKeyFromHost(window.location.hostname, clerkPubKey);

function AppRouter() {
  return (
    <Switch>
      <Route path="/sign-in/*?">
        <SignInPage />
      </Route>
      <Route path="/sign-up/*?">
        <SignUpPage />
      </Route>
      
      <Route path="/">
        <RequireAuth>
          <Redirect to="/home" />
        </RequireAuth>
      </Route>

      <Route path="/home">
        <RequireAuth>
          <Layout>
            <HomePage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/banners">
        <RequireAuth>
          <Layout>
            <BannersPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/outlets">
        <RequireAuth>
          <Layout>
            <OutletsPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/outlets/:id">
        <RequireAuth>
          <Layout>
            <OutletDetailPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/gallery">
        <RequireAuth>
          <Layout>
            <GalleryPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/site-info">
        <RequireAuth>
          <Layout>
            <SiteInfoPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <ClerkProvider 
      publishableKey={pubKey} 
      proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL}
      routerPush={(to) => {
        if (to.startsWith(basePath)) {
          window.history.pushState(null, "", to);
        } else {
          window.history.pushState(null, "", `${basePath}${to}`);
        }
      }}
      routerReplace={(to) => {
        if (to.startsWith(basePath)) {
          window.history.replaceState(null, "", to);
        } else {
          window.history.replaceState(null, "", `${basePath}${to}`);
        }
      }}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "hsl(350, 45%, 45%)",
        },
        layout: {
          logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
          logoPlacement: "inside",
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
