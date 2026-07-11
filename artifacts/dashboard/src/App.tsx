import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

// Pages
import SignInPage from "./pages/auth/sign-in";
import HomePage from "./pages/home";
import BannersPage from "./pages/banners";
import OutletsPage from "./pages/outlets";
import OutletDetailPage from "./pages/outlets/detail";
import GalleryPage from "./pages/gallery";
import SiteInfoPage from "./pages/site-info";
import CrmPage from "./pages/crm/index";
import CrmDetailPage from "./pages/crm/detail";
import UserManagementPage from "./pages/users";
import LadiesPage from "./pages/ladies/index";
import LadiesOutletPage from "./pages/ladies/outlet";
import LadiesInRoomPage from "./pages/ladies/in-room";
import AddLadyPage from "./pages/ladies/add";
import { Layout } from "./components/layout";
import { RequireAuth, RequireSuperAdmin } from "./components/auth-helpers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthQueryClientCacheInvalidator() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.clear();
    }
  }, [isAuthenticated, queryClient]);

  return null;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/sign-in/*?">
        <SignInPage />
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

      <Route path="/crm">
        <RequireAuth>
          <Layout>
            <CrmPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/crm/:id">
        <RequireAuth>
          <Layout>
            <CrmDetailPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/ladies">
        <RequireAuth>
          <Layout>
            <LadiesPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/ladies/:outlet/in-room">
        <RequireAuth>
          <Layout>
            <LadiesInRoomPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/ladies/:outlet/add">
        <RequireAuth>
          <Layout>
            <AddLadyPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/ladies/:outlet/edit/:id">
        <RequireAuth>
          <Layout>
            <AddLadyPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/ladies/:outlet">
        <RequireAuth>
          <Layout>
            <LadiesOutletPage />
          </Layout>
        </RequireAuth>
      </Route>

      <Route path="/users">
        <RequireAuth>
          <RequireSuperAdmin>
            <Layout>
              <UserManagementPage />
            </Layout>
          </RequireSuperAdmin>
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
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthQueryClientCacheInvalidator />
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
