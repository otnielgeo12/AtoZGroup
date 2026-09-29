import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  listContents, deleteContent,
  type SosmedContent, type ContentPlatform, type ContentStatus, type ContentFunnel, type ContentOutlet,
  STATUS_CONFIG, FUNNEL_CONFIG, PLATFORM_CONFIG,
} from "@/lib/sosmed-api";

const OUTLETS: ContentOutlet[] = ["atoz", "bosa", "bodega", "lakers"];
import { PlatformIcon } from "./components/platform-icon";
import { InsightModal } from "./components/insight-modal";
import { toast } from "sonner";
import { LineChart } from "lucide-react";

interface ContentTableProps {
  onEdit: (content: SosmedContent) => void;
}

export function SosmedContentTable({ onEdit }: ContentTableProps) {
  const [data, setData] = useState<SosmedContent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [insightContent, setInsightContent] = useState<SosmedContent | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [outletFilter, setOutletFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await listContents({
      search: search || undefined,
      platform: platformFilter !== "all" ? platformFilter as ContentPlatform : undefined,
      status: statusFilter !== "all" ? statusFilter as ContentStatus : undefined,
      outlet: outletFilter !== "all" ? outletFilter as ContentOutlet : undefined,
      page,
      pageSize,
    });
    setData(result.data);
    setTotal(result.total);
    setLoading(false);
  }, [search, platformFilter, statusFilter, outletFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, platformFilter, statusFilter, outletFilter]);

  const totalPages = Math.ceil(total / pageSize);

  const handleDelete = async (id: string) => {
    await deleteContent(id);
    toast.success("Konten berhasil dihapus");
    fetchData();
  };

  return (
    <div className="space-y-4">
      {/* ─── Search & Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul atau caption..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Platform</SelectItem>
              {(Object.keys(PLATFORM_CONFIG) as ContentPlatform[]).map(p => (
                <SelectItem key={p} value={p} className="capitalize">{PLATFORM_CONFIG[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {(Object.keys(STATUS_CONFIG) as ContentStatus[]).map(s => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={outletFilter} onValueChange={setOutletFilter}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Outlet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {OUTLETS.map(o => (
                <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Judul</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pilar</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outlet</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funnel</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approval</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <Filter className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Tidak ada konten ditemukan</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Coba ubah filter pencarian Anda</p>
                  </td>
                </tr>
              ) : data.map(item => {
                const stCfg = STATUS_CONFIG[item.status];
                const fnCfg = FUNNEL_CONFIG[item.funnel];
                return (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{item.title}</td>
                    <td className="px-3 py-3 text-center">
                      <PlatformIcon platform={item.platform} size="md" />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{item.format}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{item.pillar}</td>
                    <td className="px-3 py-3 text-center text-xs text-muted-foreground capitalize">{item.outlet || "atoz"}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${fnCfg.bg} ${fnCfg.color}`}>
                        {fnCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${stCfg.bg} ${stCfg.color}`}>
                        {stCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.approval === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : item.approval === "rejected"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}>
                        {item.approval === "approved" ? "Approved" : item.approval === "rejected" ? "Rejected" : "Pending"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.scheduledDate), "dd MMM yyyy")}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2 cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setInsightContent(item)} className="gap-2 cursor-pointer text-indigo-600 focus:text-indigo-600">
                            <LineChart className="w-3.5 h-3.5" /> Insight
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(item.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total} konten
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="icon"
                  className="h-7 w-7 text-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <InsightModal 
        content={insightContent} 
        open={!!insightContent} 
        onOpenChange={(open) => !open && setInsightContent(null)} 
      />
    </div>
  );
}
