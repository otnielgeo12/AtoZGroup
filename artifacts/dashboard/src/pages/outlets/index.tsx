import { useListOutlets } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Store, MapPin, Clock, Utensils, Phone, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function OutletsPage() {
  const { data: outlets, isLoading } = useListOutlets();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outlets</h1>
          <p className="text-muted-foreground mt-1">Manage locations, details, and menus for all 9 outlets.</p>
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
      ) : !outlets?.length ? (
        <div className="text-center py-16 px-4 bg-card border border-dashed rounded-lg">
          <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No outlets found</h3>
          <p className="text-muted-foreground mt-1">There are no outlets configured in the system.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {outlets.map((outlet) => (
            <Link key={outlet.id} href={`/outlets/${outlet.id}`}>
              <a className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" data-testid={`link-outlet-${outlet.id}`}>
                <Card className="h-full flex flex-col hover:shadow-md transition-all duration-200 group border-border hover:border-primary/50 overflow-hidden">
                  <div className="relative h-40 w-full bg-muted overflow-hidden">
                    {outlet.cardImagePath || outlet.coverImagePath ? (
                      <img 
                        src={`/api/storage${outlet.cardImagePath || outlet.coverImagePath}`} 
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
