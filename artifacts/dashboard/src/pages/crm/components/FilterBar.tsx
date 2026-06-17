/**
 * FilterBar — Search + filters for the CRM list page.
 *
 * Layout:
 *   [🔍 Search ──────────] [Start Date] [End Date] [Outlet ▾] [× Clear]
 */
import { X, Search, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Outlet } from "@/lib/crm-api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FilterState {
  search:    string;
  outletId:  string;
  category:  string;
  startDate: string;   // YYYY-MM-DD
  endDate:   string;   // YYYY-MM-DD
}

export const EMPTY_FILTERS: FilterState = {
  search: "", outletId: "", category: "", startDate: "", endDate: "",
};

interface FilterBarProps {
  filters:    FilterState;
  outlets:    Outlet[];
  categories: { code: string; name: string }[];
  onChange:   (next: FilterState) => void;
  isLoadingInsights?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasActiveFilters(f: FilterState) {
  return f.search || f.outletId || f.category || f.startDate || f.endDate;
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({ filters, outlets, categories, onChange, isLoadingInsights }: FilterBarProps) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Category + Outlet */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, phone, or email…"
            className="pl-9 h-9"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            data-testid="input-crm-search"
          />
        </div>

        <Select
          value={filters.category || "__all__"}
          onValueChange={(v) => update({ category: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[180px]" data-testid="filter-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.sub_code} value={c.sub_code}>{c.sub_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.outletId || "__all__"}
          onValueChange={(v) => update({ outletId: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[180px]" data-testid="filter-outlet">
            <SelectValue placeholder="All Outlets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Outlets</SelectItem>
            {outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Date range for Customer Insights + Clear */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Insight Period:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            className="h-9 w-[155px] text-sm"
            value={filters.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            data-testid="filter-start-date"
            placeholder="Start date"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            className="h-9 w-[155px] text-sm"
            value={filters.endDate}
            onChange={(e) => update({ endDate: e.target.value })}
            data-testid="filter-end-date"
            placeholder="End date"
          />
        </div>

        {isLoadingInsights && (
          <span className="text-xs text-muted-foreground animate-pulse flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Loading insights…
          </span>
        )}

        {!filters.startDate && !filters.endDate && !isLoadingInsights && (
          <span className="text-[11px] text-muted-foreground italic">
            Showing last 1 month. Set dates to filter specific period.
          </span>
        )}

        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground shrink-0"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
