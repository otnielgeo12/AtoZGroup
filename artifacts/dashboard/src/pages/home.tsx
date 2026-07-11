import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Store, Image as ImageIcon, UtensilsCrossed, Images, ArrowRight } from "lucide-react";
import { getImageUrl } from "@/lib/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export default function HomePage() {
  const { isKaraokeAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isKaraokeAdmin) {
      setLocation("/ladies");
    }
  }, [isKaraokeAdmin, setLocation]);

  const { data: summary, isLoading, isError } = useGetDashboardSummary();

  if (isKaraokeAdmin) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome to your operations dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading || isError || !summary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard title="Outlets" value={summary.outletCount} icon={<Store className="w-4 h-4 text-muted-foreground" />} href="/outlets" />
            <StatCard title="Menu Items" value={summary.menuItemCount} icon={<UtensilsCrossed className="w-4 h-4 text-muted-foreground" />} href="/outlets" />
            <StatCard title="Banners" value={summary.bannerCount} icon={<ImageIcon className="w-4 h-4 text-muted-foreground" />} href="/banners" />
            <StatCard title="Gallery Images" value={summary.galleryCount} icon={<Images className="w-4 h-4 text-muted-foreground" />} href="/gallery" />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Menu Items</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest additions across all outlets.</p>
            </div>
            <Link href="/outlets">
              <Button variant="ghost" size="sm" className="hidden sm:flex" data-testid="link-view-all-menus">
                View all <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !summary?.recentMenuItems?.length ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No menu items yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summary.recentMenuItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 rounded-md bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
                      {item.imagePath ? (
                        <img src={getImageUrl(item.imagePath)} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="w-5 h-5 text-secondary-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                    </div>
                    <div className="text-sm font-medium shrink-0">
                      {item.price}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-full lg:col-span-3 bg-primary text-primary-foreground border-primary-border overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Store className="w-48 h-48" />
          </div>
          <CardHeader>
            <CardTitle className="text-primary-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative z-10">
            <QuickLink href="/banners" icon={ImageIcon} label="Manage homepage banners" />
            <QuickLink href="/gallery" icon={Images} label="Update gallery photos" />
            <QuickLink href="/site-info" icon={Store} label="Edit contact information" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, href }: { title: string, value: number, icon: React.ReactNode, href: string }) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href}>
      <a className="flex items-center p-3 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-md transition-colors" data-testid={`quicklink-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <Icon className="w-5 h-5 mr-3" />
        <span className="text-sm font-medium">{label}</span>
        <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
      </a>
    </Link>
  );
}
