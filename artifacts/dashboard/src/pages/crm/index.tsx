import { useState, useCallback, useEffect, useMemo } from "react";
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
  type CustomerListItem, type CustomerStatus, type CreateCustomerBody,
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
  form, onSubmit, isPending, onCancel,
}: {
  form: ReturnType<typeof useForm<CustomerFormValues>>;
  onSubmit: (d: CustomerFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
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
              <FormLabel>Phone / WhatsApp</FormLabel>
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

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filters]);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen]       = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);

  // ── Export state ──────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  // ── WhatsApp selection state ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((ids: string[], checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) ids.forEach(id => next.add(id));
      else ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Queries ───────────────────────────────────────────────────────────────
  const apiTake = pageSize;
  const apiSkip = (page - 1) * pageSize;

  const queryParams = {
    search:    filters.search || undefined,
    category:  filters.foodCategory || filters.beverageCategory || undefined, // Fallback to either
    outletId:  filters.outletId || undefined,
    status:    filters.status || undefined,
    take:      apiTake,
    skip:      apiSkip,
  };

  const { data: apiCustomers, isLoading, isError } = useQuery({
    queryKey: crmKeys.list(queryParams),
    queryFn:  () => listCustomers(queryParams, getToken),
  });

  const { data: totalCustomers, isLoading: isCounting, isError: isCountingError } = useQuery({
    queryKey: ["crm", "count", filters.search, filters.foodCategory, filters.beverageCategory, filters.outletId, filters.status],
    queryFn: async () => {
      if (typeof (apiCustomers as any)?.totalCount === "number") {
        return (apiCustomers as any).totalCount;
      }
      return await countCustomers(filters.search || "", filters.foodCategory || filters.beverageCategory, filters.outletId, apiCustomers?.length || 0, apiSkip, apiTake);
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
    queryKey: crmKeys.categories(),
    queryFn:  () => listCategories(getToken),
    staleTime: Infinity,
  });

  // Deduplicate categories by sub_code so we can filter by specific preferences like APPETIZERS or TEA
  const safeCategories = Array.isArray(rawCategories) ? rawCategories : [];
  const categories = Array.from(
    new Map(
      safeCategories
        .filter(c => c.sub_code) // ensure sub_code exists
        .map(c => [c.sub_code, c])
    ).values()
  ).sort((a, b) => a.sub_name.localeCompare(b.sub_name)); // sort alphabetically

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
    queryKey: crmKeys.insights(insightStart, insightEnd),
    queryFn: () => fetchCustomerInsights(insightStart, insightEnd, getToken),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // When user has explicitly set dates → show insights data as primary table.
  // Otherwise → merge insights into the member list to enrich with spending/outlet/prefs.
  const enrichedCustomers = useMemo(() => {
    if (hasUserDates && insightsData?.raw && insightsData.raw.length > 0) {
      // User filtered by date → show only customers with activity in that period
      let filteredInsights = insightsData.raw;
      
      // If category filter is active, apply it locally to the insights list
      // by checking food_preferences and beverage_preferences (which contain the sub_codes)
      if (filters.foodCategory || filters.beverageCategory) {
        filteredInsights = filteredInsights.filter(insight => {
          const foodPrefs = String(insight.food_preferences || "").toUpperCase();
          const bevPrefs = String(insight.beverage_preferences || "").toUpperCase();
          
          let matches = true;
          if (filters.foodCategory) {
            matches = matches && foodPrefs.includes(filters.foodCategory.toUpperCase());
          }
          if (filters.beverageCategory) {
            matches = matches && bevPrefs.includes(filters.beverageCategory.toUpperCase());
          }
          return matches;
        });
      }

      return filteredInsights.map(r => mapInsightToListItem(r, outletMap));
    }
    // Default: merge insights into member list to enrich existing rows
    // Note: customers from listCustomers (/api/v1/members) are ALREADY filtered and paginated precisely by SQL on the backend.
    let finalCustomers = customers;
    if (insightsData) {
      finalCustomers = mergeInsightsIntoMembers(customers, insightsData, outletMap);
    }
    
    return finalCustomers;
  }, [customers, insightsData, outletMap, hasUserDates, filters.foodCategory, filters.beverageCategory]);

  // When showing insights-only data, use its count; otherwise use the member list count
  const displayTotal = hasUserDates && insightsData?.raw
    ? enrichedCustomers.length // Use enrichedCustomers.length which reflects the local category filter
    : totalCount;

  const selectedCustomers = enrichedCustomers.filter(c => selectedIds.has(c.id));

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
    form.reset({ firstName: "", lastName: "", phone: "", email: "", address: "", city: "", province: "" });
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
      province: c.province || "" 
    });
  };

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) updateMutation.mutate({ id: editingCustomer.id, body: data });
    else                 createMutation.mutate(data);
  };

  // ── Export handlers ───────────────────────────────────────────────────────
  const handleExport = async (format: "excel" | "pdf") => {
    if (!enrichedCustomers?.length) {
      toast({ title: "No data to export", description: "Apply filters or wait for data to load.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      if (format === "excel") downloadExcel(enrichedCustomers, "crm-customers");
      else                    downloadPdf(enrichedCustomers, "crm-customers");
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
              <CustomerForm form={form} onSubmit={onSubmit} isPending={createMutation.isPending} onCancel={() => setIsCreateOpen(false)} />
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
          <FilterBar filters={filters} outlets={outlets} categories={categories} onChange={setFilters} isLoadingInsights={isLoadingInsights} />
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
        customers={enrichedCustomers ?? []}
        isLoading={isPageLoading || (isLoadingInsights && hasUserDates)}
        isError={hasUserDates ? isInsightsError : isError}
        page={hasUserDates ? 1 : page}
        pageSize={hasUserDates ? displayTotal : pageSize}
        total={displayTotal}
        onPage={setPage}
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
          <CustomerForm form={form} onSubmit={onSubmit} isPending={updateMutation.isPending} onCancel={() => setEditingCustomer(null)} />
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
