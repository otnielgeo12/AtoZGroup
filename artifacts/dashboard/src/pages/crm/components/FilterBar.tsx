/**
 * FilterBar — Compact advanced filter for the CRM list page.
 *
 * Layout (single horizontal row on md+):
 *   [🔍 Search ──────────────] [Food badges] [Bev badges] [Outlet ▾] [× Clear]
 */
import { X, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FoodPreference, BevPreference, Outlet } from "@/lib/crm-api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FilterState {
  search:    string;
  foodPrefs: FoodPreference[];
  bevPrefs:  BevPreference[];
  outletId:  string;
}

export const EMPTY_FILTERS: FilterState = {
  search: "", foodPrefs: [], bevPrefs: [], outletId: "",
};

interface FilterBarProps {
  filters:   FilterState;
  outlets:   Outlet[];
  onChange:  (next: FilterState) => void;
}

// ─── Sub-component: toggle badge ─────────────────────────────────────────────

function ToggleBadge({
  label, active, onClick, colorClass,
}: { label: string; active: boolean; onClick: () => void; colorClass: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 select-none cursor-pointer",
        active
          ? `${colorClass} shadow-sm`
          : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {label}
      {active && <X className="w-3 h-3 ml-0.5 opacity-70" />}
    </button>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

const FOOD_OPTIONS: { value: FoodPreference; label: string; color: string }[] = [
  { value: "Steak",     label: "🥩 Steak",     color: "bg-orange-100 text-orange-800 border-orange-300" },
  { value: "Ala Carte", label: "🍽 Ala Carte",  color: "bg-purple-100 text-purple-800 border-purple-300" },
];

const BEV_OPTIONS: { value: BevPreference; label: string; color: string }[] = [
  { value: "Cocktail", label: "🍹 Cocktail", color: "bg-pink-100 text-pink-800 border-pink-300" },
  { value: "Whisky",   label: "🥃 Whisky",   color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "Wine",     label: "🍷 Wine",      color: "bg-rose-100 text-rose-800 border-rose-300" },
];

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function hasActiveFilters(f: FilterState) {
  return f.search || f.foodPrefs.length || f.bevPrefs.length || f.outletId;
}

export function FilterBar({ filters, outlets, onChange }: FilterBarProps) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  const activeCount =
    (filters.foodPrefs.length > 0 ? 1 : 0) +
    (filters.bevPrefs.length > 0 ? 1 : 0) +
    (filters.outletId ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Outlet + Clear */}
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
          value={filters.outletId || "__all__"}
          onValueChange={(v) => update({ outletId: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="h-9 w-full sm:w-[200px]" data-testid="filter-outlet">
            <SelectValue placeholder="All Outlets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Outlets</SelectItem>
            {outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground shrink-0"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
            {activeCount > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Row 2: Preference badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Preferences:
        </span>

        <div className="flex flex-wrap gap-1.5 items-center">
          {FOOD_OPTIONS.map((opt) => (
            <ToggleBadge
              key={opt.value}
              label={opt.label}
              active={filters.foodPrefs.includes(opt.value)}
              colorClass={opt.color}
              onClick={() => update({ foodPrefs: toggleItem(filters.foodPrefs, opt.value) })}
            />
          ))}

          <span className="w-px h-4 bg-border mx-0.5" />

          {BEV_OPTIONS.map((opt) => (
            <ToggleBadge
              key={opt.value}
              label={opt.label}
              active={filters.bevPrefs.includes(opt.value)}
              colorClass={opt.color}
              onClick={() => update({ bevPrefs: toggleItem(filters.bevPrefs, opt.value) })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
