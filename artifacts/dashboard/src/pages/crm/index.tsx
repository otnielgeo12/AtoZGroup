import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Plus, Download, FileSpreadsheet, FileText,
  Crown, UserCheck, UserPlus, Loader2,
} from "lucide-react";

import {
  listCustomers, listOutlets, createCustomer, updateCustomer, deleteCustomer,
  crmKeys,
  type CustomerListItem, type CustomerStatus, type CreateCustomerBody,
} from "@/lib/crm-api";
import { downloadExcel, downloadPdf } from "@/lib/crm-export";
import { FilterBar, EMPTY_FILTERS, type FilterState } from "./components/FilterBar";
import { CustomerTable } from "./components/CustomerTable";

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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// ─── Form schema ──────────────────────────────────────────────────────────────

const customerSchema = z.object({
  fullName:         z.string().min(1, "Full name is required"),
  phone:            z.string().min(1, "Phone number is required"),
  email:            z.string().email("Invalid email").or(z.literal("")).optional(),
  status:           z.enum(["VIP", "Regular", "New"]).default("New"),
  seatingPreference: z.enum(["Regular", "Bar", "Smoking Area", "VIP Room"]).default("Regular"),
  primaryOutletId:  z.string().optional(),
  notes:            z.string().optional(),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

// ─── Stat cards ───────────────────────────────────────────────────────────────

const STAT_CONFIG: Record<CustomerStatus, { label: string; icon: React.ReactNode; color: string }> = {
  VIP:     { label: "VIP Members",   icon: <Crown     className="w-4 h-4" />, color: "text-amber-600" },
  Regular: { label: "Regular",       icon: <UserCheck className="w-4 h-4" />, color: "text-blue-600" },
  New:     { label: "New Guests",    icon: <UserPlus  className="w-4 h-4" />, color: "text-emerald-600" },
};

function SummaryCards({ customers, isLoading }: { customers?: CustomerListItem[]; isLoading: boolean }) {
  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
      ))}
    </div>
  );
  if (!customers) return null;

  const counts = { VIP: 0, Regular: 0, New: 0 };
  customers.forEach((c) => counts[c.status]++);

  const cards = [
    { label: "Total",      value: customers.length, icon: <Users className="w-4 h-4" />, color: "text-foreground" },
    ...Object.entries(STAT_CONFIG).map(([status, cfg]) => ({
      label: cfg.label, value: counts[status as CustomerStatus], icon: cfg.icon, color: cfg.color,
    })),
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted/60 ${c.color} shrink-0`}>{c.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
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
  outlets: { id: string; name: string }[];
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="e.g. Anastasia Wijaya" {...field} /></FormControl>
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
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="seatingPreference" render={({ field }) => (
            <FormItem>
              <FormLabel>Seating Preference</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Smoking Area">Smoking Area</SelectItem>
                  <SelectItem value="VIP Room">VIP Room</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="primaryOutletId" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Primary Outlet</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select outlet" /></SelectTrigger></FormControl>
                <SelectContent>
                  {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Allergies, preferences, special requirements…" className="min-h-[72px]" {...field} value={field.value ?? ""} />
              </FormControl>
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
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerListItem | null>(null);

  // ── Export state ──────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const queryParams = {
    search:    filters.search || undefined,
    status:    undefined as any,
    outlet_id: filters.outletId || undefined,
    food_pref: filters.foodPrefs.length ? filters.foodPrefs : undefined,
    bev_pref:  filters.bevPrefs.length  ? filters.bevPrefs  : undefined,
  };

  const { data: customers, isLoading, isError } = useQuery({
    queryKey: crmKeys.list(queryParams),
    queryFn:  () => listCustomers(queryParams, getToken),
  });

  const { data: outlets = [] } = useQuery({
    queryKey: crmKeys.outlets(),
    queryFn:  () => listOutlets(getToken),
    staleTime: Infinity,
  });

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
    mutationFn: ({ id, body }: { id: number; body: CustomerFormValues }) =>
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCustomer(id, getToken),
    onSuccess: () => {
      invalidateList(); setDeletingCustomer(null);
      toast({ title: "Customer deleted" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to delete customer", description: err.message, variant: "destructive" }),
  });

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { fullName: "", phone: "", email: "", status: "New", seatingPreference: "Regular", primaryOutletId: "", notes: "" },
  });

  const openCreate = () => {
    form.reset({ fullName: "", phone: "", email: "", status: "New", seatingPreference: "Regular", primaryOutletId: outlets[0]?.id ?? "", notes: "" });
    setIsCreateOpen(true);
  };

  const openEdit = (c: CustomerListItem) => {
    setEditingCustomer(c);
    form.reset({ fullName: c.fullName, phone: c.phone, email: c.email || "", status: c.status, seatingPreference: "Regular", primaryOutletId: c.primaryOutletId, notes: "" });
  };

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) updateMutation.mutate({ id: editingCustomer.id, body: data });
    else                 createMutation.mutate(data);
  };

  // ── Export handlers ───────────────────────────────────────────────────────
  const handleExport = async (format: "excel" | "pdf") => {
    if (!customers?.length) {
      toast({ title: "No data to export", description: "Apply filters or wait for data to load.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      if (format === "excel") downloadExcel(customers, "crm-customers");
      else                    downloadPdf(customers, "crm-customers");
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
      <SummaryCards customers={customers} isLoading={isLoading} />

      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <FilterBar filters={filters} outlets={outlets} onChange={setFilters} />
        </CardContent>
      </Card>

      {/* Results label */}
      {!isLoading && customers && (
        <p className="text-sm text-muted-foreground -mb-3">
          {customers.length === 0
            ? "No results"
            : `${customers.length} customer${customers.length !== 1 ? "s" : ""} found`}
        </p>
      )}

      {/* Data table */}
      <CustomerTable
        customers={customers ?? []}
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={setPageSize}
        onView={(c) => setLocation(`/crm/${c.id}`)}
        onEdit={openEdit}
        onDelete={setDeletingCustomer}
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

      {/* Delete confirm */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => { if (!open) setDeletingCustomer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deletingCustomer?.fullName}</strong> and all their history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteMutation.isPending}
              onClick={() => deletingCustomer && deleteMutation.mutate(deletingCustomer.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
