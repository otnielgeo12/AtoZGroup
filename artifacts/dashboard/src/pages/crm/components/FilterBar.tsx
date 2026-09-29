/**
 * FilterBar — Search + filters for the CRM list page.
 *
 * Layout:
 *   [🔍 Search ──────────] [Start Date] [End Date] [Outlet ▾] [× Clear]
 */
import { useState } from "react";
import { X, Search, CalendarDays, UserPlus, Check, ChevronsUpDown, Utensils, Wine, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Outlet } from "@/lib/crm-api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FilterState {
  search:    string;
  outletId:  string;
  category:  string;
  startDate: string;   // YYYY-MM-DD
  endDate:   string;   // YYYY-MM-DD
  status:    string;
}

export const EMPTY_FILTERS: FilterState = {
  search: "", outletId: "", category: "", startDate: "", endDate: "", status: "",
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
  return f.search || f.outletId || f.category || f.startDate || f.endDate || f.status;
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({ filters, outlets, categories, onChange, isLoadingInsights }: FilterBarProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);

  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  // Group categories dynamically by main category name
  const groupedCategories = categories.reduce((acc, cat) => {
    const mainGroup = cat.name || "OTHER";
    if (!acc[mainGroup]) acc[mainGroup] = [];
    acc[mainGroup].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

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

        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={categoryOpen}
              className={cn(
                "h-9 w-full sm:w-[240px] justify-between font-normal shrink-0",
                filters.category ? "text-foreground" : "text-muted-foreground"
              )}
              data-testid="filter-category"
            >
              {filters.category ? (
                <div className="flex items-center gap-1.5 truncate">
                  {categories.find(c => c.sub_code === filters.category)?.name === "BEVERAGE" ? (
                    <Wine className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  ) : categories.find(c => c.sub_code === filters.category)?.name === "FOOD" ? (
                    <Utensils className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  ) : null}
                  <span className="truncate">
                    {categories.find(c => c.sub_code === filters.category)?.sub_name || filters.category}
                  </span>
                </div>
              ) : (
                "All Categories"
              )}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {filters.category ? (
                  <div
                    role="button"
                    className="h-4 w-4 rounded-sm hover:bg-muted/80 flex items-center justify-center shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      update({ category: "" });
                    }}
                  >
                    <X className="w-3 h-3 opacity-60" />
                  </div>
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search category..." />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                {Object.entries(groupedCategories).sort(([a], [b]) => a.localeCompare(b)).map(([mainCat, subCats]) => (
                  <CommandGroup key={mainCat} heading={mainCat}>
                    {subCats.map((c) => (
                      <CommandItem
                        key={c.sub_code}
                        value={c.sub_name}
                        onSelect={() => {
                          update({ category: c.sub_code === filters.category ? "" : c.sub_code });
                          setCategoryOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.category === c.sub_code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2 truncate">
                          {mainCat === "BEVERAGE" && <Wine className="w-3 h-3 text-purple-400 shrink-0" />}
                          {mainCat === "FOOD" && <Utensils className="w-3 h-3 text-orange-400 shrink-0" />}
                          <span className="truncate">{c.sub_name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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
