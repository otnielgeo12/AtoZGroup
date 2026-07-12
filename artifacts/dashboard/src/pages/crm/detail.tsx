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
  Coins, MapPin, Pencil, Music, Utensils,
  CheckCircle2, XCircle, AlertCircle, CalendarDays, ShoppingBag, Receipt,
} from "lucide-react";

import {
  getCustomer, getCustomerHistory, updateCustomer, crmKeys,
  type CustomerStatus, type CustomerDetail, type CustomerPurchaseItem,
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

  const { data: historyItems = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: crmKeys.detailHistory(id, customer?.fullName, customer?.phone),
    queryFn: () => getCustomerHistory(id, customer?.fullName, customer?.phone, getToken),
    enabled: !!id && !!customer,
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
          <TabsTrigger value="profile" className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="history" className="px-5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
            <Receipt className="w-4 h-4" /> History
          </TabsTrigger>
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

          {/* Top 3 Favorite Items & Events Attended */}
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <Utensils className="w-4 h-4 text-primary" /> Top 3 Favorite Items
                </CardTitle>
                <CardDescription className="text-xs">
                  Rekomendasi favorit untuk mempermudah staf saat pelanggan datang kembali.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer.favoriteItems && customer.favoriteItems.length > 0 ? (
                  <div className="space-y-3">
                    {customer.favoriteItems.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 border border-border/60 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                            #{i + 1}
                          </span>
                          <span className="font-medium text-sm text-foreground">{item.name}</span>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {item.count}x dipesan
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/60">
                    <p className="text-xs font-medium">Belum ada item favorit tercatat</p>
                    <p className="text-[11px] opacity-70 mt-0.5">Akan otomatis terhitung dari riwayat pesanan.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 shadow-sm bg-gradient-to-br from-background to-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Crown className="w-4 h-4 text-amber-500" /> Event Attendance History
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar event atau festival spesial AtoZ yang pernah diikuti.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer.lastEvent && customer.lastEvent !== "-" ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {customer.lastEvent.split(",").map((ev, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {ev.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/60">
                    <p className="text-xs font-medium">Belum pernah mengikuti event (-)</p>
                    <p className="text-[11px] opacity-70 mt-0.5">Seperti Whisky Carnival, Wine Carnival, Cocktails Week, dll.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="outline-none">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" /> Purchase History
                </CardTitle>
                <CardDescription>
                  Table pembelian per customer berdasarkan nama ({customer.fullName}) dan nomor HP ({customer.phone}).
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono py-1 px-3">
                {historyItems.length} Transactions
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {isHistoryLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Receipt className="w-10 h-10 opacity-20 mb-3" />
                  <p className="font-medium text-sm">Tidak ada riwayat pembelian ditemukan untuk customer ini.</p>
                  <p className="text-xs mt-1 opacity-70">Data pembelian dicocokkan otomatis melalui nama dan nomor WhatsApp/HP.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-border">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">No Bill</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Nama</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Tanggal</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Items</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground text-right">Qty</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground text-right">Harga</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground text-right">Disc%</TableHead>
                        <TableHead className="font-semibold text-xs uppercase text-muted-foreground text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyItems.map((item, idx) => {
                        const totalRp = Number(item.total) || (Number(item.qty || 1) * Number(item.harga || 0));
                        return (
                          <TableRow key={`${item.no_bill}-${idx}`} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-mono text-xs font-medium text-primary">{item.no_bill || "—"}</TableCell>
                            <TableCell className="text-sm font-medium">{item.nama || customer.fullName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {item.tanggal ? format(new Date(item.tanggal), "dd MMM yyyy, HH:mm") : "—"}
                            </TableCell>
                            <TableCell className="text-sm max-w-[240px] truncate" title={item.items}>{item.items || "—"}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{Number(item.qty || 0).toLocaleString("id-ID")}</TableCell>
                            <TableCell className="text-sm text-right font-mono">
                              Rp {Number(item.harga || 0).toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono text-amber-600 font-semibold">
                              {Number(item.disc || 0)}%
                            </TableCell>
                            <TableCell className="text-sm text-right font-mono font-bold text-emerald-600">
                              Rp {totalRp.toLocaleString("id-ID")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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
