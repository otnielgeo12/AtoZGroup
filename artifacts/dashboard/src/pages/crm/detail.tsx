import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  ArrowLeft, Users, Phone, Mail, Crown, UserCheck, UserPlus,
  Coins, MapPin, Pencil, Music,
  CheckCircle2, XCircle, AlertCircle, CalendarDays,
} from "lucide-react";

import {
  getCustomer, updateCustomer, crmKeys,
  type CustomerStatus, type CustomerDetail,
} from "@/lib/crm-api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CustomerStatus, { className: string; icon: React.ReactNode }> = {
  VIP:     { className: "bg-amber-100 text-amber-800 border-amber-200", icon: <Crown className="w-3 h-3 mr-1" /> },
  Regular: { className: "bg-blue-100 text-blue-800 border-blue-200",   icon: <UserCheck className="w-3 h-3 mr-1" /> },
  New:     { className: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <UserPlus className="w-3 h-3 mr-1" /> },
};

function StatusBadge({ status }: { status: CustomerStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Regular;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.icon}{status}
    </span>
  );
}

const RESERVATION_STATUS_ICON: Record<string, React.ReactNode> = {
  Completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  Cancelled: <XCircle className="w-4 h-4 text-destructive" />,
  "No-Show": <AlertCircle className="w-4 h-4 text-amber-500" />,
};

// ─── Edit form schema ──────────────────────────────────────────────────────────

const editSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName:  z.string().optional(),
  phone:     z.string().min(1, "Phone is required"),
  email:     z.string().email("Invalid email").or(z.literal("")).optional(),
  address:   z.string().optional(),
  city:      z.string().optional(),
  province:  z.string().optional(),
});
type EditFormValues = z.infer<typeof editSchema>;

// ─── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold mt-0.5 truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-lg" /><Skeleton className="h-8 w-56" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>
      <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CrmDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: crmKeys.detail(id),
    queryFn: () => getCustomer(id, getToken),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (body: EditFormValues) => updateCustomer(id, body, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: crmKeys.lists() });
      setEditOpen(false);
      toast({ title: "Customer updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update customer", description: err.message, variant: "destructive" });
    },
  });

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", email: "", address: "", city: "", province: "" },
  });

  const openEdit = (c: CustomerDetail) => {
    const parts = c.fullName.split(" ");
    form.reset({
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" "),
      phone: c.phone,
      email: c.email || "",
      address: c.address || "",
      city: c.city || "",
      province: c.province || "",
    });
    setEditOpen(true);
  };

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
        <h2 className="text-xl font-medium">Invalid customer ID</h2>
        <Button variant="link" onClick={() => setLocation("/crm")} className="mt-2">Back to CRM</Button>
      </div>
    );
  }

  if (isLoading) return <DetailSkeleton />;

  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
        <h2 className="text-xl font-medium">Customer not found</h2>
        <Button variant="link" onClick={() => setLocation("/crm")} className="mt-2">Back to CRM</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/crm")} className="-ml-2 shrink-0 mt-1">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0 border border-primary/20">
              {customer.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{customer.fullName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={customer.status} />
                <span className="text-xs font-mono text-muted-foreground">Code: {customer.id}</span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => openEdit(customer)} className="shrink-0">
          <Pencil className="w-4 h-4 mr-2" />Edit
        </Button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Coins className="w-5 h-5 text-emerald-600" />}
          label="Point Balance"
          value={customer.pointBalance.toLocaleString("id-ID")}
          sub="Loyalty points"
        />
        <MetricCard
          icon={<MapPin className="w-5 h-5 text-primary" />}
          label="Location"
          value={customer.city || "—"}
          sub={customer.province || "—"}
        />
        <MetricCard
          icon={<Phone className="w-5 h-5 text-primary" />}
          label="Contact"
          value={customer.phone}
          sub="Primary Phone"
        />
        <MetricCard
          icon={<Mail className="w-5 h-5 text-primary" />}
          label="Email"
          value={customer.email || "—"}
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 w-full sm:w-auto overflow-x-auto justify-start border border-border">
          <TabsTrigger value="profile"    className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm">Profile</TabsTrigger>
          <TabsTrigger value="events"     className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm">Event History</TabsTrigger>
          <TabsTrigger value="reservations" className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm">Reservations</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Information</CardTitle>
              <CardDescription>Customer profile information mapped from Vsoft API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Customer Code</p>
                  <p className="font-mono text-sm">{customer.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Full Name</p>
                  <p className="font-medium">{customer.fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Phone / WhatsApp</p>
                  <p className="flex items-center gap-2 font-medium"><Phone className="w-4 h-4 text-muted-foreground" />{customer.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</p>
                  <p className="flex items-center gap-2 font-medium"><Mail className="w-4 h-4 text-muted-foreground" />{customer.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Gender</p>
                  <p className="font-medium">{customer.gender || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Date of Birth</p>
                  <p className="font-medium">{customer.birthDate || "—"}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Address</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1 sm:col-span-3">
                    <p className="text-xs text-muted-foreground">Street</p>
                    <p className="font-medium">{customer.address || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">City</p>
                    <p className="font-medium">{customer.city || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Province</p>
                    <p className="font-medium">{customer.province || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Nationality</p>
                    <p className="font-medium">{customer.nationality || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event History Tab */}
        <TabsContent value="events" className="outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Event History</CardTitle>
              <CardDescription>Special events and private bookings this guest has attended.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Music className="w-10 h-10 opacity-20 mb-3" />
                <p className="font-medium">Not supported in Vsoft API.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Reservation History</CardTitle>
              <CardDescription>All past table reservation records for this guest.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CalendarDays className="w-10 h-10 opacity-20 mb-3" />
                <p className="font-medium">Not supported in Vsoft API.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false); }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update profile details for {customer.fullName}.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4 mt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone / WhatsApp</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="province" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
