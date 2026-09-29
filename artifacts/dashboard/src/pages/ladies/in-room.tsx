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
  ChevronDown,
  Check,
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

// Helper component for live session timer (counts UP)
function SessionTimer({ startedAt }: { startedAt: string | null }) {
  const [elapsedTime, setElapsedTime] = useState<string>("Calculating...");

  useEffect(() => {
    if (!startedAt) {
      setElapsedTime("00h 00m 00s");
      return;
    }

    const calculate = () => {
      // Parse database timestamp safely
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diff = now - start;

      if (diff <= 0) {
        setElapsedTime("00h 00m 00s");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${hours.toString().padStart(2, "0")}h ${minutes
          .toString()
          .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
      );
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shadow-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    >
      <Timer className="w-4 h-4 text-emerald-400" />
      <span>{elapsedTime}</span>
    </div>
  );
}

export default function LadiesInRoomPage() {
  const params = useParams<{ outlet: string }>();
  const [, setLocation] = useLocation();
  const { getToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRooms, setSelectedRooms] = useState<Record<number, string>>({});
  
  const ROOMS = [
    { type: 'Superior', name: 'Monaco' },
    { type: 'Superior', name: 'Tokyo' },
    { type: 'Deluxe', name: 'Dubai' },
    { type: 'Deluxe', name: 'Oslo' },
    { type: 'Deluxe', name: 'Paris' },
    { type: 'VIP', name: 'Milan' },
    { type: 'VIP', name: 'Jakarta' },
    { type: 'VIP', name: 'London' },
    { type: 'VVIP', name: 'Vegas' }
  ];

  const outlet = params.outlet || "district5";
  const outletName = outlet === "district5" ? "District5" : "Infinity";
  const rawLadiesUrl = import.meta.env.VITE_LADIES_API_URL || "https://apid5.atozgroupsemarang.com";
  const LADIES_API_URL = rawLadiesUrl.replace(/["'\r\n\t]+/g, "").trim().replace(/\/$/, "");

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
    mutationFn: ({ id, roomName, adminName }: { id: number; roomName: string; adminName: string }) => startRoomBooking(id, getToken, roomName, adminName),
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

                      </div>
                      <h3 className="text-xl font-serif font-bold text-foreground truncate">
                        {booking.lady_name}
                      </h3>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div className="bg-background/60 rounded-xl p-4 border border-border/50 flex flex-col items-center justify-center gap-1.5 min-h-[90px]">
                    {isActive && (
                      <div className="flex flex-col items-center text-center">
                        {booking.room_name && (
                          <span className="text-sm font-semibold text-foreground/90">
                            Room: <span className="text-amber-500 font-bold">{booking.room_name.replace(' (', ' : ').replace(')', '')}</span>
                          </span>
                        )}
                        {booking.approved_by && (
                          <span className="text-xs text-muted-foreground font-medium mt-0.5 mb-2">
                            Handle by: {booking.approved_by}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                          Live Session Timer
                        </span>
                      </div>
                    )}
                    {isActive ? (
                      <SessionTimer startedAt={booking.started_at} />
                    ) : (
                      <div className="text-sm font-semibold text-amber-500 text-center leading-snug px-2">
                        {selectedRooms[booking.id] ? (
                          <span>
                            You Select <span className="font-bold text-amber-400">{selectedRooms[booking.id].replace(' (', ' ').replace(')', '')}</span> Room,<br />Please confirm
                          </span>
                        ) : (
                          "Please Select the Room & Confirm"
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2.5">
                    {isWaiting ? (
                      <div className="w-full flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex-1 justify-between bg-background hover:bg-background border-amber-500/40 text-foreground font-medium rounded-xl h-11 px-3 hover:border-amber-500 min-w-0"
                            >
                              <span className="flex items-center gap-2 truncate min-w-0">
                                {selectedRooms[booking.id] ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-foreground shrink-0" />
                                    <span className="truncate">{selectedRooms[booking.id].replace(' (', ' : ').replace(')', '')}</span>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground truncate">Select Room...</span>
                                )}
                              </span>
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[240px] rounded-xl border-border/60 bg-card/95 backdrop-blur-md p-1.5 shadow-xl max-h-[300px] overflow-y-auto">
                            <div className="px-2 py-2 text-xs font-semibold text-muted-foreground mb-1">Select Room...</div>
                            {ROOMS.map((r) => {
                              const value = `${r.type} (${r.name})`;
                              const display = `${r.type} : ${r.name}`;
                              const isSelected = selectedRooms[booking.id] === value;
                              return (
                                <DropdownMenuItem
                                  key={r.name}
                                  onClick={() => setSelectedRooms({ ...selectedRooms, [booking.id]: value })}
                                  className={`font-medium cursor-pointer py-2.5 px-3 rounded-lg flex items-center gap-2 ${isSelected ? 'bg-amber-500/10 text-amber-500' : ''}`}
                                >
                                  {isSelected ? (
                                    <Check className="w-4 h-4 text-amber-500 shrink-0" />
                                  ) : (
                                    <span className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0 bg-background" />
                                  )}
                                  {display}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          onClick={() => {
                            if (!selectedRooms[booking.id]) {
                              toast({ title: "Room Required", description: "Please select a room first.", variant: "destructive" });
                              return;
                            }
                            startMutation.mutate({ id: booking.id, roomName: selectedRooms[booking.id], adminName: user?.username || "Admin" });
                          }}
                          disabled={startMutation.isPending}
                          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold h-11 rounded-xl shadow-lg shadow-amber-500/10 gap-1.5 transition-all px-4 shrink-0"
                        >
                          <Play className="w-4 h-4 fill-black shrink-0" />
                          Confirm
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* End Session Button */}
                        <Button
                          onClick={() => completeMutation.mutate(booking.id)}
                          disabled={completeMutation.isPending}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-500/10 gap-2 transition-all"
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
