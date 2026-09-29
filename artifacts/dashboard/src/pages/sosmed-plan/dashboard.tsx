import { useState, useEffect } from "react";
import { FileText, CheckCircle, CalendarClock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getContentStats,
  type ContentStats,
} from "@/lib/sosmed-api";
import { SosmedStatCard } from "./components/stat-card";
import { PerformaTrendCard } from "./components/performa-trend-card";
import { MetricGridCards } from "./components/metric-grid-cards";
import { TopContentCard } from "./components/top-content-card";

export function SosmedDashboard() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const s = await getContentStats();
        setStats(s);
      } catch (err) {
        console.error(err);
      }
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
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
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

      {/* Main Charts Area */}
      <div className="flex flex-col gap-6">
        <PerformaTrendCard />
        <MetricGridCards />
        <TopContentCard />
      </div>
    </div>
  );
}
