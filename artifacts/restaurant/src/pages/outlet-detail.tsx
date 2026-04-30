import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, MapPin, Phone, Utensils } from "lucide-react";
import { 
  useGetOutletBySlug, 
  getGetOutletBySlugQueryKey,
  useListMenuItems,
  getListMenuItemsQueryKey
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackOutlets, getImageUrl } from "@/lib/assets";

export function OutletDetail() {
  const params = useParams();
  const slug = params.slug;

  const { data: apiOutlet, isLoading: outletLoading } = useGetOutletBySlug(slug!, {
    query: { enabled: !!slug, queryKey: getGetOutletBySlugQueryKey(slug!) }
  });

  const fallbackOutlet = fallbackOutlets.find(o => o.slug === slug);
  const outlet = (!outletLoading && apiOutlet) ? apiOutlet : fallbackOutlet;

  const { data: menuItems, isLoading: menuLoading } = useListMenuItems(outlet?.id || -1, {
    query: { enabled: !!outlet?.id, queryKey: getListMenuItemsQueryKey(outlet?.id || -1) }
  });

  if (outletLoading) {
    return (
      <div className="min-h-screen bg-background pt-32 px-6">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-10" />
          <Skeleton className="w-full aspect-video mb-10" />
          <Skeleton className="h-32 w-full mb-8" />
        </div>
      </div>
    );
  }

  if (!outlet) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl font-serif mb-4">Venue Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the restaurant you're looking for.</p>
        <Link href="/" className="text-primary hover:underline uppercase tracking-widest text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  // Group menu items by category
  const categories = menuItems ? Array.from(new Set(menuItems.map(item => item.category))) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <img 
            src={getImageUrl(outlet.coverImagePath)} 
            alt={outlet.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-20 container mx-auto px-6 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/#outlets" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors text-sm uppercase tracking-widest">
              <ArrowLeft size={16} />
              Back to Venues
            </Link>
            <h1 className="text-5xl md:text-7xl font-serif mb-4">{outlet.name}</h1>
            <p className="text-lg md:text-xl text-white/80 font-light tracking-wide uppercase">{outlet.tagline}</p>
          </motion.div>
        </div>
      </section>

      {/* Info & Story */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-serif mb-6 text-foreground">The Experience</h2>
              <p className="text-muted-foreground leading-relaxed text-lg mb-8">
                {outlet.description || "An unforgettable dining experience awaits. Join us for exceptional cuisine, curated beverages, and flawless hospitality in a stunning setting."}
              </p>
              
              {outlet.cuisine && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-primary mb-2">Cuisine</h3>
                  <p className="text-foreground">{outlet.cuisine}</p>
                </div>
              )}
            </div>

            <div className="space-y-8 bg-muted/30 p-8 rounded-sm border border-border">
              {outlet.address && (
                <div className="flex items-start gap-4">
                  <MapPin className="text-primary shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">Location</h3>
                    <p className="text-foreground text-sm">{outlet.address}</p>
                  </div>
                </div>
              )}
              
              {outlet.hours && (
                <div className="flex items-start gap-4">
                  <Clock className="text-primary shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">Hours</h3>
                    <p className="text-foreground text-sm whitespace-pre-line">{outlet.hours}</p>
                  </div>
                </div>
              )}
              
              {outlet.phone && (
                <div className="flex items-start gap-4">
                  <Phone className="text-primary shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">Contact</h3>
                    <a href={`tel:${outlet.phone}`} className="text-foreground hover:text-primary transition-colors text-sm">
                      {outlet.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Menu Highlight */}
      <section className="py-20 px-6 bg-zinc-950 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <Utensils className="mx-auto text-primary mb-4" size={32} />
            <h2 className="text-4xl font-serif mb-4">Sample Menu</h2>
            <p className="text-white/60 tracking-wide uppercase text-sm">A glimpse of our offerings</p>
          </div>

          {menuLoading ? (
            <div className="space-y-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full bg-zinc-900" />)}
            </div>
          ) : menuItems && menuItems.length > 0 ? (
            <div className="space-y-16">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-2xl font-serif text-primary border-b border-white/10 pb-4 mb-8">{category}</h3>
                  <div className="space-y-8">
                    {menuItems.filter(item => item.category === category).map(item => (
                      <div key={item.id} className="flex justify-between items-start gap-8 group">
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between mb-2">
                            <h4 className="text-lg font-medium text-white group-hover:text-primary transition-colors">{item.name}</h4>
                            <div className="border-b border-dotted border-white/20 flex-1 mx-4 opacity-30"></div>
                            <span className="text-white/90 font-serif">{item.price}</span>
                          </div>
                          {item.description && (
                            <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-white/10 rounded-sm">
              <p className="text-white/50 italic font-serif">Menu currently being updated. Please check back soon.</p>
            </div>
          )}

          <div className="text-center mt-20">
            <Link href="/menu" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors uppercase tracking-widest text-sm">
              View all menus <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
