import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import {
  useGetOutletBySlug,
  getGetOutletBySlugQueryKey,
  useListMenuItems,
  getListMenuItemsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackOutlets, getImageUrl } from "@/lib/assets";

function categoryDescription(category: string): string {
  const map: Record<string, string> = {
    Starters: "Small plates to share with a glass of something cold.",
    Mains: "Hearty signatures crafted by our kitchen team.",
    Desserts: "A sweet ending to your evening.",
    Drinks: "Curated cocktails, wines, and refreshments.",
    Sides: "The perfect accompaniments to your meal.",
    Specials: "Seasonal highlights, available for a limited time.",
  };
  return map[category] || "Crafted with care from seasonal ingredients.";
}

export function MenuDetail() {
  const params = useParams();
  const slug = params.slug;

  const { data: apiOutlet, isLoading: outletLoading } = useGetOutletBySlug(slug!, {
    query: { enabled: !!slug, queryKey: getGetOutletBySlugQueryKey(slug!) },
  });

  const fallbackOutlet = fallbackOutlets.find((o) => o.slug === slug);
  const outlet = (!outletLoading && apiOutlet) ? apiOutlet : fallbackOutlet;

  const { data: menuItems, isLoading: menuLoading } = useListMenuItems(outlet?.id || -1, {
    query: { enabled: !!outlet?.id, queryKey: getListMenuItemsQueryKey(outlet?.id || -1) },
  });

  if (outletLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-24">
        <Skeleton className="h-[40vh] w-full bg-zinc-900" />
        <div className="container mx-auto px-6 py-16 space-y-10">
          <Skeleton className="h-8 w-1/3 bg-zinc-900" />
          <Skeleton className="h-40 w-full bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (!outlet) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl font-serif text-white mb-4">Menu Not Found</h1>
        <p className="text-white/60 mb-8">We couldn't find the menu you're looking for.</p>
        <Link
          href="/menu"
          className="text-primary hover:underline uppercase tracking-widest text-sm"
        >
          Back to Outlets
        </Link>
      </div>
    );
  }

  const categories = menuItems
    ? Array.from(new Set(menuItems.map((i) => i.category)))
    : [];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section className="relative h-[55vh] min-h-[420px] w-full overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src={getImageUrl(outlet.coverImagePath || outlet.cardImagePath)}
            alt={outlet.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/30" />
        </div>

        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-end pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm transition-colors"
              data-testid="link-back-to-outlets"
            >
              <ArrowLeft size={16} />
              Back to Outlets
            </Link>

            <p className="text-[11px] tracking-[0.3em] uppercase text-white/60 mb-3">
              Menu · {outlet.cuisine || "Signature Dining"}
            </p>
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-4 leading-tight">
              {outlet.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
              {outlet.address && (
                <span className="inline-flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  {outlet.address}
                </span>
              )}
              {outlet.hours && (
                <span className="inline-flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <span className="line-clamp-1">{outlet.hours}</span>
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Menu sections */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          {menuLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-zinc-900" />
              ))}
            </div>
          ) : menuItems && menuItems.length > 0 ? (
            <div className="space-y-20">
              {categories.map((category) => (
                <div key={category}>
                  <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-serif text-primary mb-2">
                      {category}
                    </h2>
                    <p className="text-white/50 text-sm">
                      {categoryDescription(category)}
                    </p>
                    <div className="h-px bg-white/10 mt-6" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {menuItems
                      .filter((i) => i.category === category)
                      .map((item: any) => (
                        <div key={item.id} className="flex gap-4 items-start">
                          {item.imagePath ? (
                            <img
                              src={getImageUrl(item.imagePath)}
                              alt={item.name}
                              className="w-28 h-28 md:w-32 md:h-32 rounded object-cover shrink-0 border border-white/10"
                            />
                          ) : (
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center">
                              <span className="text-[10px] tracking-widest uppercase text-white/30">
                                Dish
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-3 mb-1.5">
                              <h3 className="text-lg md:text-xl font-medium text-white leading-tight">
                                {item.name}
                              </h3>
                              <span className="text-lg md:text-xl font-serif text-primary shrink-0">
                                {item.price}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-base text-white/60 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {item.featured && (
                              <span className="inline-block mt-3 text-[11px] tracking-[0.2em] uppercase text-primary border border-primary/40 px-2.5 py-0.5 rounded-full">
                                Chef's Pick
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-white/10 rounded-sm">
              <p className="text-white/50 italic font-serif">
                Menu currently being updated. Please check back soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
