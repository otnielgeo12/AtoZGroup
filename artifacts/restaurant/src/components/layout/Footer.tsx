import { Link } from "wouter";
import { Instagram, MapPin, Phone, Mail } from "lucide-react";
import { useGetSiteInfo } from "@workspace/api-client-react";

export function Footer() {
  const { data: siteInfo } = useGetSiteInfo();

  return (
    <footer className="bg-background border-t border-white/5 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <h2 className="font-serif text-3xl font-bold tracking-widest text-primary-foreground mb-4">
              {siteInfo?.brandName || "AVENUE"}
            </h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed mb-6">
              {siteInfo?.tagline || "Curating exceptional culinary experiences across the city. Each venue tells a story. Every plate is a masterpiece."}
            </p>
            <div className="flex items-center gap-4">
              {siteInfo?.instagramUrl && (
                <a
                  href={siteInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-foreground hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                  <Instagram size={18} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg tracking-widest mb-6">Explore</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/#outlets" className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
                  Our Venues
                </Link>
              </li>
              <li>
                <Link href="/menu" className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
                  Menus
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
                  Our Story
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg tracking-widest mb-6">Contact</h3>
            <ul className="space-y-4">
              {siteInfo?.contactEmail && (
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Mail size={18} className="text-primary mt-0.5" />
                  <a href={`mailto:${siteInfo.contactEmail}`} className="hover:text-primary transition-colors">
                    {siteInfo.contactEmail}
                  </a>
                </li>
              )}
              {siteInfo?.contactPhone && (
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Phone size={18} className="text-primary mt-0.5" />
                  <a href={`tel:${siteInfo.contactPhone}`} className="hover:text-primary transition-colors">
                    {siteInfo.contactPhone}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin size={18} className="text-primary mt-0.5" />
                <span>City Center, Downtown</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            &copy; {new Date().getFullYear()} {siteInfo?.brandName || "Avenue Hospitality Group"}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary uppercase tracking-widest">Privacy</Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary uppercase tracking-widest">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
