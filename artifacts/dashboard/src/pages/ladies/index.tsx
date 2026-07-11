import { useLocation } from "wouter";
import { Sparkles, Users, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const OUTLETS = [
  {
    slug: "district5",
    name: "District5",
    subtitle: "Exclusive Ladies Profile",
    description: "Premium VIP karaoke lounge with platinum-tier companion roster & private luxury suites.",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    accent: "text-amber-500",
    border: "border-amber-500/30 hover:border-amber-500/60",
    buttonAccent: "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold",
    icon: "👑",
  },
  {
    slug: "infinity",
    name: "Infinity",
    subtitle: "High-Energy Entertainment Lounge",
    description: "Ultra-modern entertainment venue featuring diamond & gold talent selections and VIP hospitality.",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    accent: "text-purple-400",
    border: "border-purple-500/30 hover:border-purple-500/60",
    buttonAccent: "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold",
    icon: "✨",
  },
];

export default function LadiesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight flex items-center gap-3 text-foreground">
            <span className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </span>
            Ladies Management
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Select an outlet to access companion rosters, performance reports, and real-time room tracking.
          </p>
        </div>
      </div>

      {/* Outlet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {OUTLETS.map((outlet) => (
          <Card
            key={outlet.slug}
            className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl border-2 bg-card/60 backdrop-blur-md ${outlet.border}`}
            data-testid={`outlet-card-${outlet.slug}`}
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${outlet.gradient} opacity-80 pointer-events-none`} />

            <CardContent className="p-8 relative z-10 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl p-3 bg-background/80 rounded-2xl border border-border/50 shadow-md">
                    {outlet.icon}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-background/80 border border-border/50 ${outlet.accent}`}>
                    Active Outlet
                  </span>
                </div>

                <h2 className={`text-3xl font-serif font-bold ${outlet.accent} mb-1`}>{outlet.name}</h2>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
                  {outlet.subtitle}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {outlet.description}
                </p>
              </div>

              {/* Two Option Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border/40">
                <Button
                  variant="outline"
                  className="h-auto py-3.5 px-4 flex flex-col items-start gap-1 bg-background/60 hover:bg-background/90 border-border/60 hover:border-amber-500/40 transition-all text-left"
                  onClick={() => setLocation(`/ladies/${outlet.slug}`)}
                >
                  <div className="flex items-center justify-between w-full text-foreground font-semibold text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      Ladies
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Roster, profiles & monthly summary
                  </span>
                </Button>

                <Button
                  className={`h-auto py-3.5 px-4 flex flex-col items-start gap-1 shadow-lg transition-all text-left ${outlet.buttonAccent}`}
                  onClick={() => setLocation(`/ladies/${outlet.slug}/in-room`)}
                >
                  <div className="flex items-center justify-between w-full font-bold text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Ladies In Room
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-[11px] opacity-80 font-normal">
                    Real-time timer & overtime control
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
