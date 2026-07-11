/**
 * CRM API client — Vsoft POS adapter
 *
 * Translates between the Dashboard's internal CRM types and the real
 * Vsoft POS API at api.apicrmatoz.online.
 *
 * Auth: Basic Auth (username + password from env vars).
 * All responses are wrapped: { message, errors, data }.
 */

// ─── Config ─────────────────────────────────────────────────────────────────────

function getCrmBaseUrl(): string {
  if (import.meta.env.DEV) {
    return "/vsoft-api";
  }
  const url = (import.meta as any).env?.VITE_CRM_API_URL ?? "";
  return url.replace(/\/$/, "");
}

function getBasicAuthHeader(): string {
  const username = (import.meta as any).env?.VITE_VSOFT_USERNAME ?? "";
  const password = (import.meta as any).env?.VITE_VSOFT_PASSWORD ?? "";
  if (!username) return "";
  return `Basic ${btoa(`${username}:${password}`)}`;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CustomerStatus = "VIP" | "Regular" | "New";

export interface Outlet {
  id: string;
  name: string;
}

export interface CustomerListItem {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  status: CustomerStatus;
  totalVisits: number;
  lastVisitDate: string;
  totalSpending: number;
  foodPreferences: string[];
  beveragePreferences: string[];
  primaryOutletId: string;
  primaryOutletName: string;
  categoryName?: string;
  categoryCode?: string;
  // Vsoft-specific fields
  address: string | null;
  city: string | null;
  province: string | null;
  pointBalance: number;
}

export interface CustomerDetail extends CustomerListItem {
  favoriteMenuCategory: string;
  seatingPreference: string;
  notes: string;
  memberSince: string;
  events: CustomerEvent[];
  reservations: CustomerReservation[];
  // Vsoft-specific
  gender: string | null;
  birthDate: string | null;
  nationality: string | null;
}

export interface CustomerEvent {
  id: number;
  eventName: string;
  eventType: string;
  date: string;
  outlet: string;
  notes?: string;
}

export interface CustomerReservation {
  id: number;
  date: string;
  time: string;
  pax: number;
  tableLabel: string;
  outlet: string;
  status: "Completed" | "Cancelled" | "No-Show";
  notes?: string;
}

export interface CreateCustomerBody {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  gender?: string;
  birthDate?: string;
  nationality?: string;
  memberCode?: string;
}

export interface ListCustomersParams {
  search?: string;
  category?: string;
  outletId?: string;
  take?: number;
  skip?: number;
}

// ─── Vsoft raw types ──────────────────────────────────────────────────────────

interface VsoftResponse<T> {
  message: string;
  errors: unknown;
  data: T;
  total?: number;
  count?: number;
}

interface VsoftMember {
  code: string;
  name?: string;
  customer_name?: string;
  phone_number?: string;
  phone?: string;
  email?: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  point_balance?: string | number;
  points?: string | number;
  gender?: string | null;
  birth_date?: string | null;
  nationality?: string | null;
  outlet?: string;
  total_visit?: number;
  sub_total?: number;
  discount?: number;
  total_spending?: string | number;
  last_visit?: string;
  food_preferences?: string;
  beverage_preferences?: string;
}

export interface VsoftInsight {
  code?: string;
  customer_code?: string;
  customer_name?: string;
  phone?: string;
  phone_number?: string;
  email?: string | null;
  status?: string | null;
  outlet?: string;
  total_visit?: number;
  sub_total?: number;
  discount?: number;
  total_spending?: string | number;
  last_visit?: string;
  food_preferences?: string | null;
  beverage_preferences?: string | null;
}

interface VsoftOutlet {
  code: string;
  name: string;
}

export interface Category {
  code: string;
  name: string;
  sub_code: string;
  sub_name: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapVsoftMember(m: VsoftMember): CustomerListItem {
  const nameVal = m.customer_name || m.name || "";
  const fullName = nameVal.trim() || "(No Name)";
  const phone = m.phone || m.phone_number || "";

  const totalSpending = Number(m.total_spending) || 0;
  const totalVisits = Number(m.total_visit) || Number((m as any).total_visits) || 0;
  const lastVisitDate = m.last_visit || (m as any).last_visit_date || "";
  const primaryOutletName = m.outlet || (m as any).outlet_name || (m as any).primary_outlet_name || (m as any).outlet_code || "—";

  const foodPrefs = m.food_preferences
    ? m.food_preferences.split(",").map(x => x.trim()).filter(Boolean)
    : [];
  const bevPrefs = m.beverage_preferences
    ? m.beverage_preferences.split(",").map(x => x.trim()).filter(Boolean)
    : [];

  const getMostFrequent = (items: string[]) => {
    if (items.length === 0) return "";
    const counts: Record<string, number> = {};
    let maxItem = "";
    let maxCount = 0;
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
      if (counts[item] > maxCount) {
        maxCount = counts[item];
        maxItem = item;
      }
    }
    return maxItem;
  };

  const topFood = getMostFrequent(foodPrefs);
  const topBev = getMostFrequent(bevPrefs);

  let derivedCategory = "Unknown";
  if (topFood && topBev) {
    derivedCategory = `${topFood} / ${topBev}`;
  } else if (topFood) {
    derivedCategory = topFood;
  } else if (topBev) {
    derivedCategory = topBev;
  }

  const categoryName = derivedCategory !== "Unknown"
    ? derivedCategory
    : ((m as any).category_name || (m as any).category || "—");

  return {
    id: m.code,
    fullName,
    phone,
    email: m.email || "",
    status: "Regular", // Vsoft doesn't have status categories
    totalVisits,
    lastVisitDate,
    totalSpending,
    foodPreferences: foodPrefs,
    beveragePreferences: bevPrefs,
    primaryOutletId: (m as any).outlet_code || (m as any).primary_outlet_code || "",
    primaryOutletName,
    categoryName,
    categoryCode: (m as any).category_code || "",
    address: m.address || null,
    city: m.city || null,
    province: m.province || null,
    pointBalance: Number(m.point_balance) || Number((m as any).points) || 0,
  };
}

function mapVsoftMemberDetail(m: VsoftMember): CustomerDetail {
  return {
    ...mapVsoftMember(m),
    favoriteMenuCategory: "—",
    seatingPreference: "—",
    notes: "",
    memberSince: "",
    events: [],
    reservations: [],
    gender: m.gender ?? (m as any).gender ?? null,
    birthDate: m.birth_date ?? (m as any).birth_date ?? (m as any).birthDate ?? null,
    nationality: m.nationality ?? (m as any).nationality ?? null,
  };
}

function mapVsoftOutlet(o: VsoftOutlet): Outlet {
  return { id: o.code, name: o.name };
}

// ─── Request helper ───────────────────────────────────────────────────────────

async function vsfRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeader = getBasicAuthHeader();
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function listOutlets(
  _getToken?: () => Promise<string | null>,
): Promise<Outlet[]> {
  const base = getCrmBaseUrl();
  const resp = await vsfRequest<VsoftResponse<VsoftOutlet[]>>(
    `${base}/api/v1/outlets`,
  );
  return (resp.data ?? []).map(mapVsoftOutlet);
}

export async function listCategories(
  _getToken?: () => Promise<string | null>,
): Promise<Category[]> {
  const base = getCrmBaseUrl();
  const resp = await vsfRequest<VsoftResponse<Category[]>>(`${base}/api/v1/categories`);
  return resp.data || [];
}

export async function listCustomers(
  params: ListCustomersParams,
  _getToken?: () => Promise<string | null>,
): Promise<CustomerListItem[]> {
  const base = getCrmBaseUrl();
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.category) qs.set("category", params.category);
  if (params.outletId) {
    qs.set("outlet_code", params.outletId); // some APIs use outlet_code
    qs.set("outlet", params.outletId); // we send both just to be safe
    qs.set("primary_outlet_code", params.outletId); // Just in case
  }
  qs.set("take", String(params.take ?? 50)); // Max 50
  qs.set("skip", String(params.skip ?? 0));

  const url = `${base}/api/v1/members?${qs}`;
  const resp = await vsfRequest<VsoftResponse<VsoftMember[]>>(url);
  const items = (resp.data ?? []).map(mapVsoftMember);
  if (typeof resp.total === "number") {
    (items as any).totalCount = resp.total;
  }
  return items;
}

// ─── Preference helpers ───────────────────────────────────────────────────────

/**
 * Parse a comma-separated preference string, deduplicate, and sort by frequency.
 * e.g. "WHC,BEER,WHC,VODKA" → ["WHC", "BEER", "VODKA"]
 */
function parsePreferences(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const items = raw.split(",").map(x => x.trim()).filter(Boolean);
  // Count frequency
  const counts: Record<string, number> = {};
  for (const item of items) counts[item] = (counts[item] || 0) + 1;
  // Return unique items sorted by frequency desc
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

/**
 * Map a VsoftInsight record directly to a CustomerListItem.
 * Used when showing the customerInsights endpoint as the primary data source.
 */
export function mapInsightToListItem(
  insight: VsoftInsight,
  outletMap?: Map<string, string>,
): CustomerListItem {
  const foodPrefs  = parsePreferences(insight.food_preferences);
  const bevPrefs   = parsePreferences(insight.beverage_preferences);
  const outletName = outletMap?.get(insight.outlet ?? "") || insight.outlet || "—";
  const totalSpending = Number(insight.total_spending) || 0;
  const topFood = foodPrefs[0] || "";
  const topBev  = bevPrefs[0]  || "";
  const categoryName = [topFood, topBev].filter(Boolean).join(" / ") || "—";

  return {
    id:                insight.code || insight.customer_code || insight.phone || insight.phone_number || "",
    fullName:          (insight.customer_name || "").trim() || "(No Name)",
    phone:             insight.phone || insight.phone_number || "",
    email:             insight.email || "",
    status:            (insight.status as any) || "Regular",
    totalVisits:       Number(insight.total_visit) || 0,
    lastVisitDate:     insight.last_visit || "",
    totalSpending,
    foodPreferences:   foodPrefs,
    beveragePreferences: bevPrefs,
    primaryOutletId:   insight.outlet || "",
    primaryOutletName: outletName,
    categoryName,
    categoryCode:      "",
    address:           null,
    city:              null,
    province:          null,
    pointBalance:      0,
  };
}

/**
 * Fetch customer insights from the customerInsights endpoint.
 * Returns: Map keyed by `code` (and separately by `phone` for empty-code records).
 */
export async function fetchCustomerInsights(
  startDate: string,
  endDate: string,
  _getToken?: () => Promise<string | null>,
): Promise<{ byCode: Map<string, VsoftInsight>; byPhone: Map<string, VsoftInsight>; raw: VsoftInsight[] }> {
  const base = getCrmBaseUrl();
  const url = `${base}/api/v1/customerInsights?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  const resp = await vsfRequest<VsoftResponse<VsoftInsight[]>>(url);
  const byCode  = new Map<string, VsoftInsight>();
  const byPhone = new Map<string, VsoftInsight>();
  for (const item of (resp.data ?? [])) {
    const cCode = item.code || item.customer_code;
    const cPhone = item.phone || item.phone_number;
    if (cCode)  byCode.set(cCode, item);
    if (cPhone) byPhone.set(cPhone, item);
  }
  return { byCode, byPhone, raw: resp.data ?? [] };
}

/**
 * Merge insights data into a list of CustomerListItems.
 * Matches by code first, then by phone as fallback.
 * Deduplicates and rank-sorts food/beverage preferences.
 */
export function mergeInsightsIntoMembers(
  members: CustomerListItem[],
  insights: { byCode: Map<string, VsoftInsight>; byPhone: Map<string, VsoftInsight> },
  outletMap?: Map<string, string>,
): CustomerListItem[] {
  const { byCode, byPhone } = insights;
  if (byCode.size === 0 && byPhone.size === 0) return members;

  return members.map((m) => {
    const insight = byCode.get(m.id) || byPhone.get(m.phone) || null;
    if (!insight) return m;

    const totalSpending    = Number(insight.total_spending) || m.totalSpending;
    const totalVisits      = Number(insight.total_visit)    || m.totalVisits;
    const lastVisitDate    = insight.last_visit             || m.lastVisitDate;
    const rawOutlet        = insight.outlet || "";
    const primaryOutletName = outletMap?.get(rawOutlet) || rawOutlet || m.primaryOutletName;
    const foodPrefs        = parsePreferences(insight.food_preferences) || m.foodPreferences;
    const bevPrefs         = parsePreferences(insight.beverage_preferences) || m.beveragePreferences;

    return {
      ...m,
      totalSpending,
      totalVisits,
      lastVisitDate,
      primaryOutletId:   rawOutlet,
      primaryOutletName,
      foodPreferences:   foodPrefs,
      beveragePreferences: bevPrefs,
    };
  });
}

export async function countCustomers(
  search: string,
  category: string | undefined,
  outletId: string | undefined,
  currentDataLength: number,
  skip: number,
  take: number = 50,
): Promise<number> {
  // If we got fewer than requested on the current page, we know exactly how many there are total
  if (currentDataLength < take) {
    return skip + currentDataLength;
  }

  const base = getCrmBaseUrl();

  // Try fetching exact total first from take=1 query
  try {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (category) qs.set("category", category);
    if (outletId) {
      qs.set("outlet_code", outletId);
      qs.set("outlet", outletId);
    }
    qs.set("take", "1");
    qs.set("skip", "0");
    const url = `${base}/api/v1/members?${qs}`;
    const resp = await vsfRequest<VsoftResponse<VsoftMember[]>>(url);
    if (typeof resp.total === "number") {
      return resp.total;
    }
  } catch (err) {
    console.warn("⚠️ Exact total query fallback:", err);
  }

  const checkOffset = async (offset: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (category) qs.set("category", category);
    if (outletId) {
      qs.set("outlet_code", outletId);
      qs.set("outlet", outletId);
    }
    qs.set("take", "1");
    qs.set("skip", String(offset));
    const url = `${base}/api/v1/members?${qs}`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await vsfRequest<VsoftResponse<VsoftMember[]>>(url);
        return (resp.data ?? []).length > 0;
      } catch (err: any) {
        console.error(`checkOffset failed at ${offset} (attempt ${attempt}):`, err);
        if (attempt === 3) throw err;
        await new Promise(res => setTimeout(res, 1000));
      }
    }
    return false;
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  let low = skip + take;
  let high = 15000;
  let total = low;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const hasData = await checkOffset(mid);
    await delay(200); // 200ms delay to prevent 429 Too Many Requests
    
    if (hasData) {
      total = mid + 1;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return total;
}

export async function getCustomer(
  code: string,
  _getToken?: () => Promise<string | null>,
): Promise<CustomerDetail> {
  const base = getCrmBaseUrl();
  const resp = await vsfRequest<VsoftResponse<VsoftMember>>(
    `${base}/api/v1/members/${encodeURIComponent(code)}`,
  );
  return mapVsoftMemberDetail(resp.data);
}

export async function createCustomer(
  body: CreateCustomerBody,
  _getToken?: () => Promise<string | null>,
): Promise<{ code: string }> {
  const base = getCrmBaseUrl();
  const formData = new URLSearchParams();
  if (body.firstName) formData.set("first_name", body.firstName);
  if (body.lastName) formData.set("last_name", body.lastName);
  if (body.phone) formData.set("phone_number", body.phone);
  if (body.email) formData.set("email", body.email);
  if (body.address) formData.set("address", body.address);
  if (body.city) formData.set("city", body.city);
  if (body.province) formData.set("province", body.province);

  const resp = await vsfRequest<VsoftResponse<{ code: string }>>(
    `${base}/api/v1/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    },
  );
  return resp.data;
}

export async function updateCustomer(
  code: string,
  body: Partial<CreateCustomerBody>,
  _getToken?: () => Promise<string | null>,
): Promise<void> {
  const base = getCrmBaseUrl();
  const formData = new URLSearchParams();
  formData.set("member_code", code);
  if (body.firstName) formData.set("name", body.firstName + (body.lastName ? ` ${body.lastName}` : ""));
  if (body.phone) formData.set("phone_number", body.phone);
  if (body.email) formData.set("email", body.email);
  if (body.address) formData.set("address", body.address);
  if (body.city) formData.set("city", body.city);
  if (body.province) formData.set("province", body.province);

  await vsfRequest<VsoftResponse<unknown>>(
    `${base}/api/v1/members`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    },
  );
}

export interface CustomerPurchaseItem {
  no_bill: string;
  nama: string;
  tanggal: string;
  items: string;
  qty: number;
  harga: number;
  disc: number;
  total: number;
}

export async function getCustomerHistory(
  code: string,
  name: string = "",
  phone: string = "",
  _getToken?: () => Promise<string | null>,
): Promise<CustomerPurchaseItem[]> {
  const base = getCrmBaseUrl();
  const qs = new URLSearchParams();
  if (name) qs.set("name", name);
  if (phone) qs.set("phone", phone);
  try {
    const resp = await vsfRequest<VsoftResponse<CustomerPurchaseItem[]>>(
      `${base}/api/v1/members/${encodeURIComponent(code)}/history?${qs}`,
    );
    return resp.data ?? [];
  } catch (err) {
    console.warn("Failed to fetch customer history:", err);
    return [];
  }
}

// Note: deleteCustomer is not available in Vsoft API

// ─── Query keys ───────────────────────────────────────────────────────────────

export const crmKeys = {
  all: ["crm"] as const,
  outlets: () => [...crmKeys.all, "outlets"] as const,
  categories: () => [...crmKeys.all, "categories"] as const,
  lists: () => [...crmKeys.all, "list"] as const,
  list: (params: ListCustomersParams) => [...crmKeys.lists(), params] as const,
  details: () => [...crmKeys.all, "detail"] as const,
  detail: (code: string) => [...crmKeys.details(), code] as const,
  detailHistory: (code: string, name?: string, phone?: string) => [...crmKeys.details(), code, "history", name, phone] as const,
  insights: (startDate: string, endDate: string) => [...crmKeys.all, "insights", startDate, endDate] as const,
};

// ─── WhatsApp API Placeholders (Under Construction) ───────────────────────────

export interface SendWhatsAppParams {
  recipients: CustomerListItem[];
  message: string;
  imageFile?: File | null;
}

/**
 * Placeholder API WhatsApp untuk AtoZ Group.
 * Untuk sementara dikosongkan/di-mock karena endpoint API WhatsApp masih dalam tahap pembuatan.
 */
export async function sendWhatsAppAtoZ(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp AtoZ saat sudah siap
  console.log("[WhatsApp API - AtoZ] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API AtoZ masih dalam pengembangan." };
}

/**
 * Placeholder API WhatsApp untuk Bosa.
 */
export async function sendWhatsAppBosa(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp Bosa saat sudah siap
  console.log("[WhatsApp API - Bosa] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API Bosa masih dalam pengembangan." };
}

/**
 * Placeholder API WhatsApp untuk Bodega.
 */
export async function sendWhatsAppBodega(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp Bodega saat sudah siap
  console.log("[WhatsApp API - Bodega] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API Bodega masih dalam pengembangan." };
}

/**
 * Placeholder API WhatsApp untuk Lakers.
 */
export async function sendWhatsAppLakers(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp Lakers saat sudah siap
  console.log("[WhatsApp API - Lakers] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API Lakers masih dalam pengembangan." };
}

/**
 * Placeholder API WhatsApp untuk Redhare.
 */
export async function sendWhatsAppRedhare(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp Redhare saat sudah siap
  console.log("[WhatsApp API - Redhare] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API Redhare masih dalam pengembangan." };
}

/**
 * Placeholder API WhatsApp untuk Oombee.
 */
export async function sendWhatsAppOombee(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp Oombee saat sudah siap
  console.log("[WhatsApp API - Oombee] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API Oombee masih dalam pengembangan." };
}

/**
 * Placeholder API WhatsApp untuk Shiraz.
 */
export async function sendWhatsAppShiraz(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp Shiraz saat sudah siap
  console.log("[WhatsApp API - Shiraz] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API Shiraz masih dalam pengembangan." };
}

/**
 * Placeholder API WhatsApp untuk District 5.
 */
export async function sendWhatsAppDistrict5(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp District 5 saat sudah siap
  console.log("[WhatsApp API - District5] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API District 5 masih dalam pengembangan." };
}

/**
 * Placeholder API WhatsApp untuk Infinity.
 */
export async function sendWhatsAppInfinity(_params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
  // TODO: Hubungkan ke endpoint API WhatsApp Infinity saat sudah siap
  console.log("[WhatsApp API - Infinity] Placeholder dipanggil untuk", _params.recipients.length, "penerima");
  await new Promise(res => setTimeout(res, 800));
  return { success: true, message: "WhatsApp API Infinity masih dalam pengembangan." };
}

