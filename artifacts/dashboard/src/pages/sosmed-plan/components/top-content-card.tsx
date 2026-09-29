import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listContents, getInsight, type SosmedContent, STATUS_CONFIG } from "@/lib/sosmed-api";
import { PlatformIcon } from "./platform-icon";

interface TopContentData extends SosmedContent {
  impressions: number;
  engagementRate: number;
}

export function TopContentCard() {
  const [data, setData] = useState<TopContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("impressions");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch recent published contents
        const res = await listContents({ status: "published", pageSize: 10 });
        
        // Fetch insights for each content
        const enriched = await Promise.all(
          res.data.map(async (content) => {
            try {
              const insight = await getInsight(content.id);
              // Calculate ER: (engagement / reach) * 100
              const totalEng = insight.likes + insight.comments_count + insight.shares + insight.saves;
              const er = insight.reach > 0 ? (totalEng / insight.reach) * 100 : 0;
              return {
                ...content,
                impressions: insight.impressions,
                engagementRate: er
              };
            } catch (e) {
              return { ...content, impressions: 0, engagementRate: 0 };
            }
          })
        );
        
        setData(enriched);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "impressions") return b.impressions - a.impressions;
    return b.engagementRate - a.engagementRate;
  });

  // Group by platform
  const groupedData: Record<string, TopContentData[]> = {};
  sortedData.forEach(item => {
    if (!groupedData[item.platform]) groupedData[item.platform] = [];
    groupedData[item.platform].push(item);
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-muted-foreground" />
            Top Content per Platform
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Patokan ranking: {sortBy === 'impressions' ? 'Tayangan' : 'Engagement Rate'}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Urutkan Berdasarkan</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 text-sm w-[180px] bg-background">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impressions">Tayangan (Impressions)</SelectItem>
              <SelectItem value="engagementRate">Engagement Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-4 py-3 rounded-l-lg w-16 text-center">Rank</th>
              <th className="px-4 py-3">Konten</th>
              <th className="px-4 py-3 text-right">Tayangan</th>
              <th className="px-4 py-3 text-right">Engagement Rate</th>
              <th className="px-4 py-3 rounded-r-lg text-right">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-4"><Skeleton className="h-4 w-4 mx-auto" /></td>
                  <td className="px-4 py-4 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : Object.keys(groupedData).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada data konten.</td>
              </tr>
            ) : (
              Object.entries(groupedData).map(([platform, items]) => (
                <React.Fragment key={platform}>
                  {/* Platform Header */}
                  <tr className="bg-muted/20 border-b border-border/50">
                    <td colSpan={5} className="px-4 py-2 text-xs font-semibold uppercase text-primary tracking-wider">
                      {platform}
                    </td>
                  </tr>
                  
                  {/* Items for this platform */}
                  {items.map((item, index) => {
                    const stCfg = STATUS_CONFIG[item.status];
                    return (
                      <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4 text-center font-medium">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-foreground mb-1">{item.title}</div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/50">
                              <PlatformIcon platform={item.platform} size="xs" />
                              {item.platform}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${stCfg.bg} ${stCfg.color}`}>
                              {stCfg.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums">
                          {item.impressions >= 1000 ? `${(item.impressions / 1000).toFixed(1)}k` : item.impressions}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums">
                          {item.engagementRate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-4 text-right text-muted-foreground">
                          {format(new Date(item.scheduledDate || item.createdAt), "d MMM yyyy")}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
