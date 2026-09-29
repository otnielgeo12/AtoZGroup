import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthlyInsightsData, type MonthlyInsightData } from "@/lib/sosmed-api";

const METRICS = [
  { id: "impressions", label: "Tayangan (Impressions)", color: "#3b82f6" },
  { id: "engagement", label: "Engagement Rate", color: "#6366f1" },
  { id: "likes", label: "Suka (Likes)", color: "#ef4444" },
  { id: "shares", label: "Bagikan (Shares)", color: "#10b981" }
];

export function MetricGridCards() {
  const [data, setData] = useState<MonthlyInsightData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getMonthlyInsightsData({});
        setData(res);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 h-[250px]">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {METRICS.map(metric => (
        <div key={metric.id} className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">{metric.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tren Bulanan untuk rentang aktif</p>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  tickFormatter={(v) => format(new Date(v), "MMM yy")}
                  interval="preserveStartEnd" 
                />
                <YAxis 
                  axisLine={false} tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} 
                  labelFormatter={(v) => format(new Date(v), "MMMM yyyy")}
                />
                <Area 
                  type="monotone" 
                  dataKey={metric.id} 
                  name={metric.label} 
                  stroke={metric.color} 
                  fillOpacity={1} 
                  fill={`url(#color-${metric.id})`}
                  strokeWidth={2.5} 
                  dot={{ r: 3, strokeWidth: 0, fill: metric.color }} 
                  activeDot={{ r: 5, strokeWidth: 0, fill: metric.color }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
