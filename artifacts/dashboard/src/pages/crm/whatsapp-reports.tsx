import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquareText, Send, Eye, CheckCheck, AlertTriangle,
  CalendarDays, X, ChevronLeft, ChevronRight, Clock, XCircle,
  Loader2, ImageIcon, RefreshCw,
} from "lucide-react";

import {
  fetchWhatsAppReports,
  type WhatsAppMessageLog,
  type WhatsAppReportsSummary,
} from "@/lib/crm-api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString("id-ID");
}

function pct(part: number, total: number): string {
  if (total === 0) return "0";
  return ((part / total) * 100).toFixed(1);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatPhone(phone: string): string {
  if (!phone) return "—";
  // Format 628xxx → +62 8xxx
  if (phone.startsWith("62")) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 5)}-${phone.slice(5, 9)}-${phone.slice(9)}`;
  }
  return phone;
}

function getDefaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30); // Last 30 days
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

// ─── Delivery Status Badge ────────────────────────────────────────────────────

function DeliveryStatusBadge({ log }: { log: WhatsAppMessageLog }) {
  // If the send itself failed
  if (log.status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1 text-[11px] font-medium">
        <XCircle className="w-3 h-3" />
        Failed
      </Badge>
    );
  }

  // If still pending send
  if (log.status === "pending") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-medium text-amber-700 border-amber-300 bg-amber-50">
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  }

  // Handle old messages before tracking was implemented
  if (log.status === "success" && !log.wablas_message_id && log.delivery_status === "pending") {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] font-medium text-blue-700 border-blue-300 bg-blue-50">
        <Send className="w-3 h-3" />
        Sent
      </Badge>
    );
  }

  // Message was sent successfully — show delivery tracking status
  switch (log.delivery_status) {
    case "read":
      return (
        <Badge variant="outline" className="gap-1 text-[11px] font-medium text-emerald-700 border-emerald-300 bg-emerald-50">
          <CheckCheck className="w-3 h-3" />
          Read
        </Badge>
      );
    case "sent":
      return (
        <Badge variant="outline" className="gap-1 text-[11px] font-medium text-blue-700 border-blue-300 bg-blue-50">
          <Send className="w-3 h-3" />
          Sent
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1 text-[11px] font-medium">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 text-[11px] font-medium text-gray-600 border-gray-300 bg-gray-50">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
  }
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({
  summary,
  isLoading,
}: {
  summary: WhatsAppReportsSummary | null;
  isLoading: boolean;
}) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Messages",
      value: formatNumber(summary.totalMessages),
      icon: <MessageSquareText className="w-4 h-4" />,
      color: "text-foreground",
      bgColor: "bg-muted/60",
      sub: null,
    },
    {
      label: "Sent Successfully",
      value: formatNumber(summary.totalSent),
      icon: <Send className="w-4 h-4" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      sub: summary.totalMessages > 0
        ? `${pct(summary.totalSent, summary.totalMessages)}% success rate`
        : null,
    },
    {
      label: "Read (Open Rate)",
      value: formatNumber(summary.totalRead),
      icon: <Eye className="w-4 h-4" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      sub: summary.totalSent > 0
        ? `${pct(summary.totalRead, summary.totalSent)}% open rate`
        : null,
    },
    {
      label: "Failed",
      value: formatNumber(summary.totalFailed),
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "text-red-600",
      bgColor: "bg-red-50",
      sub: summary.totalMessages > 0
        ? `${pct(summary.totalFailed, summary.totalMessages)}% fail rate`
        : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${c.bgColor} ${c.color} shrink-0`}>
              {c.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium truncate">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              {c.sub && (
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppReportsPage() {
  const defaults = getDefaultDateRange();

  // ── Filter state ────────────────────────────────────────────────────────
  const [brandFilter, setBrandFilter] = useState("atoz");
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // ── Fetch real data from wa-crm-api ─────────────────────────────────────
  const { data: reportData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["wa-reports", brandFilter, startDate, endDate],
    queryFn: () => fetchWhatsAppReports(
      startDate || undefined,
      endDate || undefined,
      brandFilter !== "__all__" ? brandFilter : undefined,
    ),
    staleTime: 30_000, // 30 seconds cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const messages = reportData?.data ?? [];
  const summary = reportData?.summary ?? null;

  // ── Pagination ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(messages.length / pageSize));
  const paginated = messages.slice((page - 1) * pageSize, page * pageSize);

  const hasActiveFilters = brandFilter !== "atoz" || startDate !== defaults.start || endDate !== defaults.end;

  const clearFilters = () => {
    setBrandFilter("atoz");
    setStartDate(defaults.start);
    setEndDate(defaults.end);
    setPage(1);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 bg-primary/10 rounded-lg">
              <MessageSquareText className="w-6 h-6 text-primary" />
            </span>
            WhatsApp Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor broadcast performance and message delivery tracking.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <SummaryCards summary={summary} isLoading={isLoading} />

      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0 self-center">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Period:</span>
              </div>

              <Input
                type="date"
                className="h-9 w-full sm:w-[155px] text-sm"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                data-testid="wa-filter-start-date"
              />
              <span className="text-muted-foreground text-xs self-center">to</span>
              <Input
                type="date"
                className="h-9 w-full sm:w-[155px] text-sm"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                data-testid="wa-filter-end-date"
              />

              <Select
                value={brandFilter}
                onValueChange={(v) => { setBrandFilter(v); setPage(1); }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[180px]" data-testid="wa-filter-brand">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Brands</SelectItem>
                  <SelectItem value="atoz">AtoZ</SelectItem>
                  <SelectItem value="bosa">Bosa</SelectItem>
                  <SelectItem value="bodega">Bodega</SelectItem>
                  <SelectItem value="redhare">Red Hare</SelectItem>
                  <SelectItem value="district5">District 5</SelectItem>
                  <SelectItem value="shiraz">Shiraz</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground shrink-0"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
          <span className="font-semibold text-foreground">{formatNumber(messages.length)}</span>
          {` Message${messages.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Message logs table */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base font-semibold">Message History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="w-[130px]">Date</TableHead>
                  <TableHead className="min-w-[120px]">Recipient</TableHead>
                  <TableHead className="min-w-[250px]">Message</TableHead>
                  <TableHead className="min-w-[80px]">Brand</TableHead>
                  <TableHead className="min-w-[90px]">Status</TableHead>
                  <TableHead className="min-w-[130px]">Read At</TableHead>
                  <TableHead className="min-w-[100px]">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                        <p className="text-destructive font-medium">Failed to load reports.</p>
                        <p className="text-sm text-muted-foreground">Make sure the API server is running and the database migration has been applied.</p>
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 gap-2">
                          <RefreshCw className="w-3.5 h-3.5" /> Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquareText className="w-8 h-8 text-muted-foreground/40" />
                        <p className="font-medium">No messages found.</p>
                        <p className="text-sm opacity-70">Try sending a WhatsApp broadcast first, or adjust the date range.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((log) => (
                    <TableRow key={log.id} className="group hover:bg-muted/40 transition-colors">
                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.sent_at || log.created_at)}
                      </TableCell>

                      {/* Recipient */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm truncate max-w-[160px]">
                            {log.customer_name || "Unknown"}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {formatPhone(log.recipient_number)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Message */}
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {log.image_url && (
                            <div className="shrink-0 p-1 rounded bg-muted/60">
                              <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]" title={log.message_text}>
                            {log.message_text}
                          </p>
                        </div>
                      </TableCell>

                      {/* Brand */}
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-normal whitespace-nowrap capitalize">
                          {log.brand_id}
                        </Badge>
                      </TableCell>

                      {/* Delivery Status */}
                      <TableCell>
                        <DeliveryStatusBadge log={log} />
                      </TableCell>

                      {/* Read At */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {log.read_at ? formatDateTime(log.read_at) : "—"}
                      </TableCell>

                      {/* Error */}
                      <TableCell>
                        {log.error_message ? (
                          <span className="text-[11px] text-destructive truncate max-w-[140px] block" title={log.error_message}>
                            {log.error_message}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && !isError && messages.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, messages.length)} of {messages.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2 min-w-[60px] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
