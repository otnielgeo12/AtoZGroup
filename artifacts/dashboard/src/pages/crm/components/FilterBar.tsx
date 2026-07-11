/**
 * FilterBar — Search + filters for the CRM list page.
 *
 * Layout:
 *   [🔍 Search ──────────] [Start Date] [End Date] [Outlet ▾] [× Clear]
 */
import { X, Search, CalendarDays, UserPlus } from "lucide-react";
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
  foodCategory: string;
  beverageCategory: string;
  startDate: string;   // YYYY-MM-DD
  endDate:   string;   // YYYY-MM-DD
  status:    string;
}

export const EMPTY_FILTERS: FilterState = {
  search: "", outletId: "", foodCategory: "", beverageCategory: "", startDate: "", endDate: "", status: "",
};

interface FilterBarProps {
  filters:    FilterState;
  outlets:    Outlet[];
  categories: { code: string; name: string; sub_code: string; sub_name: string }[];
  onChange:   (next: FilterState) => void;
  isLoadingInsights?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasActiveFilters(f: FilterState) {
  return f.search || f.outletId || f.foodCategory || f.beverageCategory || f.startDate || f.endDate || f.status;
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({ filters, outlets, categories, onChange, isLoadingInsights }: FilterBarProps) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  const foodCategories = categories.filter(c => ["FOOD", "SNACK"].includes(c.code));
  const bevCategories = categories.filter(c => ["ALKOHOL", "BEV", "NON ALK", "WINE"].includes(c.code));

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Categories + Outlet + New Members Filter */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
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
          value={filters.foodCategory || "__all__"}
          onValueChange={(v) => update({ foodCategory: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]" data-testid="filter-food">
            <SelectValue placeholder="All Foods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Foods</SelectItem>
            {foodCategories.map((c) => (
              <SelectItem key={c.sub_code} value={c.sub_code}>{c.sub_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.beverageCategory || "__all__"}
          onValueChange={(v) => update({ beverageCategory: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[150px]" data-testid="filter-beverage">
            <SelectValue placeholder="All Beverages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Beverages</SelectItem>
            {bevCategories.map((c) => (
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

        <Button
          variant={filters.status === "New" ? "default" : "outline"}
          size="sm"
          className={
            filters.status === "New"
              ? "h-9 px-3 gap-1.5 font-medium shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
              : "h-9 px-3 gap-1.5 font-medium shrink-0 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          }
          onClick={() => update({ status: filters.status === "New" ? "" : "New" })}
          data-testid="filter-new-member"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Members</span>
        </Button>
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
