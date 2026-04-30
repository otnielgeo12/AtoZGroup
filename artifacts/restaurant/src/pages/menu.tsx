import { useState } from "react";
import { motion } from "framer-motion";
import { useListOutlets, useListMenuItems, getListMenuItemsQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { fallbackOutlets, getImageUrl } from "@/lib/assets";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";

// Re-implement the menu items fetch to bulk load if needed, or use separate queries.
// For the 3D menu hub, we need the menu for ALL outlets. 
// We will fetch menus per outlet on demand or bulk.

function MenuCard({ outlet, isActive, onClick, onClose }: { outlet: any, isActive: boolean, onClick: () => void, onClose: () => void }) {
  const { data: menuItems, isLoading } = useListMenuItems(outlet.id, {
    query: {
      enabled: isActive && outlet.id > 0,
      queryKey: getListMenuItemsQueryKey(outlet.id),
    },
  });

  const categories = menuItems ? Array.from(new Set(menuItems.map(i => i.category))) : [];

  return (
    <div 
      className={`relative w-full max-w-sm md:max-w-md aspect-[3/4] mx-auto cursor-pointer menu-card-container group ${isActive ? 'is-flipped z-50' : 'z-10 hover:-translate-y-2'} transition-all duration-500`}
      onClick={!isActive ? onClick : undefined}
    >
      <div className="menu-card-inner w-full h-full relative shadow-2xl rounded-sm">
        
        {/* FRONT OF CARD */}
        <div className="menu-card-front bg-zinc-900 overflow-hidden border border-white/10 flex flex-col items-center justify-center p-8 relative">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img 
              src={getImageUrl(outlet.coverImagePath)} 
              alt={outlet.name}
              className="w-full h-full object-cover opacity-80"
            />
          </div>
          <div className="relative z-20 text-center">
            <div className="w-12 h-px bg-primary mx-auto mb-6" />
            <h3 className="text-3xl font-serif text-white mb-4 leading-tight">{outlet.name}</h3>
            <p className="text-white/70 text-xs tracking-[0.2em] uppercase">{outlet.tagline}</p>
            <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] tracking-widest uppercase text-primary border border-primary px-4 py-2 rounded-full">Tap to view menu</span>
            </div>
          </div>
        </div>

        {/* BACK OF CARD (MENU) */}
        <div className="menu-card-back bg-[#f8f5f0] text-zinc-900 border border-zinc-200 p-8 overflow-y-auto hide-scrollbar shadow-inner relative flex flex-col">
          {isActive && (
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 bg-white/80 rounded-full backdrop-blur-sm z-50 transition-colors"
            >
              <X size={20} />
            </button>
          )}

          <div className="text-center mb-8 pt-4">
            <h4 className="text-2xl font-serif text-zinc-900">{outlet.name}</h4>
            <div className="w-8 h-px bg-zinc-300 mx-auto mt-4" />
          </div>

          <div className="flex-1 flex flex-col gap-8 pb-10">
            {isLoading ? (
              <div className="space-y-6">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full bg-zinc-200" />)}
              </div>
            ) : menuItems && menuItems.length > 0 ? (
              categories.map((category: any) => (
                <div key={category}>
                  <h5 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500 mb-4 text-center">{category}</h5>
                  <div className="space-y-4">
                    {menuItems.filter(i => i.category === category).map((item: any) => (
                      <div key={item.id} className="flex gap-3 items-start">
                        {item.imagePath ? (
                          <img
                            src={getImageUrl(item.imagePath)}
                            alt={item.name}
                            className="w-14 h-14 rounded object-cover shrink-0 border border-zinc-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded bg-zinc-100 border border-zinc-200 shrink-0 flex items-center justify-center">
                            <span className="text-[9px] tracking-widest uppercase text-zinc-400">Dish</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-sm font-medium text-zinc-900 truncate">{item.name}</span>
                            <span className="text-sm font-serif text-zinc-700 shrink-0">{item.price}</span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-zinc-500 leading-tight mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm font-serif italic">
                Menu coming soon
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export function Menu() {
  const { data: outlets, isLoading } = useListOutlets();
  const displayOutlets = !isLoading && outlets && outlets.length > 0 ? outlets : fallbackOutlets;
  const [activeOutletId, setActiveOutletId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h1 className="text-sm font-medium tracking-[0.3em] uppercase text-primary mb-6">Culinary Portfolio</h1>
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Our Menus</h2>
          <p className="text-white/60 text-lg font-light">Select a venue to explore its culinary offerings.</p>
        </div>

        {/* The overlay that darkens other cards when one is active */}
        <div 
          className={`fixed inset-0 bg-black/80 z-40 transition-opacity duration-500 ${activeOutletId !== null ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setActiveOutletId(null)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 perspective-1000 relative z-30">
          {isLoading ? (
            [1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-[3/4] w-full max-w-sm mx-auto bg-zinc-900 rounded-sm" />)
          ) : (
            displayOutlets.map((outlet, i) => (
              <motion.div
                key={outlet.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={activeOutletId === outlet.id ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-6 pointer-events-auto' : ''}
              >
                <MenuCard 
                  outlet={outlet} 
                  isActive={activeOutletId === outlet.id} 
                  onClick={() => setActiveOutletId(outlet.id)}
                  onClose={() => setActiveOutletId(null)}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
