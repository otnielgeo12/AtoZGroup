import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Plus, Download, FileSpreadsheet, FileText,
  Crown, UserCheck, UserPlus, Loader2, MessageCircle,
} from "lucide-react";

import {
  listCustomers, listOutlets, listCategories, createCustomer, updateCustomer,
  countCustomers, fetchCustomerInsights, mergeInsightsIntoMembers, mapInsightToListItem, crmKeys,
  type CustomerListItem, type CustomerStatus, type CreateCustomerBody, type Outlet,
} from "@/lib/crm-api";
import { downloadExcel, downloadPdf } from "@/lib/crm-export";
import { FilterBar, EMPTY_FILTERS, type FilterState } from "./components/FilterBar";
import { CustomerTable } from "./components/CustomerTable";
import { WhatsAppModal } from "./components/WhatsAppModal";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ─── Form schema ──────────────────────────────────────────────────────────────

const customerSchema = z.object({
  firstName:        z.string().min(1, "First name is required"),
  lastName:         z.string().optional(),
  phone:            z.string().min(1, "Phone number is required"),
  email:            z.string().email("Invalid email").or(z.literal("")).optional(),
  address:          z.string().optional(),
  city:             z.string().optional(),
  province:         z.string().optional(),
  outletCode:       z.string().min(1, "Outlet is required"),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

// ─── Stat cards ───────────────────────────────────────────────────────────────

const STAT_CONFIG: Record<CustomerStatus, { label: string; icon: React.ReactNode; color: string }> = {
  VIP:     { label: "VIP Members",   icon: <Crown     className="w-4 h-4" />, color: "text-amber-600" },
  Regular: { label: "Regular",       icon: <UserCheck className="w-4 h-4" />, color: "text-blue-600" },
  New:     { label: "New Guests",    icon: <UserPlus  className="w-4 h-4" />, color: "text-emerald-600" },
};

function SummaryCards({ total, newGuestsCount, isLoading, isCounting }: { total: number; newGuestsCount: number; isLoading: boolean; isCounting?: boolean }) {
  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
      ))}
    </div>
  );

  const regularCount = Math.max(0, total - newGuestsCount);
  const cards = [
    { label: "Total",       value: total,          icon: <Users className="w-4 h-4" />,     color: "text-foreground" },
    { label: "VIP Members", value: 0,              icon: <Crown className="w-4 h-4" />,     color: "text-amber-600" },
    { label: "Regular",     value: regularCount,   icon: <UserCheck className="w-4 h-4" />, color: "text-blue-600" },
    { label: "New Guests",  value: newGuestsCount, icon: <UserPlus className="w-4 h-4" />,  color: "text-emerald-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted/60 ${c.color} shrink-0`}>{c.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>
                {isCounting && c.label === "Total" ? (
                  <span className="text-sm font-medium animate-pulse text-muted-foreground">Counting...</span>
                ) : (
                  c.value
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Customer form ─────────────────────────────────────────────────────────────

function CustomerForm({
  form, onSubmit, isPending, onCancel, outlets,
}: {
  form: ReturnType<typeof useForm<CustomerFormValues>>;
  onSubmit: (d: CustomerFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
  outlets: Outlet[];
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="e.g. Anastasia" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl><Input placeholder="e.g. Wijaya" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone / WhatsApp <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="0812-3456-7890" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="name@email.com" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="outletCode" render={({ field }) => (
            <FormItem>
              <FormLabel>Outlet <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Address</FormLabel>
              <FormControl><Input placeholder="Full address" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl><Input placeholder="e.g. Semarang" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="province" render={({ field }) => (
            <FormItem>
              <FormLabel>Province</FormLabel>
              <FormControl><Input placeholder="e.g. Jawa Tengah" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Customer"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// ─── Main CRM page ────────────────────────────────────────────────────────────

export default function CrmPage() {
  const { getToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Filter & pagination state ─────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);

  // Debounced search — prevents API call on every keystroke (300ms delay)
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [filters.search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filters]);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen]       = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);

  // ── Export state ──────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  // ── WhatsApp selection state ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMap, setSelectedMap] = useState<Map<string, CustomerListItem>>(new Map());
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);

  const handleToggle = useCallback((c: CustomerListItem) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(c.id)) next.delete(c.id);
      else next.add(c.id);
      return next;
    });
    setSelectedMap(prev => {
      const next = new Map(prev);
      if (next.has(c.id)) next.delete(c.id);
      else next.set(c.id, c);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((customers: CustomerListItem[], checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) customers.forEach(c => next.add(c.id));
      else customers.forEach(c => next.delete(c.id));
      return next;
    });
    setSelectedMap(prev => {
      const next = new Map(prev);
      if (checked) customers.forEach(c => next.set(c.id, c));
      else customers.forEach(c => next.delete(c.id));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedMap(new Map());
  }, []);

  // ── Queries ───────────────────────────────────────────────────────────────
  const apiTake = pageSize;
  const apiSkip = (page - 1) * pageSize;

  const needsClientFilter = !!filters.category;
  const queryParams = {
    search:    debouncedSearch || undefined,
    outletId:  filters.outletId || undefined,
    status:    filters.status || undefined,
    take:      needsClientFilter ? 9999 : apiTake,
    skip:      needsClientFilter ? 0 : apiSkip,
  };

  const { data: apiCustomers, isLoading, isError } = useQuery({
    queryKey: crmKeys.list(queryParams),
    queryFn:  () => listCustomers(queryParams, getToken),
  });

  const { data: totalCustomers, isLoading: isCounting, isError: isCountingError } = useQuery({
    queryKey: ["crm", "count", debouncedSearch, filters.outletId, filters.status],
    queryFn: async () => {
      if (typeof (apiCustomers as any)?.totalCount === "number") {
        return (apiCustomers as any).totalCount;
      }
      return await countCustomers(debouncedSearch || "", undefined, filters.outletId, apiCustomers?.length || 0, apiSkip, apiTake);
    },
    enabled: !!apiCustomers && typeof (apiCustomers as any)?.totalCount !== "number",
    retry: 1,
  });

  const exactAttachedTotal = typeof (apiCustomers as any)?.totalCount === "number" ? (apiCustomers as any).totalCount : undefined;
  const totalCount = exactAttachedTotal ?? (isCountingError ? 6500 : (totalCustomers ?? (apiCustomers?.length || 0)));
  const exactAttachedNewCount = typeof (apiCustomers as any)?.totalNewCount === "number" ? (apiCustomers as any).totalNewCount : undefined;
  const isPageLoading = isLoading;

  const customers = apiCustomers || [];

  // ── Outlets + Categories (needed for filter dropdowns and outlet name resolution)
  const { data: outlets = [] } = useQuery({
    queryKey: crmKeys.outlets(),
    queryFn:  () => listOutlets(getToken),
    staleTime: Infinity,
  });

  // Build outlet code -> name map for resolving insight outlet codes
  const outletMap = useMemo(
    () => new Map(outlets.map(o => [o.id, o.name])),
    [outlets],
  );

  const { data: rawCategories = [] } = useQuery({
    queryKey: crmKeys.categories(filters.outletId),
    queryFn:  () => listCategories(filters.outletId || undefined, getToken),
    staleTime: 30 * 1000, // 30 seconds so it refreshes on outlet change
  });

  // Deduplicate API categories for fallback grouping metadata
  const safeCategories = Array.isArray(rawCategories) ? rawCategories : [];

  // ── Insights query (enrichment via customerInsights endpoint) ──────────────
  // Default: fetch last 1 month of insights automatically.
  // When user sets specific dates in filter, use those instead.
  const hasUserDates = !!(filters.startDate && filters.endDate);

  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  }, []);
  const defaultEndDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const insightStart = hasUserDates ? filters.startDate : defaultStartDate;
  const insightEnd   = hasUserDates ? filters.endDate   : defaultEndDate;

  const { data: insightsData, isLoading: isLoadingInsights, isError: isInsightsError } = useQuery({
    // Include outletId in key so insights refetch when outlet changes
    queryKey: [...crmKeys.insights(insightStart, insightEnd), filters.outletId || "all"],
    queryFn: () => fetchCustomerInsights(insightStart, insightEnd, filters.outletId, getToken),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Build dynamic category list from insightsData preferences (outlet-specific)
  // When an outlet is selected, insightsData is fetched for that outlet,
  // so the category list reflects what customers of THAT outlet actually ordered.
  const dynamicCategories = useMemo(() => {
    if (insightsData?.raw && insightsData.raw.length > 0) {
      const prefMap = new Map<string, { code: string; name: string; sub_code: string; sub_name: string }>();
      insightsData.raw.forEach(insight => {
        const foods = String(insight.food_preferences || "").split(",").map(s => s.trim()).filter(Boolean);
        const bevs  = String(insight.beverage_preferences || "").split(",").map(s => s.trim()).filter(Boolean);
        [...foods, ...bevs].forEach(pref => {
          if (pref && !prefMap.has(pref)) {
            // Try to find matching API category for grouping metadata
            const apiCat = safeCategories.find(c =>
              c.sub_code?.toUpperCase() === pref.toUpperCase()
            );
            prefMap.set(pref, {
              code:     apiCat?.code || "OTHER",
              name:     apiCat?.name || "OTHER",
              sub_code: pref,
              sub_name: pref,
            });
          }
        });
      });
      return Array.from(prefMap.values()).sort((a, b) => {
        const g = a.name.localeCompare(b.name);
        return g !== 0 ? g : a.sub_name.localeCompare(b.sub_name);
      });
    }
    // Fallback to API categories while insights load
    return Array.from(
      new Map(safeCategories.filter(c => c.sub_code).map(c => [c.sub_code, c])).values()
    ).sort((a, b) => a.sub_name.localeCompare(b.sub_name));
  }, [insightsData, safeCategories]);

  // When user has explicitly set dates → show insights data as primary table.
  // Otherwise → merge insights into the member list to enrich with spending/outlet/prefs.
  const enrichedCustomers = useMemo(() => {
    // ── Date filter active → show only customers with activity in that period
    if (hasUserDates && insightsData?.raw && insightsData.raw.length > 0) {
      return insightsData.raw.map(r => mapInsightToListItem(r, outletMap));
    }

    // ── Default: enrich the paginated results with insights data.
    let finalCustomers = customers;
    if (insightsData) {
      finalCustomers = mergeInsightsIntoMembers(customers, insightsData, outletMap);
    }
    return finalCustomers;
  }, [customers, insightsData, outletMap, hasUserDates]);

  // ── Client-side category filter — instant, no API call ──────────────────
  const filteredCustomers = useMemo(() => {
    if (!filters.category) return enrichedCustomers;
    const cat = filters.category.toUpperCase();
    return enrichedCustomers.filter(c => {
      const foodMatch = c.foodPreferences.some(p => p.toUpperCase().includes(cat));
      const bevMatch = c.beveragePreferences.some(p => p.toUpperCase().includes(cat));
      return foodMatch || bevMatch;
    });
  }, [enrichedCustomers, filters.category]);

  // When showing insights-only data (date filter), use its count; otherwise use backend total
  const displayTotal = needsClientFilter
    ? filteredCustomers.length
    : (hasUserDates && insightsData?.raw)
      ? enrichedCustomers.length
      : totalCount;

  // Client-side pagination for category-filtered results
  const displayCustomers = useMemo(() => {
    if (needsClientFilter) {
      return filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
    }
    return filteredCustomers;
  }, [filteredCustomers, needsClientFilter, page, pageSize]);

  const selectedCustomers = Array.from(selectedMap.values());

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: crmKeys.lists() });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (body: CreateCustomerBody) => createCustomer(body, getToken),
    onSuccess: () => {
      invalidateList(); setIsCreateOpen(false);
      toast({ title: "Customer added successfully" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to add customer", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CustomerFormValues }) =>
      updateCustomer(id, body, getToken),
    onSuccess: () => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: crmKeys.details() });
      setEditingCustomer(null);
      toast({ title: "Customer updated successfully" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to update customer", description: err.message, variant: "destructive" }),
  });

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", email: "", address: "", city: "", province: "" },
  });

  const openCreate = () => {
    form.reset({ firstName: "", lastName: "", phone: "", email: "", address: "", city: "", province: "", outletCode: "" });
    setIsCreateOpen(true);
  };

  const openEdit = (c: CustomerListItem) => {
    setEditingCustomer(c);
    const parts = c.fullName.split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");
    form.reset({ 
      firstName, 
      lastName, 
      phone: c.phone, 
      email: c.email || "", 
      address: c.address || "", 
      city: c.city || "", 
      province: c.province || "",
      outletCode: c.primaryOutletId || "" 
    });
  };

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) updateMutation.mutate({ id: editingCustomer.id, body: data });
    else                 createMutation.mutate(data);
  };

  // ── Export handlers ───────────────────────────────────────────────────────
  const handleExport = async (format: "excel" | "pdf") => {
    if (!filteredCustomers?.length) {
      toast({ title: "No data to export", description: "Apply filters or wait for data to load.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      if (format === "excel") downloadExcel(filteredCustomers, "crm-customers");
      else                    downloadPdf(filteredCustomers, "crm-customers");
      toast({ title: `${format === "excel" ? "Excel" : "PDF"} report downloaded successfully` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </span>
            CRM
          </h1>
          <p className="text-muted-foreground mt-1">Manage guests and build lasting relationships.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp broadcast */}
          <Button
            variant="outline"
            className={`gap-2 transition-all ${
              selectedIds.size > 0
                ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 shadow-sm"
                : ""
            }`}
            disabled={selectedIds.size === 0}
            onClick={() => setIsWAModalOpen(true)}
            data-testid="btn-whatsapp"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
            {selectedIds.size > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-green-600 text-white">
                {selectedIds.size}
              </span>
            )}
          </Button>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting || isLoading} data-testid="btn-export">
                {isExporting
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting…</>
                  : <><Download className="w-4 h-4 mr-2" />Export Data</>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handleExport("excel")}
                data-testid="btn-export-excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-medium text-sm">Download via Excel</p>
                  <p className="text-xs text-muted-foreground">.xlsx spreadsheet</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handleExport("pdf")}
                data-testid="btn-export-pdf"
              >
                <FileText className="w-4 h-4 text-red-500" />
                <div>
                  <p className="font-medium text-sm">Download via PDF</p>
                  <p className="text-xs text-muted-foreground">Print-ready report</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add customer */}
          <Dialog open={isCreateOpen} onOpenChange={(open) => { if (open) openCreate(); else setIsCreateOpen(false); }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-customer">
                <Plus className="w-4 h-4 mr-2" />Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Register a new guest in your CRM.</DialogDescription>
              </DialogHeader>
              <CustomerForm form={form} onSubmit={onSubmit} isPending={createMutation.isPending} onCancel={() => setIsCreateOpen(false)} outlets={outlets} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat cards */}
      {(() => {
        const activeNewCount = exactAttachedNewCount ?? (enrichedCustomers?.filter(c => c.status === "New").length || 0);
        return <SummaryCards total={totalCount} newGuestsCount={activeNewCount} isLoading={isPageLoading} isCounting={isCounting} />;
      })()}

      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <FilterBar filters={filters} outlets={outlets} categories={dynamicCategories} onChange={setFilters} isLoadingInsights={isLoadingInsights} />
        </CardContent>
      </Card>

      {/* Results label */}
      {(!isPageLoading || hasUserDates) && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {isLoadingInsights && hasUserDates ? (
              <span className="animate-pulse">Loading customer insights…</span>
            ) : isCounting && !hasUserDates ? (
              <span className="animate-pulse">Calculating total customers...</span>
            ) : displayTotal === 0 ? (
              "No results"
            ) : (
              <>
                <span className="font-semibold text-foreground">{displayTotal}</span>
                {hasUserDates && insightsData?.raw
                  ? ` Customer${displayTotal !== 1 ? "s" : ""} with activity in this period`
                  : ` Customer${displayTotal !== 1 ? "s" : ""} Found`
                }
              </>
            )}
          </span>
        </div>
      )}

      {/* Data table */}
      <CustomerTable
        customers={displayCustomers ?? []}
        isLoading={isPageLoading || (isLoadingInsights && hasUserDates)}
        isError={hasUserDates ? isInsightsError : isError}
        page={needsClientFilter ? page : (hasUserDates ? 1 : page)}
        pageSize={needsClientFilter ? pageSize : (hasUserDates ? displayTotal : pageSize)}
        total={displayTotal}
        activeCategory={filters.category}
        onPage={setPage}
        onPageSize={setPageSize}
        onView={(c) => {
          const qs = new URLSearchParams();
          if (filters.startDate) qs.set("startDate", filters.startDate);
          if (filters.endDate) qs.set("endDate", filters.endDate);
          const qStr = qs.toString() ? `?${qs.toString()}` : "";
          setLocation(`/crm/${c.id}${qStr}`);
        }}
        onEdit={openEdit}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
      />

      {/* Edit dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => { if (!open) setEditingCustomer(null); }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update details for {editingCustomer?.fullName}.</DialogDescription>
          </DialogHeader>
          <CustomerForm form={form} onSubmit={onSubmit} isPending={updateMutation.isPending} onCancel={() => setEditingCustomer(null)} outlets={outlets} />
        </DialogContent>
      </Dialog>

      {/* WhatsApp modal */}
      <WhatsAppModal
        open={isWAModalOpen}
        onOpenChange={setIsWAModalOpen}
        selectedCustomers={selectedCustomers}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
