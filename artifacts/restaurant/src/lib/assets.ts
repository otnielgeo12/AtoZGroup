import banner1 from "@/assets/banner-1.png";
import banner2 from "@/assets/banner-2.png";
import banner3 from "@/assets/banner-3.png";
import outletAtoZ from "@/assets/outlet-atoz.png";
import outletBosa from "@/assets/outlet-bosa.png";
import outletBodega from "@/assets/outlet-bodega.png";
import outletLakers from "@/assets/outlet-lakers.png";
import outletRedhare from "@/assets/outlet-redhare.png";
import outletDistrict5 from "@/assets/outlet-district5.png";
import outletInfinity from "@/assets/outlet-infinity.png";
import outletOombee from "@/assets/outlet-oombee.png";
import outletShiraz from "@/assets/outlet-shiraz.png";

// Provide fallback banners
export const fallbackBanners = [
  {
    id: -1,
    title: "A Symphony of Taste",
    subtitle: "Experience culinary excellence at our signature venues",
    imagePath: banner1,
    ctaLabel: "Explore Venues",
    ctaHref: "/#outlets",
    sortOrder: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -2,
    title: "Curated Selections",
    subtitle: "Discover our award-winning wine collections",
    imagePath: banner2,
    ctaLabel: "View Menus",
    ctaHref: "/menu",
    sortOrder: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -3,
    title: "Masterful Craft",
    subtitle: "Where passion meets precision in every dish",
    imagePath: banner3,
    ctaLabel: "Our Story",
    ctaHref: "/#about",
    sortOrder: 3,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

import type { Outlet } from "@workspace/api-client-react";

export const fallbackOutlets: Outlet[] = [
  {
    id: -1,
    slug: "atoz-bar",
    name: "AtoZ Bar Wine & Brasserie",
    tagline: "Refined wine and small plates",
    description: "An elegant sanctuary offering an extensive, curated wine list alongside sophisticated European-inspired small plates.",
    coverImagePath: outletAtoZ,
    cardImagePath: outletAtoZ,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -2,
    slug: "bosa",
    name: "Bosa Restaurant",
    tagline: "Modern South Asian fine dining",
    description: "A culinary journey through South Asia, reimagined with modern techniques and premium ingredients.",
    coverImagePath: outletBosa,
    cardImagePath: outletBosa,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -3,
    slug: "bodega",
    name: "Bodega All Day Dining",
    tagline: "Laid-back all-day cafe",
    description: "Your daily retreat for artisanal coffee, fresh pastries, and comforting cafe classics in a warm setting.",
    coverImagePath: outletBodega,
    cardImagePath: outletBodega,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -4,
    slug: "lakers",
    name: "Lakers By AtoZ",
    tagline: "Lakeside seafood",
    description: "Premium oceanic fare served with breathtaking lakeside views. Fresh, sustainable, and masterfully prepared.",
    coverImagePath: outletLakers,
    cardImagePath: outletLakers,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -5,
    slug: "redhare",
    name: "Redhare",
    tagline: "Cocktail-forward gastropub",
    description: "A moody, sophisticated space dedicated to the art of mixology and elevated pub gastronomy.",
    coverImagePath: outletRedhare,
    cardImagePath: outletRedhare,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -6,
    slug: "district5",
    name: "District5",
    tagline: "Industrial-chic fusion",
    description: "Bold flavors meet raw industrial design. A dynamic space where global culinary traditions collide.",
    coverImagePath: outletDistrict5,
    cardImagePath: outletDistrict5,
    sortOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -7,
    slug: "infinity",
    name: "Infinity",
    tagline: "Rooftop fine dining",
    description: "Elevate your evening. Exquisite tasting menus served against the backdrop of the city skyline.",
    coverImagePath: outletInfinity,
    cardImagePath: outletInfinity,
    sortOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -8,
    slug: "oombee",
    name: "Oombee",
    tagline: "Playful Asian street food",
    description: "Vibrant, unapologetic street food flavors in a high-energy, neon-lit atmosphere.",
    coverImagePath: outletOombee,
    cardImagePath: outletOombee,
    sortOrder: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: -9,
    slug: "shiraz",
    name: "Shiraz",
    tagline: "Persian-Mediterranean kitchen",
    description: "Rich spices, slow-cooked meats, and hearth-baked breads celebrating Mediterranean and Persian heritage.",
    coverImagePath: outletShiraz,
    cardImagePath: outletShiraz,
    sortOrder: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

import type { GalleryImage } from "@workspace/api-client-react";

export const fallbackGallery: GalleryImage[] = [
  { id: -1, imagePath: banner1, caption: null, outletId: null, sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: -2, imagePath: banner2, caption: null, outletId: null, sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: -3, imagePath: banner3, caption: null, outletId: null, sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: -4, imagePath: outletAtoZ, caption: null, outletId: null, sortOrder: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: -5, imagePath: outletBosa, caption: null, outletId: null, sortOrder: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: -6, imagePath: outletBodega, caption: null, outletId: null, sortOrder: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export function getImageUrl(imagePath?: string | null, width?: number, fallback?: string): string {
  if (!imagePath) return fallback || banner1;
  // If it's a generated asset path (like imported above)
  if (imagePath.startsWith('/src/assets') || imagePath.startsWith('data:') || imagePath.startsWith('http') || imagePath.startsWith('/assets/')) {
    return imagePath;
  }
  // Otherwise, it's an API storage path
  const baseUrl = (import.meta as any).env?.VITE_API_URL || "";
  const url = `${baseUrl}/api/storage${imagePath}`;
  return width ? `${url}?w=${width}` : url;
}
