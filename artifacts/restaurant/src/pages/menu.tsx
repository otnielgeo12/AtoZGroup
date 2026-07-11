import { useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, Utensils, ArrowRight } from "lucide-react";
import { useListOutlets } from "@workspace/api-client-react";
import { fallbackOutlets, getImageUrl } from "@/lib/assets";
import { Skeleton } from "@/components/ui/skeleton";

function deriveNeighborhood(outlet: any): string {
  if (outlet.address) {
    const first = String(outlet.address).split(",")[0]?.trim();
    if (first && first.length <= 24) return first.toUpperCase();
  }
  if (outlet.cuisine) return String(outlet.cuisine).toUpperCase();
  return "VENUE";
}

function OutletPickerCard({ outlet, index }: { outlet: any; index: number }) {
  const neighborhood = deriveNeighborhood(outlet);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="snap-start shrink-0 w-[280px] sm:w-[300px] bg-zinc-900/70 border border-white/10 rounded-md overflow-hidden flex flex-col hover-elevate"
    >
      {/* Image with badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
        <img
          src={getImageUrl(outlet.cardImagePath || outlet.coverImagePath, 600)}
          alt={outlet.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 text-[10px] tracking-[0.2em] uppercase bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full">
          #{index + 1} · {neighborhood}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-5">
        <h3 className="text-xl font-serif text-white leading-tight mb-1">{outlet.name}</h3>
        {outlet.tagline && (
          <p className="text-xs italic text-white/50 mb-4">{outlet.tagline}</p>
        )}

        <ul className="space-y-2 text-[12.5px] text-white/70 mb-5">
          {outlet.address && (
            <li className="flex items-start gap-2">
              <MapPin size={13} className="text-primary shrink-0 mt-[2px]" />
              <span className="leading-snug">{outlet.address}</span>
            </li>
          )}
          {outlet.hours && (
            <li className="flex items-start gap-2">
              <Clock size={13} className="text-primary shrink-0 mt-[2px]" />
              <span className="leading-snug whitespace-pre-line line-clamp-2">{outlet.hours}</span>
            </li>
          )}
          {outlet.phone && (
            <li className="flex items-start gap-2">
              <Phone size={13} className="text-primary shrink-0 mt-[2px]" />
              <span className="leading-snug">{outlet.phone}</span>
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-stretch gap-2">
          <Link
            href={`/menu/${outlet.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-3 py-2.5 rounded-sm text-xs font-medium tracking-wider uppercase"
            data-testid={`button-menu-${outlet.slug}`}
          >
            <Utensils size={14} />
            Menu
          </Link>
          <Link
            href={`/outlets/${outlet.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors px-3 py-2.5 rounded-sm text-xs font-medium tracking-wider uppercase"
            data-testid={`button-details-${outlet.slug}`}
          >
            Details
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function Menu() {
  const { data: outlets, isLoading } = useListOutlets();
  const displayOutlets = !isLoading && outlets && outlets.length > 0 ? outlets : fallbackOutlets;
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : 320;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-primary mb-4">
              {displayOutlets.length} Neighborhoods
            </p>
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
              Choose Your Outlet
            </h1>
            <div className="w-16 h-[2px] bg-primary mb-5" />
            <p className="text-white/60 text-base leading-relaxed">
              Each venue has its own personality, but the warm welcome is always
              the same. Swipe through to find the one closest to you.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous"
              className="w-11 h-11 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition-colors flex items-center justify-center"
              data-testid="button-scroll-prev"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next"
              className="w-11 h-11 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition-colors flex items-center justify-center"
              data-testid="button-scroll-next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal scroller */}
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar -mx-6 px-6"
        >
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="snap-start shrink-0 w-[280px] sm:w-[300px] bg-zinc-900/70 border border-white/10 rounded-md overflow-hidden"
                >
                  <Skeleton className="aspect-[4/3] w-full bg-zinc-800" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                    <Skeleton className="h-16 w-full bg-zinc-800" />
                    <Skeleton className="h-9 w-full bg-zinc-800" />
                  </div>
                </div>
              ))
            : displayOutlets.map((outlet, i) => (
                <div key={outlet.id} data-card className="snap-start">
                  <OutletPickerCard outlet={outlet} index={i} />
                </div>
              ))}
        </div>

        <p className="text-center mt-10 text-[11px] tracking-[0.3em] uppercase text-white/40">
          {displayOutlets.length} Outlets · Scroll or swipe to explore
        </p>
      </div>
    </div>
  );
}
