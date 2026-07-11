import { motion } from "framer-motion";
import { useListGalleryImages } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackGallery, getImageUrl } from "@/lib/assets";

export function Gallery() {
  const { data: gallery, isLoading } = useListGalleryImages();
  const displayGallery = !isLoading && gallery && gallery.length > 0 ? gallery : fallbackGallery;

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-sm font-medium tracking-[0.3em] uppercase text-primary mb-6">Visuals</h1>
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">Atmosphere & Artistry</h2>
          <p className="text-muted-foreground text-lg">A curated look into the spaces and plates of Avenue Hospitality Group.</p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className={`w-full bg-muted ${i % 2 === 0 ? 'h-96' : 'h-64'} rounded-sm`} />
            ))
          ) : (
            displayGallery.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative overflow-hidden group break-inside-avoid rounded-sm bg-muted"
              >
                <img
                  src={getImageUrl(img.imagePath, 800)}
                  alt={img.caption || "Gallery image"}
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                {img.caption && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white text-sm font-serif">{img.caption}</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
