import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  ArrowLeft, Users, Phone, Mail, Crown, UserCheck, UserPlus,
  Wallet, UtensilsCrossed, Sofa, CalendarDays, Pencil, Music,
  CheckCircle2, XCircle, AlertCircle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  const cfg = STATUS_CONFIG[status];
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
  fullName: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  status: z.enum(["VIP", "Regular", "New"]),
  seatingPreference: z.enum(["Regular", "Bar", "Smoking Area", "VIP Room"]),
  notes: z.string().optional(),
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
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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
  const { id: rawId } = useParams<{ id: string }>();
  const id = parseInt(rawId || "0", 10);
  const [, setLocation] = useLocation();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: crmKeys.detail(id),
    queryFn: () => getCustomer(id, getToken),
    enabled: !!id && !isNaN(id),
  });

  const updateMutation = useMutation({
    mutationFn: (body: EditFormValues) => updateCustomer(id, body, getToken),
    onSuccess: (updated) => {
      queryClient.setQueryData(crmKeys.detail(id), updated);
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
    defaultValues: { fullName: "", phone: "", email: "", status: "New", seatingPreference: "Regular", notes: "" },
  });

  const openEdit = (c: CustomerDetail) => {
    form.reset({
      fullName: c.fullName, phone: c.phone, email: c.email || "",
      status: c.status, seatingPreference: c.seatingPreference, notes: c.notes || "",
    });
    setEditOpen(true);
  };

  if (isNaN(id)) {
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

  const totalSpendingFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(customer.totalSpending);

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
                <span className="text-xs text-muted-foreground">Member since {format(new Date(customer.memberSince), "MMMM yyyy")}</span>
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
          icon={<Wallet className="w-5 h-5 text-primary" />}
          label="Total Spending"
          value={totalSpendingFormatted}
          sub={`across ${customer.totalVisits} visits`}
        />
        <MetricCard
          icon={<CalendarDays className="w-5 h-5 text-primary" />}
          label="Total Visits"
          value={String(customer.totalVisits)}
          sub={`Last: ${format(new Date(customer.lastVisitDate), "dd MMM yyyy")}`}
        />
        <MetricCard
          icon={<UtensilsCrossed className="w-5 h-5 text-primary" />}
          label="Favourite Menu"
          value={customer.favoriteMenuCategory}
        />
        <MetricCard
          icon={<Sofa className="w-5 h-5 text-primary" />}
          label="Seating Preference"
          value={customer.seatingPreference}
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
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Personal details and staff notes for this guest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Phone / WhatsApp</p>
                  <p className="flex items-center gap-2 font-medium"><Phone className="w-4 h-4 text-muted-foreground" />{customer.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</p>
                  <p className="flex items-center gap-2 font-medium"><Mail className="w-4 h-4 text-muted-foreground" />{customer.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Membership Status</p>
                  <StatusBadge status={customer.status} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Member Since</p>
                  <p className="font-medium">{format(new Date(customer.memberSince), "dd MMMM yyyy")}</p>
                </div>
              </div>

              {customer.notes && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Staff Notes</p>
                  <div className="p-3 bg-muted/40 rounded-md text-sm leading-relaxed border border-border/60">
                    {customer.notes}
                  </div>
                </div>
              )}
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
              {customer.events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Music className="w-10 h-10 opacity-20 mb-3" />
                  <p className="font-medium">No events recorded yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="pr-4">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.events.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="pl-4 font-medium">{ev.eventName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{ev.eventType}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ev.outlet}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ev.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="pr-4 text-sm text-muted-foreground">{ev.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
              {customer.reservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <CalendarDays className="w-10 h-10 opacity-20 mb-3" />
                  <p className="font-medium">No reservations recorded yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Date & Time</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead className="text-right">Pax</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.reservations.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium text-sm">{format(new Date(res.date), "dd MMM yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{res.time}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{res.outlet}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">{res.tableLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">{res.pax}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm">
                            {RESERVATION_STATUS_ICON[res.status]}
                            {res.status}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-sm text-muted-foreground">{res.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Staff Notes</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} value={field.value ?? ""} />
                    </FormControl>
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
