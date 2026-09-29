import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthlyInsightsData, type MonthlyInsightData } from "@/lib/sosmed-api";

interface InsightChartCardProps {
  title: string;
  dataKey: keyof MonthlyInsightData;
  color: string;
}

export function InsightChartCard({ title, dataKey, color }: InsightChartCardProps) {
  const [data, setData] = useState<MonthlyInsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [outlet, setOutlet] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const filters: any = {};
      if (outlet !== "all") filters.outlet = outlet;
      
      if (month !== "all") {
        const [y, m] = month.split("-");
        filters.month = m;
        filters.year = y;
      }
      
      try {
        const res = await getMonthlyInsightsData(filters);
        setData(res);
      } catch (e) {
        console.error(e);
      }
      
      setLoading(false);
    }
    loadData();
  }, [outlet, month]);

  const monthOptions = [
    { value: "all", label: "All Time" },
    { value: "2026-07", label: "Juli 2026" },
    { value: "2026-08", label: "Agustus 2026" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-10", label: "Oktober 2026" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Statistik {title.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={outlet} onValueChange={setOutlet}>
            <SelectTrigger className="h-8 text-xs w-[110px]">
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
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SelectValue placeholder="Bulan" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[200px] w-full">
        {loading ? (
          <Skeleton className="w-full h-full rounded-md" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full text-sm text-muted-foreground">
            Belum ada data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey={(d) => d.date || d.month}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => {
                  if (!v) return "";
                  const d = new Date(v);
                  return month === "all" ? format(d, "MMM yyyy") : format(d, "dd MMM");
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                  return v;
                }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px', border: 'none',
                  boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                }}
                labelFormatter={(v) => {
                  if (!v) return "";
                  return format(new Date(v), month === "all" ? "MMMM yyyy" : "dd MMMM yyyy");
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                name={title}
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: color }}
                activeDot={{ r: 5, strokeWidth: 0, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
