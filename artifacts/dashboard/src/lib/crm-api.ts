const BASE = `${(import.meta as any).env?.VITE_API_URL ?? ""}/api/v1/crm`;

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CustomerStatus = "VIP" | "Regular" | "New";
export type SeatingPreference = "Regular" | "Bar" | "Smoking Area" | "VIP Room";
export type FoodPreference   = "Steak" | "Ala Carte";
export type BevPreference    = "Cocktail" | "Whisky" | "Wine";

export interface Outlet { id: string; name: string; }

export interface CustomerListItem {
  id: number; fullName: string; phone: string; email: string;
  status: CustomerStatus; totalVisits: number; lastVisitDate: string;
  totalSpending: number;
  foodPreferences: string[]; beveragePreferences: string[];
  primaryOutletId: string; primaryOutletName: string;
}

export interface CustomerEvent {
  id: number; eventName: string;
  eventType: "Live Music" | "Private Buffet" | "Special Dinner" | "Wine Tasting" | "Birthday Package";
  date: string; outlet: string; notes?: string;
}

export interface CustomerReservation {
  id: number; date: string; time: string; pax: number;
  tableLabel: string; outlet: string;
  status: "Completed" | "Cancelled" | "No-Show"; notes?: string;
}

export interface CustomerDetail extends CustomerListItem {
  favoriteMenuCategory: string; seatingPreference: SeatingPreference;
  notes: string; memberSince: string;
  events: CustomerEvent[]; reservations: CustomerReservation[];
}

export interface CreateCustomerBody {
  fullName: string; phone: string; email?: string;
  status?: CustomerStatus; seatingPreference?: SeatingPreference;
  primaryOutletId?: string; notes?: string;
}

export interface ListCustomersParams {
  search?: string;
  status?: CustomerStatus | "All";
  minVisits?: number;
  outlet_id?: string;
  food_pref?: FoodPreference[];   // ["Steak","Ala Carte"]
  bev_pref?: BevPreference[];     // ["Cocktail","Whisky","Wine"]
}

// ─── Request helper ───────────────────────────────────────────────────────────

async function request<T>(
  url: string, options: RequestInit,
  getToken: () => Promise<string | null>
): Promise<T> {
  const token = await getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function listOutlets(
  getToken: () => Promise<string | null>
): Promise<Outlet[]> {
  return request<Outlet[]>(`${BASE}/outlets`, { method: "GET" }, getToken);
}

export async function listCustomers(
  params: ListCustomersParams,
  getToken: () => Promise<string | null>
): Promise<CustomerListItem[]> {
  const qs = new URLSearchParams();
  if (params.search)                              qs.set("search",    params.search);
  if (params.status && params.status !== "All")   qs.set("status",    params.status);
  if (params.minVisits)                           qs.set("minVisits", String(params.minVisits));
  if (params.outlet_id)                           qs.set("outlet_id", params.outlet_id);
  if (params.food_pref?.length)                   qs.set("food_pref", params.food_pref.join(","));
  if (params.bev_pref?.length)                    qs.set("bev_pref",  params.bev_pref.join(","));
  const url = qs.toString() ? `${BASE}/customers?${qs}` : `${BASE}/customers`;
  return request<CustomerListItem[]>(url, { method: "GET" }, getToken);
}

export async function getCustomer(
  id: number, getToken: () => Promise<string | null>
): Promise<CustomerDetail> {
  return request<CustomerDetail>(`${BASE}/customers/${id}`, { method: "GET" }, getToken);
}

export async function createCustomer(
  body: CreateCustomerBody, getToken: () => Promise<string | null>
): Promise<CustomerDetail> {
  return request<CustomerDetail>(`${BASE}/customers`, { method: "POST", body: JSON.stringify(body) }, getToken);
}

export async function updateCustomer(
  id: number, body: Partial<CreateCustomerBody>, getToken: () => Promise<string | null>
): Promise<CustomerDetail> {
  return request<CustomerDetail>(`${BASE}/customers/${id}`, { method: "PATCH", body: JSON.stringify(body) }, getToken);
}

export async function deleteCustomer(
  id: number, getToken: () => Promise<string | null>
): Promise<void> {
  return request<void>(`${BASE}/customers/${id}`, { method: "DELETE" }, getToken);
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const crmKeys = {
  all:     ["crm"] as const,
  outlets: () => [...crmKeys.all, "outlets"] as const,
  lists:   () => [...crmKeys.all, "list"] as const,
  list:    (params: ListCustomersParams) => [...crmKeys.lists(), params] as const,
  details: () => [...crmKeys.all, "detail"] as const,
  detail:  (id: number) => [...crmKeys.details(), id] as const,
};
