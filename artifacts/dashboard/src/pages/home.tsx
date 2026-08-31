import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Store, Image as ImageIcon, UtensilsCrossed, Users, UserPlus, ArrowRight, TrendingUp, MoreHorizontal, Info, Images } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCustomers, fetchTopSpendersAnalytics, fetchRevenueAnalytics, fetchTopItemsAnalytics, fetchUpcomingBirthdays, crmKeys } from "@/lib/crm-api";
import { Medal, Gift } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";

export default function HomePage() {
  const { isKaraokeAdmin, getToken } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isKaraokeAdmin) {
      setLocation("/ladies");
    }
  }, [isKaraokeAdmin, setLocation]);

  const { data: summary, isLoading, isError } = useGetDashboardSummary();

  // Fetch CRM customer data for Total Customers & New Members
  const { data: crmCustomers, isLoading: isCrmLoading } = useQuery({
    queryKey: crmKeys.list({ take: 1, skip: 0 }),
    queryFn: () => listCustomers({ take: 1, skip: 0 }, getToken),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const totalCustomers = typeof (crmCustomers as any)?.totalCount === "number" ? (crmCustomers as any).totalCount : 0;
  const totalNewMembers = typeof (crmCustomers as any)?.totalNewCount === "number" ? (crmCustomers as any).totalNewCount : 0;

  // Revenue Analytics State
  const [revenueTimeframe, setRevenueTimeframe] = useState("6");
  const [revenueOutlet, setRevenueOutlet] = useState("all");

  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ["analytics-revenue", revenueTimeframe, revenueOutlet],
    queryFn: () => fetchRevenueAnalytics(Number(revenueTimeframe), revenueOutlet, getToken),
    staleTime: 5 * 60 * 1000,
  });

  // Top Spenders & Items State
  const [spendersOutlet, setSpendersOutlet] = useState("all");
  const [itemsOutlet, setItemsOutlet] = useState("all");
  const [itemsSort, setItemsSort] = useState("top");

  const prevMonthName = (() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1); 
    return start.toLocaleString('en-US', { month: 'long' });
  })();

  const { data: topSpendersData, isLoading: isInsightsLoading } = useQuery({
    queryKey: ["analytics-top-spenders", spendersOutlet],
    queryFn: () => fetchTopSpendersAnalytics(spendersOutlet, getToken),
    staleTime: 5 * 60 * 1000,
  });

  const { data: topItemsData, isLoading: isItemsLoading } = useQuery({
    queryKey: ["analytics-top-items", itemsOutlet, itemsSort],
    queryFn: () => fetchTopItemsAnalytics(itemsOutlet, getToken, itemsSort),
    staleTime: 5 * 60 * 1000,
  });

  const [birthdaysOutlet, setBirthdaysOutlet] = useState("BS");
  const { data: upcomingBirthdaysData, isLoading: isBirthdaysLoading } = useQuery({
    queryKey: crmKeys.upcomingBirthdays(birthdaysOutlet),
    queryFn: () => fetchUpcomingBirthdays(birthdaysOutlet, getToken),
    staleTime: 5 * 60 * 1000,
  });

  const topSpenders = topSpendersData || [];
  const topItems = topItemsData || [];
  const upcomingBirthdays = upcomingBirthdaysData || [];

  if (isKaraokeAdmin) {
    return null;
  }

  const outletOptions = [
    { value: "all", label: "All Outlets" },
    { value: "AZ", label: "AtoZ" },
    { value: "BS", label: "BOSA" },
    { value: "BD", label: "Bodega" },
    { value: "D5", label: "District 5" },
    { value: "LK", label: "Lakers" },
    { value: "OB", label: "Ombe" },
    { value: "RH", label: "Redhare" },
  ];

  return (
    <div className="home-dashboard animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Header */}
      <div className="home-header">
        <div className="home-header-left">
          <h1 className="home-title">Welcome back!</h1>
          <p className="home-subtitle">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        </div>
        <div className="home-header-actions">
          <Link href="/banners">
            <button className="home-btn-outline">
              <ImageIcon className="w-4 h-4" />
              Banners
            </button>
          </Link>
          <Link href="/outlets">
            <button className="home-btn-primary">
              <Store className="w-4 h-4" />
              Outlets
            </button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="home-stats-grid">
        {isLoading || isError || !summary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-stat-card">
              <div className="home-stat-card-header">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-[60px] mt-4" />
              <Skeleton className="h-3 w-[100px] mt-2" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Outlets"
              value={summary.outletCount}
              icon={<Store className="w-5 h-5" />}
              iconBg="home-icon-blue"
              change={summary.outletCount > 0 ? "+Active" : "0"}
              changeType="positive"
              subtitle="Registered outlets"
              href="/outlets"
            />
            <StatCard
              title="Menu Items"
              value={summary.menuItemCount}
              icon={<UtensilsCrossed className="w-5 h-5" />}
              iconBg="home-icon-green"
              change={summary.menuItemCount > 0 ? "+Active" : "0"}
              changeType="positive"
              subtitle="Across all outlets"
              href="/outlets"
            />
            <StatCard
              title="Total Customers"
              value={totalCustomers}
              icon={<Users className="w-5 h-5" />}
              iconBg="home-icon-amber"
              change={totalCustomers > 0 ? "+Active" : "0"}
              changeType="positive"
              subtitle="CRM members"
              href="/crm/customers"
              isLoading={isCrmLoading}
            />
            <StatCard
              title="New Members"
              value={totalNewMembers}
              icon={<UserPlus className="w-5 h-5" />}
              iconBg="home-icon-purple"
              change={totalNewMembers > 0 ? "+New" : "0"}
              changeType="positive"
              subtitle="Recently joined"
              href="/crm/customers"
              isLoading={isCrmLoading}
            />
          </>
        )}
      </div>

      {/* Middle Section: Revenue Overview + Quick Actions */}
      <div className="home-middle-grid">
        {/* Revenue Overview */}
        <div className="home-content-overview flex flex-col justify-between">
          <div className="home-content-overview-header mb-2">
            <div>
              <h2 className="home-section-title">Revenue Outlet</h2>
              <p className="text-sm text-muted-foreground mt-1">Monthly revenue performance</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={revenueOutlet} onValueChange={setRevenueOutlet}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
                  <SelectValue placeholder="Outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outletOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={revenueTimeframe} onValueChange={setRevenueTimeframe}>
                <SelectTrigger className="w-[120px] h-8 text-xs bg-white">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 Months</SelectItem>
                  <SelectItem value="6">Last 6 Months</SelectItem>
                  <SelectItem value="12">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recharts Visualization */}
          <div className="h-[280px] w-full pr-4 pb-2">
            {isRevenueLoading ? (
              <div className="h-full flex items-end gap-2 px-4 pb-6 pt-4">
                {Array.from({ length: Number(revenueTimeframe) }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${20 + Math.random() * 80}%` }} />
                ))}
              </div>
            ) : !revenueData || revenueData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
                <p>No revenue data found for selected filters.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 15, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Items Sales */}
        <div className="home-quick-overview">
          <div className="home-quick-overview-header mb-4">
            <div>
              <h2 className="home-section-title">Items Sales ({prevMonthName})</h2>
              <p className="text-sm text-muted-foreground mt-1">{itemsSort === "top" ? "Top" : "Bottom"} 5 {itemsSort === "top" ? "best" : "least"} selling items</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={itemsOutlet} onValueChange={setItemsOutlet}>
                <SelectTrigger className="w-[120px] h-8 text-xs bg-white">
                  <SelectValue placeholder="Outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outletOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={itemsSort} onValueChange={setItemsSort}>
                <SelectTrigger className="w-[110px] h-8 text-xs bg-white">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top 5</SelectItem>
                  <SelectItem value="bottom">Bottom 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="home-table-wrapper border rounded-md">
            {isItemsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : !topItems || topItems.length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center text-muted-foreground text-sm">
                <UtensilsCrossed className="w-8 h-8 mb-2 opacity-20" />
                <p>No item sales found.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium">Item Name</th>
                    <th className="px-4 py-2 font-medium text-right">Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topItems.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{item.nama_barang}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{item.total_sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Birthdays Section */}
      <div className="home-recent-section mt-6">
        <div className="home-recent-header flex items-center justify-between">
          <h2 className="home-section-title">Upcoming Birthdays</h2>
          
          <div className="flex items-center gap-3">
            <Select value={birthdaysOutlet} onValueChange={setBirthdaysOutlet}>
              <SelectTrigger className="w-[140px] h-9 text-sm bg-white">
                <SelectValue placeholder="Outlet Filter" />
              </SelectTrigger>
              <SelectContent>
                {outletOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link href="/crm/customers">
              <button className="home-filter-btn">
                View CRM
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        <div className="home-table-wrapper border rounded-md">
          {isBirthdaysLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-6 w-[20%]" />
                  <Skeleton className="h-6 w-[20%]" />
                  <Skeleton className="h-6 w-[20%]" />
                  <Skeleton className="h-6 w-[20%]" />
                </div>
              ))}
            </div>
          ) : !upcomingBirthdays.length ? (
            <div className="home-table-empty p-8 text-center">
              <Gift className="w-10 h-10 home-table-empty-icon text-pink-300 mx-auto mb-2" />
              <p className="home-table-empty-text text-muted-foreground">No upcoming birthdays found.</p>
            </div>
          ) : (
            <table className="home-table w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="home-th px-4 py-2 font-medium">Customer Name</th>
                  <th className="home-th px-4 py-2 font-medium">Phone</th>
                  <th className="home-th px-4 py-2 font-medium">Email</th>
                  <th className="home-th px-4 py-2 font-medium">Birthday</th>
                  <th className="home-th px-4 py-2 font-medium">Outlet</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {upcomingBirthdays.map((item: any, index: number) => {
                  const bd = new Date(item.birth_date);
                  const formattedBd = bd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                  return (
                  <tr key={item.code || index} className="home-tr hover:bg-muted/30">
                    <td className="home-td px-4 py-2.5 font-medium">
                      {item.name}
                    </td>
                    <td className="home-td px-4 py-2.5 text-muted-foreground">
                      {item.phone_number}
                    </td>
                    <td className="home-td px-4 py-2.5 text-muted-foreground">
                      {item.email || "—"}
                    </td>
                    <td className="home-td px-4 py-2.5 font-semibold text-pink-600">
                      <Gift className="w-4 h-4 inline mr-1.5 align-text-bottom" />
                      {formattedBd}
                    </td>
                    <td className="home-td px-4 py-2.5 text-muted-foreground">
                      {item.outlet || "—"}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top Spenders Recap Table */}
      <div className="home-recent-section mt-6">
        <div className="home-recent-header flex items-center justify-between">
          <h2 className="home-section-title">Top Spenders Recap ({prevMonthName})</h2>
          
          <div className="flex items-center gap-3">
            <Select value={spendersOutlet} onValueChange={setSpendersOutlet}>
              <SelectTrigger className="w-[140px] h-9 text-sm bg-white">
                <SelectValue placeholder="Outlet Filter" />
              </SelectTrigger>
              <SelectContent>
                {outletOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link href="/crm/customers">
              <button className="home-filter-btn">
                View CRM
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        <div className="home-table-wrapper">
          {isInsightsLoading ? (
            <div className="home-table-loading">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="home-table-loading-row">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          ) : !topSpenders.length ? (
            <div className="home-table-empty">
              <Medal className="w-10 h-10 home-table-empty-icon" />
              <p className="home-table-empty-text">No top spenders found.</p>
              <p className="home-table-empty-sub">There is no spending data for {prevMonthName}.</p>
            </div>
          ) : (
            <table className="home-table">
              <thead>
                <tr>
                  <th className="home-th w-16 text-center">Rank</th>
                  <th className="home-th text-left">Customer Name</th>
                  <th className="home-th text-left">Phone</th>
                  <th className="home-th text-left">Outlets</th>
                  <th className="home-th text-left">Total Spending</th>
                  <th className="home-th text-center">Visits</th>
                </tr>
              </thead>
              <tbody>
                {topSpenders.map((item: any, index: number) => (
                  <tr key={item.customer_code || index} className="home-tr">
                    <td className="home-td text-center font-bold text-muted-foreground">
                      #{item.rank}
                    </td>
                    <td className="home-td font-medium text-left">
                      {item.customer_name}
                    </td>
                    <td className="home-td text-muted-foreground text-left">
                      {item.phone}
                    </td>
                    <td className="home-td text-muted-foreground text-sm text-left">
                      {item.outlets || "—"}
                    </td>
                    <td className="home-td font-semibold text-emerald-600 text-left">
                      Rp {(Number(item.total_spending) || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="home-td text-center">
                      <span className="inline-flex items-center justify-center bg-muted/50 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {item.total_visit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, iconBg, change, changeType, subtitle, href, isLoading }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  change: string;
  changeType: "positive" | "negative";
  subtitle: string;
  href: string;
  isLoading?: boolean;
}) {
  return (
    <Link href={href}>
      <div className="home-stat-card" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="home-stat-card-header">
          <div className={`home-stat-icon ${iconBg}`}>
            {icon}
          </div>
          <button className="home-info-btn" title={title}>
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="home-stat-card-title">{title}</div>
        {isLoading ? (
          <Skeleton className="h-8 w-[80px] mt-1" />
        ) : (
          <div className="home-stat-card-value">{value.toLocaleString()}</div>
        )}
        <div className="home-stat-card-footer">
          <span className={`home-change-badge home-change-${changeType}`}>
            <TrendingUp className="w-3 h-3" />
            {change}
          </span>
          <span className="home-stat-card-subtitle">{subtitle}</span>
        </div>
      </div>
    </Link>
  );
}

function QuickActionCard({ href, icon, iconBg, label, description }: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <div className="home-quick-action-card" data-testid={`quicklink-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className={`home-quick-action-icon ${iconBg}`}>
          {icon}
        </div>
        <div className="home-quick-action-text">
          <span className="home-quick-action-label">{label}</span>
          <span className="home-quick-action-desc">{description}</span>
        </div>
        <ArrowRight className="w-4 h-4 home-quick-action-arrow" />
      </div>
    </Link>
  );
}
