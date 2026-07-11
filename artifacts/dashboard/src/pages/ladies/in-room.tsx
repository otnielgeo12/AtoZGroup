import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Play,
  Plus,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Timer,
  UserCheck,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import {
  listRoomBookings,
  startRoomBooking,
  addOvertimeBooking,
  completeRoomBooking,
  ladiesKeys,
  type RoomBooking,
} from "@/lib/ladies-api";
import { useToast } from "@/hooks/use-toast";

// Helper component for live countdown timer
function SessionTimer({ endsAt }: { endsAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>("Calculating...");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!endsAt) {
      setTimeLeft("-- : -- : --");
      return;
    }

    const calculate = () => {
      // Parse database timestamp safely
      const end = new Date(endsAt).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("00h 00m 00s (Expired)");
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}h ${minutes
          .toString()
          .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
      );
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shadow-sm ${
        isExpired
          ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse"
          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      }`}
    >
      <Timer className={`w-4 h-4 ${isExpired ? "text-red-500" : "text-emerald-400"}`} />
      <span>{timeLeft}</span>
    </div>
  );
}

export default function LadiesInRoomPage() {
  const params = useParams<{ outlet: string }>();
  const [, setLocation] = useLocation();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const outlet = params.outlet || "district5";
  const outletName = outlet === "district5" ? "District5" : "Infinity";
  const LADIES_API_URL = import.meta.env.VITE_LADIES_API_URL || "https://apid5.atozgroupsemarang.com";

  // Fetch live bookings every 5 seconds
  const {
    data: bookings = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ladiesKeys.roomBooking(outlet),
    queryFn: () => listRoomBookings(outlet, getToken),
    refetchInterval: 5000,
  });

  // Start Booking Mutation
  const startMutation = useMutation({
    mutationFn: (id: number) => startRoomBooking(id, getToken),
    onSuccess: () => {
      toast({
        title: "Session Started",
        description: "The companion's room timer is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ladiesKeys.roomBooking(outlet) });
      queryClient.invalidateQueries({ queryKey: ladiesKeys.list(outlet) });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to start session",
        variant: "destructive",
      });
    },
  });

  // Overtime Mutation
  const overtimeMutation = useMutation({
    mutationFn: ({ id, hours }: { id: number; hours: number }) =>
      addOvertimeBooking(id, hours, getToken),
    onSuccess: (_, variables) => {
      toast({
        title: "Overtime Added",
        description: `Added ${variables.hours} hour(s) overtime successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ladiesKeys.roomBooking(outlet) });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to add overtime",
        variant: "destructive",
      });
    },
  });

  // Complete Mutation
  const completeMutation = useMutation({
    mutationFn: (id: number) => completeRoomBooking(id, getToken),
    onSuccess: () => {
      toast({
        title: "Session Completed",
        description: "The companion has finished the room session and is now Ready.",
      });
      queryClient.invalidateQueries({ queryKey: ladiesKeys.roomBooking(outlet) });
      queryClient.invalidateQueries({ queryKey: ladiesKeys.list(outlet) });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to complete session",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Top Bar / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/ladies")}
            className="rounded-xl border-border/60 hover:bg-accent/50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {outletName}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Real-Time Room Monitor</span>
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
              Ladies In Room
              {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 rounded-xl text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setLocation(`/ladies/${outlet}`)}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs px-4"
          >
            Ladies
          </Button>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Synchronized with VIP Landing Page:</span> When a customer confirms a booking on the landing page, the companion automatically appears here with <span className="text-amber-400 font-semibold">Waiting to Start</span> status. Click <span className="text-foreground font-semibold">Confirm</span> when the session begins. When the timer ends or you click Complete, the companion returns to <span className="text-emerald-400 font-semibold">Ready</span> status.
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="animate-pulse bg-card/40 border-border/40 h-64 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-red-500/20 bg-red-500/5 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Failed to Load Active Sessions</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Could not connect to the companion management server.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
            Try Again
          </Button>
        </Card>
      ) : bookings.length === 0 ? (
        /* Empty State */
        <Card className="p-16 text-center border-border/40 bg-card/30 backdrop-blur-md rounded-3xl shadow-lg border-dashed">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <UserCheck className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-foreground mb-2">No Active Room Sessions</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
            All companions in {outletName} are currently available. When VIP bookings are confirmed or new sessions start, they will appear here in real-time.
          </p>
          <Button
            onClick={() => setLocation(`/ladies/${outlet}`)}
            variant="outline"
            className="rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
          >
            View Companion Roster
          </Button>
        </Card>
      ) : (
        /* Bookings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const isWaiting = booking.status === "waiting";
            const isActive = booking.status === "active";

            return (
              <Card
                key={booking.id}
                className={`relative overflow-hidden transition-all duration-300 rounded-2xl border-2 shadow-lg bg-card/80 backdrop-blur-md ${
                  isActive
                    ? "border-emerald-500/40 shadow-emerald-500/5 hover:border-emerald-500/60"
                    : "border-amber-500/40 shadow-amber-500/5 hover:border-amber-500/60"
                }`}
              >
                {/* Top Status Banner */}
                <div
                  className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border-b border-amber-500/20"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? "bg-emerald-400 animate-ping" : "bg-amber-500"
                      }`}
                    />
                    {isActive ? "Active in Room" : "Waiting to Start"}
                  </span>
                  <span>{booking.hours} Hour(s) Booked</span>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Companion Profile Header */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-border/60 bg-muted shrink-0 shadow-md">
                      {booking.lady_photo ? (
                        <img
                          src={booking.lady_photo.startsWith("http") ? booking.lady_photo : `${LADIES_API_URL}${booking.lady_photo.startsWith("/") ? "" : "/"}${booking.lady_photo}`}
                          alt={booking.lady_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-serif font-bold text-muted-foreground">
                          {booking.lady_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 uppercase tracking-wider border border-amber-500/20">
                          {booking.lady_category}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {booking.lady_age} yrs
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-foreground truncate">
                        {booking.lady_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {booking.notes || "No special instructions"}
                      </p>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div className="bg-background/60 rounded-xl p-3.5 border border-border/50 flex flex-col items-center justify-center gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {isActive ? "Live Countdown Timer" : "Session Duration"}
                    </span>
                    {isActive ? (
                      <SessionTimer endsAt={booking.ends_at} />
                    ) : (
                      <div className="text-lg font-serif font-bold text-amber-500">
                        {booking.hours} Hour{booking.hours > 1 ? "s" : ""} Reserved
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2.5">
                    {isWaiting ? (
                      <Button
                        onClick={() => startMutation.mutate(booking.id)}
                        disabled={startMutation.isPending}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold h-11 rounded-xl shadow-lg shadow-amber-500/10 gap-2 transition-all"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        Confirm
                      </Button>
                    ) : (
                      <>
                        {/* Overtime Button with Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={overtimeMutation.isPending}
                              className="flex-1 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 font-bold h-11 rounded-xl gap-2 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              Overtime
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44 rounded-xl border-border/60 bg-card/95 backdrop-blur-md">
                            <DropdownMenuItem
                              onClick={() => overtimeMutation.mutate({ id: booking.id, hours: 1 })}
                              className="font-semibold cursor-pointer py-2.5"
                            >
                              <Plus className="w-3.5 h-3.5 mr-2 text-amber-500" />
                              +1 Hour Overtime
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => overtimeMutation.mutate({ id: booking.id, hours: 2 })}
                              className="font-semibold cursor-pointer py-2.5"
                            >
                              <Plus className="w-3.5 h-3.5 mr-2 text-amber-500" />
                              +2 Hours Overtime
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => overtimeMutation.mutate({ id: booking.id, hours: 3 })}
                              className="font-semibold cursor-pointer py-2.5"
                            >
                              <Plus className="w-3.5 h-3.5 mr-2 text-amber-500" />
                              +3 Hours Overtime
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* End Session Button */}
                        <Button
                          onClick={() => completeMutation.mutate(booking.id)}
                          disabled={completeMutation.isPending}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-500/10 gap-2 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
