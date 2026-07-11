import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useRoute, useLocation } from "wouter";
import {
  Sparkles, Plus, ArrowLeft, Crown, Gem, User,
  Loader2, Pencil, Trash2, Calendar, Download, Filter, X, Power,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

import {
  listLadies, deleteLady, toggleLadyActive, getLadiesReport,
  ladiesKeys, type Lady, type LadyReport,
} from "@/lib/ladies-api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const isLadyActive = (val: any) => val !== false && val !== 0 && val !== "0" && val !== "false" && val !== null && val !== undefined;

const OUTLET_NAMES: Record<string, string> = {
  district5: "District5",
  infinity: "Infinity",
};

const CATEGORY_CONFIG: Record<string, any> = {
  sapphire: { label: "Sapphire (Spahiere)", icon: Crown, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  spahiere: { label: "Sapphire (Spahiere)", icon: Crown, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  diamond:  { label: "Diamond",  icon: Gem,   color: "text-cyan-300",  bg: "bg-cyan-300/10",  border: "border-cyan-300/30" },
};

function downloadLadiesReportPdf(
  outletName: string,
  dateLabel: string,
  ladies: Lady[],
  reportMap: Map<number, LadyReport>
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const now = format(new Date(), "dd MMMM yyyy, HH:mm");

  // Cover header
  doc.setFillColor(128, 48, 59);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 245, 220);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`AtoZ Group — ${outletName} Ladies Report`, 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${dateLabel}  |  Generated: ${now}`, 14, 19);

  const headers = ["No", "Name", "Age", "Category", "Status", "Total Hours", "Bookings"];
  const body = ladies.map((l, idx) => {
    const r = reportMap.get(l.id);
    return [
      String(idx + 1),
      l.name,
      String(l.age),
      l.category.toUpperCase(),
      l.status ? l.status.toUpperCase() : "READY",
      `${r?.total_hours || 0} hrs`,
      String(r?.total_bookings || 0),
    ];
  });

  autoTable(doc, {
    head: [headers],
    body,
    startY: 26,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [128, 48, 59],
      textColor: [255, 245, 220],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [252, 249, 245] },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" }, // No
      1: { cellWidth: 50 }, // Name
      2: { cellWidth: 16, halign: "center" }, // Age
      3: { cellWidth: 28, halign: "center" }, // Category
      4: { cellWidth: 28, halign: "center" }, // Status
      5: { cellWidth: 26, halign: "right" }, // Total Hours
      6: { cellWidth: 22, halign: "right" }, // Bookings
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}  |  Confidential — Internal Use Only`,
      14,
      doc.internal.pageSize.height - 6
    );
  }

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Ladies_Report_${outletName}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  }, 150);
}

export default function LadiesOutletPage() {
  const [, params] = useRoute("/ladies/:outlet");
  const [, setLocation] = useLocation();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const outlet = params?.outlet || "district5";
  const outletName = OUTLET_NAMES[outlet] || outlet;

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<Lady | null>(null);

  // Current month for report
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: ladies = [], isLoading } = useQuery({
    queryKey: ladiesKeys.list(outlet, categoryFilter !== "all" ? categoryFilter : undefined),
    queryFn: () => listLadies(outlet, getToken, categoryFilter !== "all" ? categoryFilter : undefined),
  });

  const { data: report = [] } = useQuery({
    queryKey: ladiesKeys.report(outlet, currentMonth, startDate || undefined, endDate || undefined),
    queryFn: () => getLadiesReport(outlet, currentMonth, getToken, startDate || undefined, endDate || undefined),
  });

  // Report map for quick lookup
  const reportMap = useMemo(() => {
    const map = new Map<number, LadyReport>();
    report.forEach((r) => map.set(r.id, r));
    return map;
  }, [report]);

  // ── Delete Mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLady(id, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ladiesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ladiesKeys.reports() });
      setDeleteTarget(null);
      toast({ title: "Lady deleted successfully" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" }),
  });

  // ── Toggle Active Mutation ────────────────────────────────────────────────
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      toggleLadyActive(id, is_active, getToken),
    onSuccess: (updatedLady) => {
      queryClient.invalidateQueries({ queryKey: ladiesKeys.lists() });
      toast({
        title: updatedLady.is_active !== false ? "Lady Activated" : "Lady Deactivated (Libur)",
        description: `${updatedLady.name} is now ${updatedLady.is_active !== false ? "visible on" : "hidden from"} District5 Landing Page.`,
      });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" }),
  });

  // ── Summary Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      total: ladies.length,
      sapphire: ladies.filter((l) => l.category === "sapphire" || l.category === "spahiere" || (l.category as string) === "platinum" || (l.category as string) === "regular").length,
      diamond: ladies.filter((l) => l.category === "diamond").length,
    };
  }, [ladies]);

  const LADIES_API_URL = import.meta.env.VITE_LADIES_API_URL || "https://apid5.atozgroupsemarang.com";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/ladies")}
            data-testid="btn-back-ladies"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {outletName} — Ladies
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {startDate && endDate ? `Report Period: ${startDate} to ${endDate}` : `Monthly Report: ${currentMonth}`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation(`/ladies/${outlet}/add`)}
          data-testid="btn-add-lady"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lady
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Ladies", value: stats.total, icon: <Sparkles className="w-4 h-4" />, color: "text-foreground" },
          { label: "Sapphire (Spahiere)", value: stats.sapphire, icon: <Crown className="w-4 h-4" />, color: "text-blue-400" },
          { label: "Diamond", value: stats.diamond, icon: <Gem className="w-4 h-4" />, color: "text-cyan-300" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/60 ${c.color} shrink-0`}>{c.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>
                  {isLoading ? <Skeleton className="h-7 w-8" /> : c.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter & Export */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Filter className="w-4 h-4" />
              Filter & Report Period
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dateLabel = startDate && endDate ? `${startDate} to ${endDate}` : `Month: ${currentMonth}`;
                downloadLadiesReportPdf(outletName, dateLabel, ladies, reportMap);
              }}
              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="sapphire">Sapphire (Spahiere)</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[150px] h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[150px] h-9 text-xs"
                min={startDate || undefined}
              />
            </div>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Clear Date Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ladies Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                    Total Hours
                  </div>
                </TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : ladies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No ladies found for this outlet.
                  </TableCell>
                </TableRow>
              ) : (
                ladies.map((lady) => {
                  const r = reportMap.get(lady.id);
                  const catConf = CATEGORY_CONFIG[lady.category] || CATEGORY_CONFIG.sapphire;
                  const photo = lady.photos?.[0]?.photo_path;
                  const photoUrl = photo ? (photo.startsWith("http") ? photo : `${LADIES_API_URL}${photo.startsWith("/") ? "" : "/"}${photo}`) : null;

                  const active = isLadyActive(lady.is_active);
                  return (
                    <TableRow
                      key={lady.id}
                      data-testid={`lady-row-${lady.id}`}
                      className={!active ? "opacity-60 bg-muted/20" : ""}
                    >
                      <TableCell>
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={lady.name}
                            className="w-10 h-10 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{lady.name}</TableCell>
                      <TableCell>{lady.age}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${catConf.bg} ${catConf.color} ${catConf.border} text-xs`}>
                          {catConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lady.status === "ready" ? "default" : "secondary"} className={
                          lady.status === "ready"
                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs"
                            : lady.status === "reserve"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs"
                            : "bg-red-500/15 text-red-400 border-red-500/30 text-xs"
                        }>
                          {lady.status === "ready" ? "Ready" : lady.status === "reserve" ? "Reserve" : "Book"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {r?.total_hours ?? 0}h
                      </TableCell>
                      <TableCell className="text-center">
                        {r?.total_bookings ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div
                            className="flex items-center gap-2 bg-muted/40 px-2.5 py-1 rounded-full border border-border/60 shadow-sm cursor-pointer hover:bg-muted/60 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActiveMutation.mutate({ id: lady.id, is_active: !active });
                            }}
                            title={active ? "Status: ON (Muncul di Landing Page). Klik untuk OFF." : "Status: OFF (Hilang dari Landing Page). Klik untuk ON."}
                          >
                            <span className={`text-[11px] font-bold tracking-wider ${!active ? "text-red-500" : "text-muted-foreground/60"}`}>
                              OFF
                            </span>
                            <Switch
                              checked={active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: lady.id, is_active: checked })
                              }
                              disabled={toggleActiveMutation.isPending}
                              className="data-[state=checked]:bg-emerald-500 scale-90 cursor-pointer pointer-events-none"
                            />
                            <span className={`text-[11px] font-bold tracking-wider ${active ? "text-emerald-500" : "text-muted-foreground/60"}`}>
                              ON
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-1"
                            onClick={() => setLocation(`/ladies/${outlet}/edit/${lady.id}`)}
                            data-testid={`btn-edit-${lady.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(lady)}
                            data-testid={`btn-delete-${lady.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lady</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone. All photos and booking history will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
