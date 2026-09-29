import { useState, useEffect } from "react";
import { FileText, CheckCircle, CalendarClock, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  getContentStats, listContents,
  type ContentStats, type SosmedContent, STATUS_CONFIG,
} from "@/lib/sosmed-api";
import { SosmedStatCard } from "./components/stat-card";
import { PlatformIcon } from "./components/platform-icon";
import { InsightChartCard } from "./components/insight-chart-card";

export function SosmedDashboard() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [upcoming, setUpcoming] = useState<SosmedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, u] = await Promise.all([
        getContentStats(),
        listContents({ status: "scheduled", pageSize: 100 }),
      ]);
      setStats(s);
      
      // Sort upcoming by date ascending
      const sorted = u.data
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 8);
      setUpcoming(sorted);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border bg-card p-5">
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </div>
          <div className="rounded-xl border bg-card p-5">
            <Skeleton className="h-[280px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SosmedStatCard
          title="Total Konten"
          value={stats.totalContent}
          icon={<FileText className="w-5 h-5" />}
          iconColor="bg-gradient-to-br from-blue-500 to-indigo-600"
          change="+12%"
          changeType="positive"
          subtitle="vs bulan lalu"
        />
        <SosmedStatCard
          title="Dipublikasikan"
          value={stats.published}
          icon={<CheckCircle className="w-5 h-5" />}
          iconColor="bg-gradient-to-br from-emerald-500 to-green-600"
          change={`${Math.round((stats.published / stats.totalContent) * 100)}%`}
          changeType="positive"
          subtitle="dari total"
        />
        <SosmedStatCard
          title="Terjadwal"
          value={stats.scheduled}
          icon={<CalendarClock className="w-5 h-5" />}
          iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
          change="Active"
          changeType="neutral"
          subtitle="menunggu publish"
        />
        <SosmedStatCard
          title="Rata-rata Engagement"
          value={`${stats.avgEngagement}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="bg-gradient-to-br from-violet-500 to-purple-600"
          change="+0.8%"
          changeType="positive"
          subtitle="30 hari terakhir"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Charts Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightChartCard title="Views / Reach" dataKey="reach" color="#3b82f6" />
            <InsightChartCard title="Impressions" dataKey="impressions" color="#a855f7" />
            <InsightChartCard title="Likes" dataKey="likes" color="#ef4444" />
            <InsightChartCard title="Comments" dataKey="comments" color="#f59e0b" />
            <InsightChartCard title="Saves" dataKey="saves" color="#10b981" />
            <InsightChartCard title="Shares" dataKey="shares" color="#0ea5e9" />
          </div>
        </div>

        {/* Upcoming Content List */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col h-fit sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Akan Datang</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Jadwal konten terdekat</p>
            </div>
            <CalendarClock className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CalendarClock className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs">Belum ada konten terjadwal</p>
              </div>
            ) : upcoming.map(item => {
              const stCfg = STATUS_CONFIG[item.status];
              return (
                <div key={item.id} className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                  <div className="mt-0.5">
                    <PlatformIcon platform={item.platform} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${stCfg.bg} ${stCfg.color}`}>
                        {stCfg.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(item.scheduledDate), "dd MMM")}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
