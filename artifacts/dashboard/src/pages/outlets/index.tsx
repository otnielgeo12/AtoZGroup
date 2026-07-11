import { useListOutlets } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Store, MapPin, Clock, Utensils, Phone, ArrowRight, UtensilsCrossed, Music2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/assets";
import { useAuth } from "@/lib/auth-context";

// F&B group: AtoZ Bar Wine & Brasserie (1), Bosa Restaurant (2), Bodega All Day Dining (3), Lakers By AtoZ (4)
const FNB_OUTLET_IDS = new Set([1, 2, 3, 4]);
// Entertainment group: Redhare (5), District5 (6), Infinity (7), Oombee (8), Shiraz (9)
const ENTERTAINMENT_OUTLET_IDS = new Set([5, 6, 7, 8, 9]);

export default function OutletsPage() {
  const { data: outlets, isLoading } = useListOutlets();
  const { isSuperAdmin, isFnbAdmin, isEntertainmentAdmin } = useAuth();

  const safeOutlets: any = outlets;
  
  const allOutlets: any[] = Array.isArray(safeOutlets) 
    ? safeOutlets 
    : Array.isArray(safeOutlets?.data) 
      ? safeOutlets.data 
      : Array.isArray(safeOutlets?.items) 
        ? safeOutlets.items 
        : [];

  // Filter based on admin group
  const outletsData = isSuperAdmin
    ? allOutlets
    : isFnbAdmin
      ? allOutlets.filter((o: any) => FNB_OUTLET_IDS.has(o.id))
      : isEntertainmentAdmin
        ? allOutlets.filter((o: any) => ENTERTAINMENT_OUTLET_IDS.has(o.id))
        : allOutlets; // legacy 'admin' role sees all

  const groupLabel = isFnbAdmin
    ? "F&B"
    : isEntertainmentAdmin
      ? "Entertainment"
      : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Outlets</h1>
            {groupLabel && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isFnbAdmin
                  ? "bg-orange-500/10 text-orange-500 border-orange-500/25"
                  : "bg-purple-500/10 text-purple-500 border-purple-500/25"
              }`}>
                {isFnbAdmin ? <UtensilsCrossed className="w-3 h-3" /> : <Music2 className="w-3 h-3" />}
                {groupLabel} Group
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Manage locations, details, and menus for {outletsData.length > 0 ? `all ${outletsData.length}` : 'your'} outlets.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : outletsData.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card border border-dashed rounded-lg">
          <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No outlets found</h3>
          <p className="text-muted-foreground mt-1">There are no outlets configured in the system or data is empty.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {outletsData.map((outlet: any) => (
            <Link key={outlet.id} href={`/outlets/${outlet.id}`}>
              <a className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" data-testid={`link-outlet-${outlet.id}`}>
                <Card className="h-full flex flex-col hover:shadow-md transition-all duration-200 group border-border hover:border-primary/50 overflow-hidden">
                  <div className="relative h-40 w-full bg-muted overflow-hidden">
                    {outlet.cardImagePath || outlet.coverImagePath ? (
                      <img 
                        src={getImageUrl(outlet.cardImagePath || outlet.coverImagePath)} 
                        alt={outlet.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                        <Store className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                    <div 
                      className="absolute inset-0 opacity-40 mix-blend-multiply" 
                      style={{ backgroundColor: outlet.accentColor || 'var(--primary)' }}
                    />
                    <div className="absolute top-3 right-3">
                      <div className="bg-background/90 backdrop-blur text-foreground text-xs font-medium px-2 py-1 rounded shadow-sm flex items-center gap-1 border border-border/50">
                        <Utensils className="w-3 h-3" />
                        {outlet.cuisine || "Various"}
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3 flex-none">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-start justify-between gap-4">
                      <span className="truncate">{outlet.name}</span>
                    </CardTitle>
                    <CardDescription className="line-clamp-1">{outlet.tagline || outlet.description || "No description provided."}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 pb-4 flex-1">
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-primary/70" />
                      <span className="line-clamp-2">{outlet.address || "Address not provided"}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 mr-2 shrink-0 text-primary/70" />
                      <span className="truncate">{outlet.phone || "Phone not provided"}</span>
                    </div>
                    <div className="flex items-start text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-primary/70" />
                      <span className="line-clamp-2">{outlet.hours || "Hours not provided"}</span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0 border-t border-border/50 bg-muted/20 px-6 py-3 flex-none flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Order: {outlet.sortOrder}</span>
                    <span className="text-sm font-medium text-primary flex items-center group-hover:underline">
                      Manage <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardFooter>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}