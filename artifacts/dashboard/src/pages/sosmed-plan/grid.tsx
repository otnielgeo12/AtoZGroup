import { useState, useEffect } from "react";
import { type SosmedContent, listContents, type ContentOutlet, type ContentPlatform } from "@/lib/sosmed-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { format, subMonths, isSameMonth } from "date-fns";
import { id } from "date-fns/locale";

function SocialThumbnail({ url, fallback, className, children }: { url?: string, fallback: string, className?: string, children?: React.ReactNode }) {
  const [bgImage, setBgImage] = useState(fallback);

  useEffect(() => {
    if (!url) {
      setBgImage(fallback);
      return;
    }
    // If direct image URL
    if (url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) {
      setBgImage(url);
      return;
    }

    if (url.includes('tiktok.com')) {
      fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => { if (data.thumbnail_url) setBgImage(data.thumbnail_url); })
        .catch(() => {});
      return;
    }
    
    if (url.includes('pinterest.com') || url.includes('pin.it')) {
      fetch(`https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => { if (data.thumbnail_url) setBgImage(data.thumbnail_url); })
        .catch(() => {});
      return;
    }
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
        .then(res => res.json())
        .then(data => { if (data.thumbnail_url) setBgImage(data.thumbnail_url); })
        .catch(() => {});
      return;
    }

    // Try to get OpenGraph image via Microlink API as fallback for other sites like Instagram
    fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data?.image?.url) {
          setBgImage(data.data.image.url);
        }
      })
      .catch(() => {
        // Silent fallback
      });
  }, [url, fallback]);

  return (
    <div 
      className={className}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {children}
    </div>
  );
}

export function SosmedGrid({ onEdit }: { onEdit?: (content: SosmedContent) => void }) {
  const [contents, setContents] = useState<SosmedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState<ContentOutlet | "all">("atoz");
  const [selectedPlatform, setSelectedPlatform] = useState<ContentPlatform | "all">("instagram");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Generate last 6 months + 3 future months for dropdown
  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    // start from 3 months in the future
    const d = subMonths(new Date(), i - 3);
    return {
      value: format(d, "M-yyyy"),
      label: format(d, "MMMM yyyy", { locale: id })
    };
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await listContents({ pageSize: 50 }); 
      
      let filtered = data;
      if (selectedOutlet !== "all") {
        filtered = filtered.filter(c => c.outlet === selectedOutlet);
      }
      if (selectedPlatform !== "all") {
        filtered = filtered.filter(c => c.platform === selectedPlatform);
      }
      if (selectedMonth !== "all") {
        filtered = filtered.filter(c => {
          const contentDate = new Date(c.scheduledDate || c.createdAt);
          const monthStr = format(contentDate, "M-yyyy");
          return monthStr === selectedMonth;
        });
      }
      
      setContents(filtered.slice(0, 9));
      setLoading(false);
    }
    load();
  }, [selectedOutlet, selectedPlatform, selectedMonth]);

  return (
    <div className="space-y-6 max-w-[800px] mx-auto">
      {/* ─── Header & Filter ─── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-center md:text-left">Instagram / TikTok Feed Preview</h2>
        <div className="flex flex-wrap w-full md:w-auto gap-3 justify-center md:justify-end">
          <div className="w-[140px]">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full bg-background border-input font-medium">
                <SelectValue placeholder="Semua Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {monthOptions.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={selectedPlatform} onValueChange={(v: any) => setSelectedPlatform(v)}>
              <SelectTrigger className="w-full bg-background border-input font-medium">
                <SelectValue placeholder="Semua Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Platform</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={selectedOutlet} onValueChange={(v: any) => setSelectedOutlet(v)}>
              <SelectTrigger className="w-full bg-background border-input font-medium">
                <SelectValue placeholder="Semua Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Outlet</SelectItem>
                <SelectItem value="atoz">AtoZ</SelectItem>
                <SelectItem value="bosa">Bosa</SelectItem>
                <SelectItem value="bodega">Bodega</SelectItem>
                <SelectItem value="lakers">Lakers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ─── Seamless 3x3 Grid ─── */}
      <div className="bg-[#111] p-0.5 rounded border border-border/50 shadow-2xl">
        {loading ? (
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="w-full rounded-none bg-muted/20" style={{ aspectRatio: '4/5' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[1px] bg-white/20">
            {contents.length === 0 ? (
              <div className="col-span-3 py-32 text-center text-muted-foreground bg-background">
                Belum ada konten untuk outlet ini.
              </div>
            ) : (
              Array.from({ length: 9 }).map((_, i) => {
                const content = contents[i];
                if (!content) {
                  return (
                    <div 
                      key={`empty-${i}`} 
                      className="w-full bg-[#0a0a0a] flex items-center justify-center"
                      style={{ aspectRatio: '4/5' }}
                    />
                  );
                }

                // Realistic restaurant/bar placeholder images
                const placeholderImages = [
                  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80", // bar/restaurant
                  "https://images.unsplash.com/photo-1414235077428-338988a2e8c0?w=600&q=80", // fine dining food
                  "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80", // cocktail
                  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80", // wine pouring
                  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80", // people dining
                  "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&q=80", // steak
                  "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&q=80", // drinks
                  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80", // cafe interior
                  "https://images.unsplash.com/photo-1574966739987-65e386c99db8?w=600&q=80", // bartender
                ];
                const bgImage = placeholderImages[i % placeholderImages.length];

                return (
                  <div 
                    key={content.id} 
                    className="group relative w-full overflow-hidden cursor-pointer bg-[#0a0a0a]"
                    style={{ aspectRatio: '4/5' }}
                    onClick={() => {
                      const link = content.referensiKonten || content.contentPreviewLink;
                      if (link) window.open(link, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {/* Background Image with Auto-Fetch */}
                    {content.screenshotUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        style={{ backgroundImage: `url(${content.screenshotUrl})` }}
                      />
                    ) : (
                      <SocialThumbnail 
                        url={content.referensiKonten || content.contentPreviewLink} 
                        fallback={bgImage}
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                      />
                    )}
                    
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                    
                    {/* Hover effect glow */}
                    <div className="absolute inset-0 ring-inset ring-0 group-hover:ring-[3px] ring-white/50 transition-all z-10" />

                    {/* Content Text (Bottom Center) */}
                    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-end px-2 z-20">
                      <h3 className="text-[clamp(14px,2.5vw,26px)] font-black text-[#00e676] uppercase tracking-wide leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center">
                        {content.pillar} 
                      </h3>
                      <p className="text-[clamp(10px,1.5vw,15px)] text-white/90 font-medium tracking-wide mt-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center">
                        {content.format}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
