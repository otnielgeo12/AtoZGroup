import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthlyInsightsData, getCalendarEvents, getInsight, type MonthlyInsightData, type CalendarEvent } from "@/lib/sosmed-api";

const METRICS = [
  { id: "global", label: "Global (Semua)", color: "" },
  { id: "reach", label: "Views / Reach", color: "#3b82f6" },
  { id: "impressions", label: "Impressions", color: "#a855f7" },
  { id: "likes", label: "Likes", color: "#ef4444" },
  { id: "comments", label: "Comments", color: "#f59e0b" },
  { id: "saves", label: "Saves", color: "#10b981" },
  { id: "shares", label: "Shares", color: "#0ea5e9" }
];

export function UnifiedInsightCard() {
  const [data, setData] = useState<MonthlyInsightData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [outlet, setOutlet] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [contentId, setContentId] = useState<string>("all");
  const [metric, setMetric] = useState<string>("global");
  
  const [contentOptions, setContentOptions] = useState<CalendarEvent[]>([]);

  // Effect to load contents when month/outlet changes
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

  // Effect to load chart data
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

  const selectedMetricObj = METRICS.find(m => m.id === metric);

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
            {metric === "global" ? (
              <>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="reach" name="Reach" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="impressions" name="Impressions" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="likes" name="Likes" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" name="Comments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saves" name="Saves" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="shares" name="Shares" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <Bar dataKey={metric} name={selectedMetricObj?.label} fill={selectedMetricObj?.color} radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
          
          {metric === "global" ? (
            <>
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="reach" name="Reach" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="impressions" name="Impressions" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="engagement" name="Engagement (L+C+S)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </>
          ) : (
            <Line 
              type="monotone" 
              dataKey={metric} 
              name={selectedMetricObj?.label} 
              stroke={selectedMetricObj?.color} 
              strokeWidth={2.5} 
              dot={{ r: 3, strokeWidth: 0, fill: selectedMetricObj?.color }} 
              activeDot={{ r: 5, strokeWidth: 0, fill: selectedMetricObj?.color }} 
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Performa Sosmed</h3>
          <p className="text-sm text-muted-foreground mt-1">Analisis metrik konten berdasarkan filter.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="h-9 text-sm w-[160px] bg-background">
              <SelectValue placeholder="Pilih Metrik" />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

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
                <SelectItem value="all">Semua Konten (Bulan Ini)</SelectItem>
                {contentOptions.map(content => (
                  <SelectItem key={content.id} value={content.id} className="text-sm truncate max-w-[400px]">
                    {content.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="h-[350px] w-full mt-4">
        {renderChart()}
      </div>
    </div>
  );
}
