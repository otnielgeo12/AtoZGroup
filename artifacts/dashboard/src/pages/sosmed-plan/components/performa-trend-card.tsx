import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, TrendingUp } from "lucide-react";
import { getMonthlyInsightsData, getCalendarEvents, getInsight, type MonthlyInsightData, type CalendarEvent } from "@/lib/sosmed-api";

const METRICS = [
  { id: "reach", label: "Views / Reach", color: "#3b82f6" },
  { id: "impressions", label: "Impressions", color: "#a855f7" },
  { id: "likes", label: "Likes", color: "#ef4444" },
  { id: "comments", label: "Comments", color: "#f59e0b" },
  { id: "saves", label: "Saves", color: "#10b981" },
  { id: "shares", label: "Shares", color: "#0ea5e9" },
  { id: "engagement", label: "Engagement", color: "#f43f5e" }
];

export function PerformaTrendCard() {
  const [data, setData] = useState<MonthlyInsightData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [outlet, setOutlet] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [contentId, setContentId] = useState<string>("all");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["reach", "impressions"]); // Max 4
  
  const [contentOptions, setContentOptions] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (month !== "all") {
      const [y, m] = month.split("-");
      const monthIndex = parseInt(m) - 1;
      getCalendarEvents(monthIndex, parseInt(y), outlet as any)
        .then(events => {
          setContentOptions(events);
          setContentId("all");
        })
        .catch(console.error);
    } else {
      setContentOptions([]);
      setContentId("all");
    }
  }, [outlet, month]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (contentId !== "all") {
          const res = await getInsight(contentId);
          setData([{
            date: new Date().toISOString(),
            reach: res.reach,
            impressions: res.impressions,
            likes: res.likes,
            comments: res.comments_count,
            shares: res.shares,
            saves: res.saves,
            profileVisits: res.profile_visits,
            followersGained: res.followers_gained,
            engagement: res.likes + res.comments_count + res.shares + res.saves
          }]);
        } else {
          const filters: any = {};
          if (outlet !== "all") filters.outlet = outlet;
          if (month !== "all") {
            const [y, m] = month.split("-");
            filters.month = m;
            filters.year = y;
          }
          const res = await getMonthlyInsightsData(filters);
          setData(res);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, [outlet, month, contentId]);

  const monthOptions = [
    { value: "all", label: "All Time" },
    { value: "2026-07", label: "Juli 2026" },
    { value: "2026-08", label: "Agustus 2026" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-10", label: "Oktober 2026" },
  ];

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(m => m !== metricId);
      } else {
        if (prev.length >= 4) return prev; // Max 4
        return [...prev, metricId];
      }
    });
  };

  const renderChart = () => {
    if (loading) return <Skeleton className="w-full h-full rounded-md" />;
    if (data.length === 0) return <div className="flex items-center justify-center w-full h-full text-sm text-muted-foreground">Belum ada data</div>;

    const isSingleContent = contentId !== "all";

    if (isSingleContent) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} maxBarSize={60}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey={(d) => "Konten Terpilih"} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            {selectedMetrics.map(metricId => {
              const m = METRICS.find(x => x.id === metricId);
              if (!m) return null;
              return <Bar key={m.id} dataKey={m.id} name={m.label} fill={m.color} radius={[4, 4, 0, 0]} />;
            })}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            {selectedMetrics.map(metricId => {
              const m = METRICS.find(x => x.id === metricId);
              if (!m) return null;
              return (
                <linearGradient key={`color-${m.id}`} id={`color-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={m.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey={(d) => d.date || d.month} 
            axisLine={false} tickLine={false} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
            tickFormatter={(v) => {
              if (!v) return "";
              const d = new Date(v);
              return month === "all" ? format(d, "MMM yyyy") : format(d, "dd MMM");
            }}
            interval="preserveStartEnd" 
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} 
            labelFormatter={(v) => {
              if (!v) return "";
              return format(new Date(v), month === "all" ? "MMMM yyyy" : "dd MMMM yyyy");
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          {selectedMetrics.map(metricId => {
            const m = METRICS.find(x => x.id === metricId);
            if (!m) return null;
            return (
              <Area 
                key={m.id}
                type="monotone" 
                dataKey={m.id} 
                name={m.label} 
                stroke={m.color} 
                fillOpacity={1} 
                fill={`url(#color-${m.id})`}
                strokeWidth={2.5} 
                dot={{ r: 3, strokeWidth: 0, fill: m.color }} 
                activeDot={{ r: 5, strokeWidth: 0, fill: m.color }} 
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            Performa Trend
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Per platform dalam periode ini</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 border-border/50 bg-muted/30">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  {selectedMetrics.length} Metric
                  <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                PILIH METRIK (MAX 4)
              </div>
              {METRICS.map(m => (
                <DropdownMenuCheckboxItem
                  key={m.id}
                  checked={selectedMetrics.includes(m.id)}
                  onCheckedChange={() => handleMetricToggle(m.id)}
                  className="flex items-center gap-2"
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
        
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 mb-6">
        <Select value={outlet} onValueChange={setOutlet}>
          <SelectTrigger className="h-9 text-sm w-[130px] bg-background">
            <SelectValue placeholder="Outlet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Outlet</SelectItem>
            <SelectItem value="atoz">AtoZ</SelectItem>
            <SelectItem value="bosa">Bosa</SelectItem>
            <SelectItem value="bodega">Bodega</SelectItem>
            <SelectItem value="lakers">Lakers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-9 text-sm w-[140px] bg-background">
            <SelectValue placeholder="Bulan" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {month !== "all" && contentOptions.length > 0 && (
          <Select value={contentId} onValueChange={setContentId}>
            <SelectTrigger className="h-9 text-sm min-w-[180px] flex-1 max-w-[300px] bg-background">
              <SelectValue placeholder="Pilih Konten..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Konten</SelectItem>
              {contentOptions.map(content => (
                <SelectItem key={content.id} value={content.id} className="text-sm truncate max-w-[400px]">
                  {content.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="h-[350px] w-full">
        {renderChart()}
      </div>
    </div>
  );
}
