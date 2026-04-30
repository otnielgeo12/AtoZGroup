import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, MapPin, Phone, Utensils } from "lucide-react";
import { 
  useGetOutletBySlug, 
  getGetOutletBySlugQueryKey,
  useListPromotions,
  getListPromotionsQueryKey
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

  const { data: promotions, isLoading: promosLoading } = useListPromotions(
    outlet?.id || -1,
    { activeOnly: true },
    {
      query: {
        enabled: !!outlet?.id,
        queryKey: getListPromotionsQueryKey(outlet?.id || -1, { activeOnly: true }),
      },
    }
  );

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

      {/* Promotions */}
      <section className="py-20 px-6 bg-zinc-950 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">What's On</p>
            <h2 className="text-4xl md:text-5xl font-serif mb-4">Current Promotions</h2>
            <p className="text-white/60 tracking-wide text-sm max-w-xl mx-auto">
              Limited-time offers, special events, and exclusive experiences at {outlet.name}.
            </p>
          </div>

          {promosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-72 w-full bg-zinc-900" />
              ))}
            </div>
          ) : promotions && promotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {promotions.map((promo, idx) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="group relative overflow-hidden border border-white/10 bg-zinc-900/40 rounded-sm flex flex-col"
                >
                  {promo.imagePath && (
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={getImageUrl(promo.imagePath)}
                        alt={promo.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                      {promo.badge && (
                        <span className="absolute top-4 left-4 inline-block bg-primary text-primary-foreground text-[10px] font-medium tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm">
                          {promo.badge}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    {!promo.imagePath && promo.badge && (
                      <span className="inline-block self-start bg-primary text-primary-foreground text-[10px] font-medium tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm mb-4">
                        {promo.badge}
                      </span>
                    )}
                    <h3 className="text-2xl font-serif text-white mb-3 leading-tight">{promo.title}</h3>
                    {promo.description && (
                      <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">
                        {promo.description}
                      </p>
                    )}
                    {promo.ctaLabel && promo.ctaHref && (
                      <a
                        href={promo.ctaHref}
                        target={promo.ctaHref.startsWith("http") ? "_blank" : undefined}
                        rel={promo.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors uppercase tracking-widest text-xs font-medium self-start"
                      >
                        {promo.ctaLabel}
                        <ArrowRight size={14} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-white/10 rounded-sm">
              <p className="text-white/50 italic font-serif mb-2">No active promotions at this time.</p>
              <p className="text-white/40 text-xs tracking-wide uppercase">Check back soon for upcoming offers</p>
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              href={`/menu/${outlet.slug}`}
              className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors uppercase tracking-widest text-sm"
            >
              View full menu <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
