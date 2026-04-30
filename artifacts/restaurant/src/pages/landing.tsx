import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ChevronRight, ArrowDown } from "lucide-react";
import { 
  useListBanners, 
  useListOutlets, 
  useListGalleryImages, 
  useGetSiteInfo 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fallbackBanners, 
  fallbackOutlets, 
  fallbackGallery, 
  getImageUrl 
} from "@/lib/assets";

function HeroSection() {
  const { data: banners, isLoading } = useListBanners({ activeOnly: true });
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayBanners = !isLoading && banners && banners.length > 0 ? banners : fallbackBanners;

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [displayBanners.length]);

  if (isLoading) {
    return <div className="h-screen w-full bg-muted flex items-center justify-center"><Skeleton className="h-full w-full" /></div>;
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="absolute inset-0 gradient-overlay-bottom z-10" />
          <img
            src={getImageUrl(displayBanners[currentIndex].imagePath)}
            alt={displayBanners[currentIndex].title || "Banner"}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6 mt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl"
          >
            {displayBanners[currentIndex].subtitle && (
              <p className="text-sm md:text-base font-medium tracking-[0.3em] uppercase text-white/80 mb-6">
                {displayBanners[currentIndex].subtitle}
              </p>
            )}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-10 leading-[1.1]">
              {displayBanners[currentIndex].title}
            </h1>
            {displayBanners[currentIndex].ctaLabel && (
              <Button
                asChild
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white hover:text-black rounded-none h-14 px-10 text-sm tracking-widest uppercase transition-all duration-300"
              >
                <Link href={displayBanners[currentIndex].ctaHref || "/#outlets"}>
                  {displayBanners[currentIndex].ctaLabel}
                </Link>
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-bounce">
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/50 mb-2">Scroll</span>
        <ArrowDown size={16} className="text-white/50" />
      </div>

      <div className="absolute bottom-10 right-10 z-20 flex gap-3">
        {displayBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i === currentIndex ? "bg-white w-8" : "bg-white/30"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function StorySection() {
  const { data: siteInfo } = useGetSiteInfo();

  return (
    <section id="about" className="py-32 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-sm font-medium tracking-[0.3em] uppercase text-primary mb-6">Our Story</h2>
            <h3 className="text-4xl md:text-5xl font-serif text-foreground mb-8 leading-tight">
              {siteInfo?.tagline || "Redefining the culinary landscape, one plate at a time."}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-10 text-lg">
              {siteInfo?.about || "Avenue Hospitality Group is a collective of visionary chefs, sommeliers, and hospitality experts dedicated to creating unforgettable dining experiences. Across our nine distinctive venues, we celebrate the intersection of tradition and innovation, where every detail is meticulously crafted to delight the senses."}
            </p>
            <Button variant="link" className="px-0 text-primary hover:text-primary/80 group" asChild>
              <Link href="/about" className="flex items-center gap-2">
                <span className="tracking-widest uppercase text-sm">Read the manifesto</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-[3/4] w-full max-w-md mx-auto"
          >
            <div className="absolute inset-0 bg-primary/10 -translate-x-4 -translate-y-4" />
            <img 
              src={getImageUrl(fallbackGallery[2].imagePath)} 
              alt="Culinary artistry" 
              className="absolute inset-0 w-full h-full object-cover shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function OutletsSection() {
  const { data: outlets, isLoading } = useListOutlets();
  const displayOutlets = !isLoading && outlets && outlets.length > 0 ? outlets : fallbackOutlets;

  return (
    <section id="outlets" className="py-32 px-6 bg-zinc-950 text-white relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6"
        >
          <div>
            <h2 className="text-sm font-medium tracking-[0.3em] uppercase text-primary mb-4">Our Venues</h2>
            <h3 className="text-4xl md:text-6xl font-serif leading-tight max-w-2xl">
              Nine distinctive concepts. <br/><span className="text-white/50">One standard of excellence.</span>
            </h3>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black rounded-none shrink-0" asChild>
            <Link href="/menu">Explore Menus</Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {displayOutlets.map((outlet, index) => (
            <motion.div
              key={outlet.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Link href={`/outlets/${outlet.slug}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-zinc-900">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <img
                    src={getImageUrl(outlet.cardImagePath || outlet.coverImagePath)}
                    alt={outlet.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 gradient-overlay-bottom z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  <div className="absolute bottom-6 left-6 z-20 right-6 flex items-center justify-between">
                    <span className="text-xs tracking-[0.2em] uppercase text-white/80 font-medium">Explore</span>
                    <ChevronRight size={18} className="text-white/80 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
                <h4 className="text-2xl font-serif mb-2 group-hover:text-primary transition-colors">{outlet.name}</h4>
                <p className="text-sm text-zinc-400 tracking-wide uppercase">{outlet.tagline}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HighlightGallerySection() {
  const { data: gallery, isLoading } = useListGalleryImages();
  const displayGallery = !isLoading && gallery && gallery.length > 0 ? gallery.slice(0, 4) : fallbackGallery.slice(0, 4);

  return (
    <section className="py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-6 mb-16 text-center">
        <h2 className="text-sm font-medium tracking-[0.3em] uppercase text-primary mb-4">Atmosphere</h2>
        <h3 className="text-4xl md:text-5xl font-serif text-foreground">A feast for the eyes.</h3>
      </div>
      
      <div className="flex w-full gap-4 md:gap-8 px-4 md:px-8 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
        {displayGallery.map((img, index) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative min-w-[80vw] md:min-w-[40vw] lg:min-w-[30vw] aspect-[4/5] md:aspect-[3/4] snap-center shrink-0"
          >
            <img
              src={getImageUrl(img.imagePath)}
              alt={img.caption || "Gallery image"}
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <Button variant="link" className="tracking-widest uppercase text-sm text-primary hover:text-primary/80" asChild>
          <Link href="/gallery" className="flex items-center gap-2">
            View full gallery
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function Landing() {
  return (
    <div className="w-full bg-background min-h-screen">
      <HeroSection />
      <StorySection />
      <OutletsSection />
      <HighlightGallerySection />
    </div>
  );
}
