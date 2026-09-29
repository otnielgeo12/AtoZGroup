import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { getCalendarEvents, updateContent, type CalendarEvent, PLATFORM_CONFIG, type ContentOutlet } from "@/lib/sosmed-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SosmedCalendar({ onEventClick, onDayClick }: { onEventClick?: (id: string) => void, onDayClick?: (date: Date) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState<ContentOutlet | "all">("all");
  const [dateType, setDateType] = useState<"posting" | "produksi">("posting");

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getCalendarEvents(month, year, selectedOutlet, dateType);
      setEvents(data);
      setLoading(false);
    }
    load();
  }, [month, year, selectedOutlet, dateType]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(ev => {
      // Simply extract the YYYY-MM-DD part of the string regardless of format
      const key = ev.date.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [events]);

  const handlePrev = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNext = () => setCurrentDate(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData("eventId", eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    if (!eventId) return;

    const event = events.find(ev => ev.id === eventId);
    if (!event) return;

    // Preserve time if available, otherwise just use the new date string
    const timePart = event.date.includes('T') ? 'T' + event.date.split('T')[1] : 'T12:00:00Z';
    const newDateStr = format(targetDate, "yyyy-MM-dd") + timePart;
    
    // Update locally for immediate feedback
    setEvents(prev => prev.map(ev => 
      ev.id === eventId ? { ...ev, date: newDateStr } : ev
    ));
    
    toast.success("Konten berhasil dipindahkan!");

    // Call API (Background)
    try {
      await updateContent(eventId, { 
        [dateType === "posting" ? "scheduledDate" : "createdAt"]: newDateStr 
      });
    } catch (err) {
      toast.error("Gagal menyimpan perubahan ke server");
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrev}><ChevronLeft className="w-4 h-4" /></Button>
          <h2 className="text-xl font-bold w-[180px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNext}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="ghost" onClick={handleToday} className="hidden sm:inline-flex">Today</Button>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-1/2 sm:w-[150px]">
            <Select value={dateType} onValueChange={(v: any) => setDateType(v)}>
              <SelectTrigger className="w-full bg-background border-input font-medium text-xs">
                <SelectValue placeholder="Tipe Tanggal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="posting">Tgl Posting</SelectItem>
                <SelectItem value="produksi">Tgl Produksi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/2 sm:w-[150px]">
            <Select value={selectedOutlet} onValueChange={(v: any) => setSelectedOutlet(v)}>
              <SelectTrigger className="w-full bg-background border-input font-medium text-xs">
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

      {/* ─── Calendar Grid ─── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map(day => (
            <div key={day} className="py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {loading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="border-b border-r border-border p-2 min-h-[100px]">
                <Skeleton className="h-4 w-6 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate.get(dateStr) || [];
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => onDayClick?.(day)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day)}
                  className={`border-b border-r border-border p-1.5 min-h-[100px] transition-colors cursor-pointer ${
                    !inMonth ? "bg-muted/10 opacity-40" : "hover:bg-muted/20"
                  } ${today ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""}`}
                >
                  <div className="flex justify-end mb-1">
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      today ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                    }`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => {
                      const platformColor = PLATFORM_CONFIG[ev.platform].color;
                      return (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ev.id)}
                          onClick={(e) => { e.stopPropagation(); onEventClick?.(ev.id); }}
                          className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-all hover:opacity-80 hover:scale-[1.02] cursor-move"
                          style={{ backgroundColor: `${platformColor}18`, color: platformColor, borderLeft: `2px solid ${platformColor}` }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                    
                    {dayEvents.length > 3 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left text-[10px] text-muted-foreground pl-1.5 hover:text-primary transition-colors py-0.5"
                          >
                            +{dayEvents.length - 3} more
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold mb-2 px-1">{format(day, "d MMMM yyyy")}</p>
                            {dayEvents.slice(3).map(ev => {
                              const platformColor = PLATFORM_CONFIG[ev.platform].color;
                              return (
                                <div
                                  key={ev.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, ev.id)}
                                  onClick={(e) => { e.stopPropagation(); onEventClick?.(ev.id); }}
                                  className="w-full text-left px-2 py-1 rounded text-xs font-medium truncate cursor-move hover:opacity-80"
                                  style={{ backgroundColor: `${platformColor}18`, color: platformColor, borderLeft: `2px solid ${platformColor}` }}
                                >
                                  {ev.title}
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
