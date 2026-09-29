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
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
}

export function TopContentCard() {
  const [data, setData] = useState<TopContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("impressions");
  const [outlet, setOutlet] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch recent published contents
        const query: any = { status: "published", pageSize: 100 };
        if (outlet !== "all") query.outlet = outlet;
        
        const res = await listContents(query);
        
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
                engagementRate: er,
                likes: insight.likes,
                comments: insight.comments_count,
                shares: insight.shares,
                saves: insight.saves,
                reach: insight.reach
              };
            } catch (e) {
              return { ...content, impressions: 0, engagementRate: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0 };
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
  }, [outlet]);

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case "engagementRate": return b.engagementRate - a.engagementRate;
      case "likes": return b.likes - a.likes;
      case "comments": return b.comments - a.comments;
      case "shares": 
      case "repost": return b.shares - a.shares;
      case "saves": return b.saves - a.saves;
      case "reach": return b.reach - a.reach;
      case "impressions":
      case "impresi":
      default:
        return b.impressions - a.impressions;
    }
  });

  // Group by platform, limit to 5 per platform
  const groupedData: Record<string, TopContentData[]> = {};
  sortedData.forEach(item => {
    if (!groupedData[item.platform]) groupedData[item.platform] = [];
    if (groupedData[item.platform].length < 5) {
      groupedData[item.platform].push(item);
    }
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-muted-foreground" />
            Top 5 Content per Platform
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Patokan ranking: Berdasarkan Pilihan</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Outlet
            </span>
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
          </div>

          <div className="flex flex-col items-start gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Urutkan Top Content Berdasarkan
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-sm w-[240px] bg-background">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="impressions">Tayangan</SelectItem>
                <SelectItem value="impresi">Impresi</SelectItem>
                <SelectItem value="engagementRate">Engagement Rate</SelectItem>
                <SelectItem value="likes">Suka</SelectItem>
                <SelectItem value="comments">Komentar</SelectItem>
                <SelectItem value="shares">Bagikan</SelectItem>
                <SelectItem value="repost">Repost</SelectItem>
                <SelectItem value="saves">Disimpan</SelectItem>
                <SelectItem value="clicks">Klik</SelectItem>
                <SelectItem value="thruplays">ThruPlays</SelectItem>
                <SelectItem value="3sec">3-Second Watch Time</SelectItem>
                <SelectItem value="gmv">GMV / Purchase Value</SelectItem>
                <SelectItem value="clickRate">Click Rate</SelectItem>
                <SelectItem value="hookRate">Hook Rate</SelectItem>
                <SelectItem value="holdRate">Hold Rate</SelectItem>
                <SelectItem value="watchTime">Waktu Tonton</SelectItem>
                <SelectItem value="totalEng">Total Engagement</SelectItem>
                <SelectItem value="profile">Aktivitas Profil</SelectItem>
                <SelectItem value="avgWatch">Rata-rata Waktu Tonton</SelectItem>
                <SelectItem value="newFollowers">Pengikut Baru</SelectItem>
                <SelectItem value="completed">Tonton Sampai Habis</SelectItem>
                <SelectItem value="skipRate">Rasio Skip</SelectItem>
                <SelectItem value="avgSkipReels">Rata-rata Rasio Skip Reels</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-4 py-3 rounded-l-lg w-16 text-center">Rank</th>
              <th className="px-4 py-3">Konten</th>
              <th className="px-4 py-3 text-right">Nilai Metrik</th>
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
                  <tr className={`${platform.toLowerCase() === 'ig' || platform.toLowerCase() === 'instagram' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' : 'bg-slate-50 text-slate-600 dark:bg-slate-900/50 dark:text-slate-400'} border-b border-border/50`}>
                    <td colSpan={5} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider">
                      {platform}
                    </td>
                  </tr>
                  
                  {/* Items for this platform */}
                  {items.map((item, index) => {
                    const stCfg = STATUS_CONFIG[item.status];
                    const isIg = item.platform.toLowerCase() === 'ig' || item.platform.toLowerCase() === 'instagram';
                    
                    let metricValue: number | string = item.impressions;
                    switch(sortBy) {
                      case "likes": metricValue = item.likes; break;
                      case "comments": metricValue = item.comments; break;
                      case "shares": case "repost": metricValue = item.shares; break;
                      case "saves": metricValue = item.saves; break;
                      case "reach": metricValue = item.reach; break;
                      case "engagementRate": metricValue = item.engagementRate; break;
                    }

                    if (typeof metricValue === "number" && sortBy !== "engagementRate") {
                       metricValue = metricValue >= 1000 ? `${(metricValue / 1000).toFixed(1)}k` : metricValue;
                    } else if (sortBy === "engagementRate" && typeof metricValue === "number") {
                       metricValue = metricValue.toFixed(1) + "%";
                    }

                    return (
                      <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4 text-center font-medium">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-foreground mb-1.5">{item.title}</div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isIg ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' 
                                   : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
                            }`}>
                              {item.platform}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${stCfg.bg} ${stCfg.color}`}>
                              {stCfg.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums">
                          {metricValue}
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
