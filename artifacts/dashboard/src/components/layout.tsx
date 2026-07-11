import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Store, 
  Settings, 
  LogOut,
  Menu,
  Images,
  Users,
  Shield,
  UtensilsCrossed,
  Music2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/home", label: "Overview", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/ladies", label: "Ladies", icon: Sparkles },
  { href: "/banners", label: "Banners", icon: ImageIcon },
  { href: "/outlets", label: "Outlets", icon: Store },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/site-info", label: "Site Info", icon: Settings },
  { href: "/users", label: "Admin Accounts", icon: Shield, superAdminOnly: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout, isFnbAdmin, isEntertainmentAdmin, isKaraokeAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (isKaraokeAdmin && !location.startsWith("/ladies")) {
      setLocation("/ladies");
    }
  }, [isKaraokeAdmin, location, setLocation]);

  const NavLinks = () => (
    <nav className="space-y-1">
      {navItems
        .filter((item) => {
          if (user?.role === "admin_karaoke") {
            return item.href === "/ladies";
          }
          return !item.superAdminOnly || user?.role === "super_admin";
        })
        .map((item) => {
          const isActive = location.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/95 px-2 py-1 rounded-lg shadow-sm border border-white/20 shrink-0 flex items-center justify-center">
            <img src={`${window.location.origin}${basePath}/logo-atoz.png`} alt="AtoZ Group" className="h-7 w-auto object-contain" />
          </div>
          <span className="font-semibold text-foreground">AtoZ Group</span>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
            <div className="p-6">
              <div className="bg-white/95 px-3 py-2 rounded-xl shadow-sm border border-white/20 inline-flex items-center justify-center mb-6">
                <img src={`${window.location.origin}${basePath}/logo-atoz.png`} alt="AtoZ Group" className="h-11 w-auto object-contain" />
              </div>
              <NavLinks />
            </div>
            <div className="mt-auto p-4 border-t border-border bg-card/50">
              <div className="flex items-center gap-3 mb-4 px-2">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {user?.username?.substring(0, 2).toUpperCase() || "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{user?.username || "Admin"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {isFnbAdmin ? (
                      <span className="inline-flex items-center gap-1 text-orange-500"><UtensilsCrossed className="w-3 h-3" /> F&B Group</span>
                    ) : isEntertainmentAdmin ? (
                      <span className="inline-flex items-center gap-1 text-purple-500"><Music2 className="w-3 h-3" /> Entertainment Group</span>
                    ) : isKaraokeAdmin ? (
                      <span className="inline-flex items-center gap-1 text-rose-500"><Sparkles className="w-3 h-3" /> Karaoke Group</span>
                    ) : (
                      user?.email || "System Admin"
                    )}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => logout()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-white/95 px-2.5 py-1.5 rounded-xl shadow-sm border border-white/20 shrink-0 flex items-center justify-center">
              <img src={`${window.location.origin}${basePath}/logo-atoz.png`} alt="AtoZ Group" className="h-9 w-auto object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight text-sidebar-foreground">AtoZ Group</span>
          </div>
          <NavLinks />
        </div>
        
        <div className="mt-auto p-4 border-t border-sidebar-border bg-sidebar/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {user?.username?.substring(0, 2).toUpperCase() || "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.username || "Admin"}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {isFnbAdmin ? (
                  <span className="inline-flex items-center gap-1 text-orange-400"><UtensilsCrossed className="w-3 h-3" /> F&B Group</span>
                ) : isEntertainmentAdmin ? (
                  <span className="inline-flex items-center gap-1 text-purple-400"><Music2 className="w-3 h-3" /> Entertainment Group</span>
                ) : isKaraokeAdmin ? (
                  <span className="inline-flex items-center gap-1 text-rose-400"><Sparkles className="w-3 h-3" /> Karaoke Group</span>
                ) : (
                  user?.email || "System Admin"
                )}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" 
            onClick={() => logout()}
            data-testid="button-sign-out"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
