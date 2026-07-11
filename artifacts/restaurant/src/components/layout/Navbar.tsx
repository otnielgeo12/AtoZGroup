import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Venues", href: "/#outlets" },
    { name: "Menus", href: "/menu" },
    { name: "Gallery", href: "/gallery" },
    { name: "Our Story", href: "/#about" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled || isOpen
            ? "bg-background/90 backdrop-blur-md border-b border-white/5 py-4"
            : "bg-transparent py-6"
          }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 z-50">
            <span className="font-serif text-2xl font-bold tracking-widest text-primary-foreground">
              AtoZ Group
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium tracking-widest uppercase text-foreground/80 hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Button
              variant="outline"
              className="rounded-none border-primary/50 text-primary-foreground hover:bg-primary hover:text-white transition-all font-serif tracking-wide"
              asChild
            >
              <Link href="/#reservations">Reservations</Link>
            </Button>
          </nav>

          {/* Mobile Toggle */}
          <button
            className="md:hidden z-50 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="font-serif text-3xl text-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <Button
                variant="outline"
                className="rounded-none border-primary text-primary hover:bg-primary hover:text-white transition-all text-lg mt-4 h-12 px-8"
                onClick={() => setIsOpen(false)}
                asChild
              >
                <Link href="/#reservations">Reservations</Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
