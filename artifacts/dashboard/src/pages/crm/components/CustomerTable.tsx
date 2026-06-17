import { Eye, Pencil, Crown, UserCheck, UserPlus, Phone, Mail, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Utensils, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomerListItem, CustomerStatus } from "@/lib/crm-api";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CustomerStatus, { cls: string; icon: React.ReactNode }> = {
  VIP:     { cls: "bg-amber-100 text-amber-800 border-amber-200",   icon: <Crown    className="w-3 h-3 mr-1" /> },
  Regular: { cls: "bg-blue-100 text-blue-800 border-blue-200",      icon: <UserCheck className="w-3 h-3 mr-1" /> },
  New:     { cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <UserPlus className="w-3 h-3 mr-1" /> },
};

function StatusBadge({ status }: { status: CustomerStatus }) {
  const { cls, icon } = STATUS_CFG[status] ?? STATUS_CFG.Regular;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {icon}{status}
    </span>
  );
}

// ─── Pagination controls ─────────────────────────────────────────────────────

interface PaginationProps {
  page: number; pageSize: number; total: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}

function Pagination({ page, pageSize, total, onPage, onPageSize }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
      <p className="text-sm text-muted-foreground shrink-0">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="shrink-0">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => { onPageSize(Number(v)); onPage(1); }}>
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPage(1)} disabled={page === 1}>
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPage(page - 1)} disabled={page === 1}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 min-w-[60px] text-center">
            {page} / {pageCount}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPage(page + 1)} disabled={page >= pageCount}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPage(pageCount)} disabled={page >= pageCount}>
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── CustomerTable ────────────────────────────────────────────────────────────

interface CustomerTableProps {
  customers:   CustomerListItem[];
  isLoading:   boolean;
  isError:     boolean;
  page:        number;
  pageSize:    number;
  total:       number;
  onPage:      (p: number) => void;
  onPageSize:  (s: number) => void;
  onView:      (c: CustomerListItem) => void;
  onEdit:      (c: CustomerListItem) => void;
  selectedIds:    Set<string>;
  onToggle:       (id: string) => void;
  onToggleAll:    (ids: string[], checked: boolean) => void;
}

export function CustomerTable({
  customers, isLoading, isError,
  page, pageSize, total, onPage, onPageSize,
  onView, onEdit,
  selectedIds, onToggle, onToggleAll,
}: CustomerTableProps) {
  const paginated = customers;
  const COL_COUNT = 12;
  const allOnPageSelected = paginated.length > 0 && paginated.every(c => selectedIds.has(c.id));
  const someOnPageSelected = paginated.some(c => selectedIds.has(c.id));

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="pl-4 w-[44px]" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => {
                    onToggleAll(paginated.map(c => c.id), !!checked);
                  }}
                  aria-label="Select all on page"
                  data-testid="checkbox-select-all"
                />
              </TableHead>
              <TableHead className="min-w-[60px]">Code</TableHead>
              <TableHead className="min-w-[180px]">Customer</TableHead>
              <TableHead className="min-w-[180px]">Contact</TableHead>
              <TableHead className="min-w-[120px]">Category</TableHead>
              <TableHead className="min-w-[160px]">Outlet</TableHead>
              <TableHead className="min-w-[140px]">Food Prefs</TableHead>
              <TableHead className="min-w-[140px]">Beverage Prefs</TableHead>
              <TableHead className="text-right min-w-[120px]">Spending</TableHead>
              <TableHead className="text-right min-w-[80px]">Visits</TableHead>
              <TableHead className="text-right min-w-[90px]">Points</TableHead>
              <TableHead className="text-right pr-4 min-w-[90px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COL_COUNT }).map((_, j) => (
                    <TableCell key={j} className={j === 0 ? "pl-4" : j === COL_COUNT - 1 ? "pr-4" : ""}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-16 text-destructive">
                  Failed to load customers. Check your connection and try again.
                </TableCell>
              </TableRow>
            ) : !customers.length ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-16 text-muted-foreground">
                  <p className="font-medium">No customers match your filters.</p>
                  <p className="text-sm mt-1 opacity-70">Try adjusting the search or filter criteria.</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer group hover:bg-muted/40 transition-colors"
                  onClick={() => onView(c)}
                  data-testid={`crm-row-${c.id}`}
                >
                  {/* Checkbox */}
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(c.id)}
                      onCheckedChange={() => onToggle(c.id)}
                      aria-label={`Select ${c.fullName}`}
                      data-testid={`checkbox-${c.id}`}
                    />
                  </TableCell>

                  {/* Code */}
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      {c.id}
                    </span>
                  </TableCell>

                  {/* Customer name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0 border border-primary/20">
                        {c.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <span className="font-medium text-sm group-hover:text-primary transition-colors truncate max-w-[150px]">
                        {c.fullName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3 h-3 text-muted-foreground shrink-0" />{c.phone}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[130px]">{c.email}</span>
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                      {c.categoryName && c.categoryName !== "—" ? c.categoryName : "Unknown"}
                    </span>
                  </TableCell>

                  {/* Outlet */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-[13px] text-foreground truncate max-w-[140px]">
                        {c.primaryOutletName && c.primaryOutletName !== "—" ? c.primaryOutletName : "All Outlets"}
                      </span>
                      {(c.city || c.province || c.address) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {[c.city, c.province].filter(Boolean).join(", ") || c.address || ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Food Preferences */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1">
                      {c.foodPreferences.length > 0 ? (
                        c.foodPreferences.slice(0, 3).map((pref, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                            <Utensils className="w-2.5 h-2.5" />{pref}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                      {c.foodPreferences.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{c.foodPreferences.length - 3}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Beverage Preferences */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1">
                      {c.beveragePreferences.length > 0 ? (
                        c.beveragePreferences.slice(0, 3).map((pref, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Wine className="w-2.5 h-2.5" />{pref}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                      {c.beveragePreferences.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{c.beveragePreferences.length - 3}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Spending */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {c.totalSpending > 0 ? (
                      <span className="font-semibold text-[13px] text-foreground">
                        Rp {c.totalSpending.toLocaleString("id-ID")}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Visits */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {c.totalVisits > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {c.totalVisits}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Points */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.pointBalance.toLocaleString("id-ID")} pts
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={c.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(c)} data-testid={`btn-view-${c.id}`}>
                        <Eye className="w-3.5 h-3.5" /><span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(c)} data-testid={`btn-edit-${c.id}`}>
                        <Pencil className="w-3.5 h-3.5" /><span className="sr-only">Edit</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && !isError && customers.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPage={onPage} onPageSize={onPageSize} />
      )}
    </div>
  );
}
