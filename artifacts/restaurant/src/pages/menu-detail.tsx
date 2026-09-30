import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Utensils, GlassWater, FileText } from "lucide-react";
import {
  useGetOutletBySlug,
  getGetOutletBySlugQueryKey,
  useListMenuItems,
  getListMenuItemsQueryKey,
  useListBeverages,
  getListBeveragesQueryKey,
  useListWines,
  getListWinesQueryKey
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackOutlets, getImageUrl } from "@/lib/assets";

type MenuTab = "food" | "beverages" | "wines";

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

function beverageCategoryDescription(category: string): string {
  const map: Record<string, string> = {
    "Cold Drinks": "Refreshing chilled drinks for any time of day.",
    "Hot Drinks": "Warm up with a comforting cup.",
    Cocktails: "Expertly mixed drinks for every occasion.",
    Mocktails: "All the flavour, none of the alcohol.",
    Wines: "Curated selection of reds, whites, and rosés.",
    Beers: "Draught and bottled options from around the world.",
    Juices: "Freshly pressed and packed with goodness.",
    Spirits: "Premium spirits served straight or mixed.",
  };
  return map[category] || "Thoughtfully crafted beverages.";
}

function wineCategoryDescription(category: string): string {
  const map: Record<string, string> = {
    "Red Wine": "Robust and full-bodied selections.",
    "White Wine": "Crisp and refreshing choices.",
    "Rosé": "Light and floral notes.",
    "Sparkling": "For celebrations and toasts.",
  };
  return map[category] || "Thoughtfully curated wines.";
}

export function MenuDetail() {
  const params = useParams();
  const slug = params.slug;
  const [activeTab, setActiveTab] = useState<MenuTab>("food");

  const { data: apiOutlet, isLoading: outletLoading } = useGetOutletBySlug(slug!, {
    query: { enabled: !!slug, queryKey: getGetOutletBySlugQueryKey(slug!) },
  });

  const fallbackOutlet = fallbackOutlets.find((o) => o.slug === slug);
  const outlet = (!outletLoading && apiOutlet) ? apiOutlet : fallbackOutlet;

  const { data: menuItems, isLoading: menuLoading } = useListMenuItems(outlet?.id || -1, {
    query: { enabled: !!outlet?.id, queryKey: getListMenuItemsQueryKey(outlet?.id || -1) },
  });

  const { data: beverages, isLoading: bevLoading } = useListBeverages(outlet?.id || -1, {
    query: { enabled: !!outlet?.id, queryKey: getListBeveragesQueryKey(outlet?.id || -1) },
  });

    const { data: wines, isLoading: wineLoading } = useListWines(outlet?.id || -1, {
    query: { enabled: !!outlet?.id, queryKey: getListWinesQueryKey(outlet?.id || -1) },
  });

  const activeWines = wines?.filter((w: any) => w.isActive !== false) || [];
  const wineCategories = activeWines
    ? Array.from(new Set(activeWines.map((w: any) => w.category)))
    : [];

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

  const activeMenuItems = menuItems?.filter((i: any) => i.isActive !== false) || [];
  const foodCategories = activeMenuItems
    ? Array.from(new Set(activeMenuItems.map((i: any) => i.category)))
    : [];

  const activeBeverages = beverages?.filter((b: any) => b.isActive !== false) || [];
  const bevCategories = activeBeverages
    ? Array.from(new Set(activeBeverages.map((b: any) => b.category)))
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
            decoding="async"
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

      {/* PDF MENU OVERRIDE */}
      {(outlet as any).pdfMenuUrl ? (
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">Our Menu</h2>
              <p className="text-white/60">Explore our delicious offerings below.</p>
            </div>
            <div className="w-full aspect-[1/1.4] md:aspect-[1/1.2] lg:aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 flex flex-col">
              <object
                data={(outlet as any).pdfMenuUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                  <FileText className="w-16 h-16 text-primary/40" />
                  <p className="text-white/70">It appears your browser doesn't support embedded PDFs.</p>
                  <a 
                    href={(outlet as any).pdfMenuUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium tracking-wide"
                  >
                    Download PDF Menu
                  </a>
                </div>
              </object>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Food / Beverages Toggle */}
          <section className="sticky top-[64px] z-20 bg-zinc-950/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 py-4">
            {outlet?.isFoodMenuActive !== false && (
            <button
              id="tab-food"
              onClick={() => setActiveTab("food")}
              data-testid="tab-food"
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all duration-200 ${
                activeTab === "food"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-white/60 hover:text-white border border-white/15 hover:border-white/30"
              }`}
            >
              <Utensils size={13} />
              Food Menu
            </button>
            )}
            {outlet?.isBeverageMenuActive !== false && (
            <button
              id="tab-beverages"
              onClick={() => setActiveTab("beverages")}
              data-testid="tab-beverages"
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all duration-200 ${
                activeTab === "beverages"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-white/60 hover:text-white border border-white/15 hover:border-white/30"
              }`}
            >
              <GlassWater size={13} />
              Beverages
            </button>
            )}

            {outlet?.isWineMenuActive !== false && (
            <button
              id="tab-wines"
              onClick={() => setActiveTab("wines")}
              data-testid="tab-wines"
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all duration-200 ${
                activeTab === "wines"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-white/60 hover:text-white border border-white/15 hover:border-white/30"
              }`}
            >
              <GlassWater size={13} />
              Wine
            </button>
            )}
          </div>
        </div>
      </section>

      {/* Menu Sections */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">

          {/* ── FOOD TAB ── */}
          {activeTab === "food" && outlet?.isFoodMenuActive !== false && (
            <>
              {outlet?.pdfMenuUrl ? (
                <div className="w-full h-[80vh] mt-8 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center">
                  <object
                    data={getImageUrl(outlet.pdfMenuUrl)}
                    type="application/pdf"
                    className="w-full h-full"
                  >
                    <div className="p-8 text-center">
                      <p className="text-zinc-400 mb-4">Unable to display PDF file.</p>
                      <a href={getImageUrl(outlet.pdfMenuUrl)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Download Menu PDF
                      </a>
                    </div>
                  </object>
                </div>
              ) : menuLoading ? (
                <div className="space-y-8 mt-8">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full bg-zinc-900" />
                  ))}
                </div>
              ) : activeMenuItems && activeMenuItems.length > 0 && activeMenuItems.some(i => foodCategories.includes(i.category)) ? (
                <div className="space-y-20">
                  {foodCategories.map((category) => {
                    const categoryItems = activeMenuItems.filter((i) => i.category === category);
                    if (categoryItems.length === 0) return null;
                    return (
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
                        {activeMenuItems
                          .filter((i) => i.category === category)
                          .map((item: any) => (
                            <div key={item.id} className="flex gap-4 items-start">
                              {item.imagePath ? (
                                <img
                                  src={getImageUrl(item.imagePath, 400)}
                                  alt={item.name}
                                  className="w-28 h-28 md:w-32 md:h-32 rounded object-cover shrink-0 border border-white/10"
                                  loading="lazy"
                                  decoding="async"
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
                                  <span className="text-lg md:text-xl font-serif text-white shrink-0">
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 border border-white/10 rounded-sm">
                  <p className="text-white/50 italic font-serif">
                    Food menu currently being updated. Please check back soon.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── BEVERAGES TAB ── */}
          {activeTab === "beverages" && outlet?.isBeverageMenuActive !== false && (
            <>
              {bevLoading ? (
                <div className="space-y-8">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full bg-zinc-900" />
                  ))}
                </div>
              ) : activeBeverages && activeBeverages.length > 0 ? (
                <div className="space-y-20">
                  {bevCategories.map((category) => (
                    <div key={category}>
                      <div className="mb-8">
                        <h2 className="text-3xl md:text-4xl font-serif text-primary mb-2">
                          {category}
                        </h2>
                        <p className="text-white/50 text-sm">
                          {beverageCategoryDescription(category)}
                        </p>
                        <div className="h-px bg-white/10 mt-6" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {activeBeverages
                          .filter((b) => b.category === category)
                          .map((bev: any) => (
                            <div key={bev.id} className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center mt-1">
                                <GlassWater size={14} className="text-primary/60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-3 mb-1">
                                  <h3 className="text-lg font-medium text-white leading-tight">
                                    {bev.name}
                                  </h3>
                                  <span className="text-lg font-serif text-white shrink-0">
                                    {bev.price}
                                  </span>
                                </div>
                                {bev.description && (
                                  <p className="text-sm text-white/55 leading-relaxed">
                                    {bev.description}
                                  </p>
                                )}
                                {bev.featured && (
                                  <span className="inline-block mt-2 text-[11px] tracking-[0.2em] uppercase text-primary border border-primary/40 px-2.5 py-0.5 rounded-full">
                                    House Favourite
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
                  <GlassWater size={36} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/50 italic font-serif">
                    Beverage menu currently being updated. Please check back soon.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── WINES TAB ── */}
          {activeTab === "wines" && outlet?.isWineMenuActive !== false && (
            <>
              {wineLoading ? (
                <div className="space-y-8">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full bg-zinc-900" />
                  ))}
                </div>
              ) : activeWines && activeWines.length > 0 ? (
                <div className="space-y-20">
                  {wineCategories.map((category) => (
                    <div key={category}>
                      <div className="mb-8">
                        <h2 className="text-3xl md:text-4xl font-serif text-primary mb-2">
                          {category}
                        </h2>
                        <p className="text-white/50 text-sm">
                          {wineCategoryDescription(category)}
                        </p>
                        <div className="h-px bg-white/10 mt-6" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {activeWines
                          .filter((w) => w.category === category)
                          .map((wine: any) => (
                            <div key={wine.id} className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center mt-1">
                                <GlassWater size={14} className="text-primary/60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-3 mb-1">
                                  <h3 className="text-lg font-medium text-white leading-tight">
                                    {wine.name}
                                  </h3>
                                  <span className="text-lg font-serif text-white shrink-0">
                                    {wine.price}
                                  </span>
                                </div>
                                {wine.description && (
                                  <p className="text-sm text-white/55 leading-relaxed">
                                    {wine.description}
                                  </p>
                                )}
                                {wine.featured && (
                                  <span className="inline-block mt-2 text-[11px] tracking-[0.2em] uppercase text-primary border border-primary/40 px-2.5 py-0.5 rounded-full">
                                    Sommelier's Pick
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
                  <GlassWater size={36} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/50 italic font-serif">
                    Wine menu currently being updated. Please check back soon.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
