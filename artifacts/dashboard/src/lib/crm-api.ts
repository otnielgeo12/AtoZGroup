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

function cleanEnvString(val?: string): string {
  if (!val) return "";
  return val.replace(/["'\r\n\t]+/g, "").trim();
}

function getCrmBaseUrl(): string {
  if (import.meta.env.DEV) {
    return "/vsoft-api";
  }
  const url = cleanEnvString((import.meta as any).env?.VITE_CRM_API_URL);
  return url.replace(/\/$/, "");
}

function safeBtoa(str: string): string {
  try {
    return btoa(str);
  } catch (e) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e2) {
      console.error("Base64 encoding error:", e2);
      return "";
    }
  }
}

function getBasicAuthHeader(): string {
  const username = cleanEnvString((import.meta as any).env?.VITE_VSOFT_USERNAME);
  const password = cleanEnvString((import.meta as any).env?.VITE_VSOFT_PASSWORD);
  if (!username) return "";
  return `Basic ${safeBtoa(`${username}:${password}`)}`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export async function fetchUpcomingBirthdays(
  outletId?: string,
  _getToken?: () => Promise<string | null>,
): Promise<any[]> {
  const base = getCrmBaseUrl();
  const qs = new URLSearchParams();
  if (outletId) {
    let code = outletId;
    if (code === "Ombe") code = "OB";
    if (code === "Lakers") code = "LK";
    if (code === "Bodega") code = "BD";
    if (code === "AtoZ") code = "AZ";
    if (code === "BOSA") code = "BS";
    qs.set("outlet", code);
  }
  qs.set("limit", "5");
  try {
    const resp = await vsfRequest<VsoftResponse<any[]>>(`${base}/api/v1/members/upcoming-birthdays?${qs}`);
    return resp.data || [];
  } catch (err) {
    console.error("fetchUpcomingBirthdays error:", err);
    return [];
  }
}

// ─── Analytics ─────────────────────────────────────────────────────────────────────

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CustomerStatus = "VIP" | "Regular" | "New";

export function computeCustomerStatus(totalVisits: number, lastVisitDate?: string | null, backendStatus?: string | null): CustomerStatus {
  if (backendStatus === "VIP" || backendStatus === "Regular" || backendStatus === "New") {
    if (backendStatus === "New" && totalVisits > 3) {
      return totalVisits > 20 ? "VIP" : "Regular";
    }
    return backendStatus as CustomerStatus;
  }
  if (totalVisits > 20) return "VIP";
  if (totalVisits > 3) return "Regular";
  if (totalVisits >= 1 && totalVisits <= 3) return "New";
  if (lastVisitDate && totalVisits <= 3) {
    const ts = new Date(lastVisitDate).getTime();
    if (!isNaN(ts)) {
      const diffDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
      if (diffDays <= 90 && totalVisits <= 3) return "New";
    }
  }
  return "Regular";
}

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
  lastEvent?: string;
  favoriteItems?: Array<{ name: string; count: number }>;
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

export const ALL_TENANTS = ["atoz", "bosa", "lakers", "ombe", "rh", "bodega"];

export interface ListCustomersParams {
  search?: string;
  category?: string;
  outletId?: string;
  take?: number;
  skip?: number;
  status?: string;
}

// ─── Vsoft raw types ──────────────────────────────────────────────────────────

interface VsoftResponse<T> {
  message: string;
  errors: unknown;
  data: T;
  total?: number;
  count?: number;
  total_new?: number;
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
  last_event?: string;
  favorite_items?: string | Array<{ name: string; count: number }>;
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
  last_event?: string;
  favorite_items?: string | Array<{ name: string; count: number }>;
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

function isValidAndAllowedCustomer(item: CustomerListItem): boolean {
  return true;
}

function mapVsoftMember(m: VsoftMember): CustomerListItem {
  const nameVal = m.customer_name || m.name || "";
  const fullName = nameVal.trim() || "(No Name)";
  const phone = m.phone || m.phone_number || "";

  const totalSpending = Number(m.total_spending) || 0;
  const totalVisits = Number(m.total_visit) || Number((m as any).total_visits) || 0;
  const lastVisitDate = m.last_visit || (m as any).last_visit_date || "";
  const rawOutlet = m.outlet || (m as any).outlet_name || (m as any).primary_outlet_name || (m as any).outlet_code || "—";
  
  const mapOutletCode = (code: string) => {
    const c = code.trim().toUpperCase();
    if (c === "AZ" || c === "ATOZ") return "AtoZ";
    if (c === "BS" || c === "BOSA") return "BOSA";
    if (c === "LK" || c === "LV" || c === "LAKERS") return "Lakers";
    if (c === "BD" || c === "BODEGA") return "Bodega";
    if (c === "OM" || c === "OMBE" || c === "OB") return "Ombe";
    if (c === "RH") return "RH";
    if (c === "D5") return "D5";
    return code.trim();
  };

  const primaryOutletName = rawOutlet !== "—" 
    ? Array.from(new Set(rawOutlet.split(",").map(mapOutletCode))).join(", ") 
    : "—";

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
    status: computeCustomerStatus(totalVisits, lastVisitDate, (m as any).status),
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
    lastEvent: m.last_event || (m as any).events_attended || "-",
    favoriteItems: (() => {
      const parsed = parseFavoriteItems(m.favorite_items);
      if (parsed.length > 0) return parsed;
      const combined = [...foodPrefs, ...bevPrefs];
      return combined.slice(0, 3).map((name, i) => ({
        name,
        count: Math.max(1, Number(totalVisits) * 2 - i)
      }));
    })(),
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
  outletId?: string,
): Promise<T> {
  const authHeader = getBasicAuthHeader();
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (outletId) {
    let raw = outletId.toLowerCase();
    if (raw === "bs") raw = "bosa";
    if (raw === "lk") raw = "lakers";
    if (raw === "bd") raw = "bodega";
    if (raw === "az") raw = "atoz";
    (headers as any)["x-outlet-id"] = raw;
  }

  let finalUrl = url;
  if (!import.meta.env.DEV && finalUrl.startsWith("/api-handler.php/")) {
    const parts = finalUrl.substring(17).split("?");
    const route = parts[0];
    const qs = parts[1] ? `&${parts[1]}` : "";
    finalUrl = `/api-handler.php?route=/${route}${qs}`;
  }

  const res = await fetch(finalUrl, { ...options, headers });
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
  return [
    { id: "AZ", name: "AtoZ" },
    { id: "BS", name: "BOSA" },
    { id: "Lakers", name: "Lakers" },
    { id: "Ombe", name: "Ombe" },
    { id: "RH", name: "RH" },
    { id: "Bodega", name: "Bodega" },
    { id: "D5", name: "D5" },
  ];
}

export async function listCategories(
  outletId?: string,
  _getToken?: () => Promise<string | null>,
): Promise<Category[]> {
  const base = getCrmBaseUrl();
  try {
    const resp = await vsfRequest<VsoftResponse<Category[]>>(`${base}/api/v1/categories`, {}, outletId);
    return resp.data || [];
  } catch (err) {
    return [];
  }
}

export async function listCustomers(
  params: ListCustomersParams,
  _getToken?: () => Promise<string | null>,
): Promise<CustomerListItem[]> {
  const base = getCrmBaseUrl();
  const fetchPage = async (outId?: string, customSkip?: number, customTake?: number) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.category) qs.set("category", params.category);
    if (params.outletId) {
      let code = params.outletId;
      if (code === "Ombe") code = "OB";
      if (code === "Lakers") code = "LK";
      if (code === "Bodega") code = "BD";
      if (code === "AtoZ") code = "AZ";
      if (code === "BOSA") code = "BS";
      qs.set("outlet_code", code);
      qs.set("outlet", code);
      qs.set("primary_outlet_code", code);
    }
    if (params.status) qs.set("status", params.status);
    qs.set("take", String(customTake ?? params.take ?? 50));
    qs.set("skip", String(customSkip ?? params.skip ?? 0));
    return await vsfRequest<VsoftResponse<VsoftMember[]>>(`${base}/api/v1/members?${qs}`, {}, outId);
  };

  if (params.outletId) {
    let resp = await fetchPage(params.outletId);
    if (params.outletId === "BS" && (!resp.data || resp.data.length === 0 || resp.total === 0)) {
      resp = await fetchPage("Lakers");
    }
    const tId = params.outletId === "BS" ? "bosa" : (params.outletId === "Lakers" ? "lakers" : (params.outletId === "Ombe" ? "ombe" : (params.outletId === "RH" ? "rh" : (params.outletId === "Bodega" ? "bodega" : "atoz"))));
    const items = (resp.data ?? []).map(m => mapVsoftMember({ ...m, _injected_tenant: tId })).filter(isValidAndAllowedCustomer);
    if (typeof resp.total === "number") (items as any).totalCount = resp.total;
    if (typeof resp.total_new === "number") (items as any).totalNewCount = resp.total_new;
    return items;
  } else {
    // Backend handles 'all' merging and pagination
    const resp = await fetchPage("all");
    const items = (resp.data ?? []).map(m => mapVsoftMember({ ...m, _injected_tenant: (m as any)._injected_tenant || "all" })).filter(isValidAndAllowedCustomer);
    if (typeof resp.total === "number") (items as any).totalCount = resp.total;
    if (typeof resp.total_new === "number") (items as any).totalNewCount = resp.total_new;
    return items;
  }
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

function parseFavoriteItems(raw: unknown): Array<{ name: string; count: number }> {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [];
    }
  }
  return [];
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
  const lastEvent = insight.last_event || (insight as any).events_attended || "-";
  const favoriteItems = (() => {
    const parsed = parseFavoriteItems(insight.favorite_items);
    if (parsed.length > 0) return parsed;
    const combined = [...foodPrefs, ...bevPrefs];
    return combined.slice(0, 3).map((name, i) => ({
      name,
      count: Math.max(1, Number(insight.total_visit) * 2 - i)
    }));
  })();

  return {
    id:                insight.code || insight.customer_code || insight.phone || insight.phone_number || "",
    fullName:          (insight.customer_name || "").trim() || "(No Name)",
    phone:             insight.phone || insight.phone_number || "",
    email:             insight.email || "",
    status:            computeCustomerStatus(Number(insight.total_visit) || 0, insight.last_visit, insight.status),
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
    lastEvent,
    favoriteItems,
  };
}

/**
 * Fetch customer insights from the customerInsights endpoint.
 * Returns: Map keyed by `code` (and separately by `phone` for empty-code records).
 */
export async function fetchCustomerInsights(
  startDate: string,
  endDate: string,
  outletId?: string,
  _getToken?: () => Promise<string | null>,
): Promise<{ byCode: Map<string, VsoftInsight>; byPhone: Map<string, VsoftInsight>; raw: VsoftInsight[] }> {
  const base = getCrmBaseUrl();
  
  const fetchForTenant = async (outId?: string) => {
    const qs = new URLSearchParams();
    qs.set("start_date", startDate);
    qs.set("end_date", endDate);
    if (outletId) {
      let code = outletId;
      if (code === "Ombe") code = "OB";
      if (code === "Lakers") code = "LK";
      if (code === "Bodega") code = "BD";
      if (code === "AtoZ") code = "AZ";
      if (code === "BOSA") code = "BS";
      if (code === "RH") code = "RH";
      if (code === "D5") code = "D5";
      qs.set("outlet_code", code);
    }
    return await vsfRequest<VsoftResponse<VsoftInsight[]>>(`${base}/api/v1/customerInsights?${qs}`, {}, outId);
  };

  let allData: VsoftInsight[] = [];
  
  if (outletId) {
    const resp = await fetchForTenant(outletId).catch(() => null);
    if (resp && resp.data) allData = resp.data;
  } else {
    // Backend handles 'all' merging
    const resp = await fetchForTenant("all").catch(() => null);
    if (resp && resp.data) allData = resp.data;
  }

  const byCode  = new Map<string, VsoftInsight>();
  const byPhone = new Map<string, VsoftInsight>();
  
  for (const item of allData) {
    const cCode = item.code || item.customer_code;
    const cPhone = item.phone || item.phone_number;
    
    if (cCode) byCode.set(cCode, item);
    if (cPhone) byPhone.set(cPhone, item);
  }
  return { byCode, byPhone, raw: allData };
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
    const parsedFood       = parsePreferences(insight.food_preferences);
    const parsedBev        = parsePreferences(insight.beverage_preferences);
    const foodPrefs        = parsedFood.length > 0 ? parsedFood : m.foodPreferences;
    const bevPrefs         = parsedBev.length > 0 ? parsedBev : m.beveragePreferences;
    const rawLastEvent     = insight.last_event || (insight as any).events_attended;
    const lastEvent        = rawLastEvent && rawLastEvent !== "-" ? rawLastEvent : (m.lastEvent || "-");
    const parsedFavs       = parseFavoriteItems(insight.favorite_items);
    const favoriteItems    = parsedFavs.length > 0 ? parsedFavs : (m.favoriteItems || []);

    return {
      ...m,
      totalSpending,
      totalVisits,
      lastVisitDate,
      status:            computeCustomerStatus(totalVisits, lastVisitDate, insight.status || m.status),
      primaryOutletId:   rawOutlet,
      primaryOutletName,
      foodPreferences:   foodPrefs,
      beveragePreferences: bevPrefs,
      lastEvent,
      favoriteItems,
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
      let code = outletId;
      if (code === "Ombe") code = "OB";
      if (code === "Lakers") code = "LK";
      if (code === "Bodega") code = "BD";
      if (code === "AtoZ") code = "AZ";
      if (code === "BOSA") code = "BS";
      qs.set("outlet_code", code);
      qs.set("outlet", code);
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
  
  for (const t of ALL_TENANTS) {
    try {
      const resp = await vsfRequest<VsoftResponse<VsoftMember>>(
        `${base}/api/v1/members/${encodeURIComponent(code)}`,
        {},
        t
      );
      if (resp && resp.data && (resp.data.code || (resp.data as any).customer_code)) {
        return mapVsoftMemberDetail({ ...resp.data, _injected_tenant: t } as any);
      }
    } catch (e) {
      // ignore and try next
    }
  }
  throw new Error("Customer not found in any tenant");
}

export async function createCustomer(
  body: CreateCustomerBody,
  _getToken?: () => Promise<string | null>,
): Promise<{ code: string }> {
  const base = getCrmBaseUrl();

  const payload: Record<string, string> = {};
  if (body.firstName)  payload.first_name   = body.firstName;
  if (body.lastName)   payload.last_name    = body.lastName;
  if (body.phone)      payload.phone_number = body.phone;
  if (body.email)      payload.email        = body.email;
  if (body.address)    payload.address      = body.address;
  if (body.city)       payload.city         = body.city;
  if (body.province)   payload.province     = body.province;
  if (body.outletCode) payload.outlet_code  = body.outletCode;

  const resp = await vsfRequest<VsoftResponse<{ code: string }>>(
    `${base}/api/v1/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

  const payload: Record<string, string> = { member_code: code };
  if (body.firstName || body.lastName) {
    payload.name = [body.firstName, body.lastName].filter(Boolean).join(" ").trim();
  }
  if (body.phone)      payload.phone_number = body.phone;
  if (body.email)      payload.email        = body.email;
  if (body.address)    payload.address      = body.address;
  if (body.city)       payload.city         = body.city;
  if (body.province)   payload.province     = body.province;
  if (body.outletCode) payload.outlet_code  = body.outletCode;

  await vsfRequest<VsoftResponse<unknown>>(
    `${base}/api/v1/members`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
  startDate: string = "",
  endDate: string = "",
): Promise<CustomerPurchaseItem[]> {
  const base = getCrmBaseUrl();
  const qs = new URLSearchParams();
  if (name) qs.set("name", name);
  if (phone) qs.set("phone", phone);
  if (startDate) qs.set("start_date", startDate);
  if (endDate) qs.set("end_date", endDate);
  
  let allHistory: CustomerPurchaseItem[] = [];
  for (const t of ALL_TENANTS) {
    try {
      const resp = await vsfRequest<VsoftResponse<CustomerPurchaseItem[]>>(
        `${base}/api/v1/members/${encodeURIComponent(code)}/history?${qs}`,
        {},
        t
      );
      if (resp && resp.data && Array.isArray(resp.data)) {
        allHistory = allHistory.concat(resp.data);
      }
    } catch (err) {
      // ignore
    }
  }
  
  // Sort descending by date
  allHistory.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  return allHistory;
}

// Note: deleteCustomer is not available in Vsoft API

// ─── Query keys ───────────────────────────────────────────────────────────────

export const crmKeys = {
  all: ["crm"] as const,
  outlets: () => [...crmKeys.all, "outlets"] as const,
  categories: (outletId?: string) => [...crmKeys.all, "categories", outletId || "all"] as const,
  lists: () => [...crmKeys.all, "list"] as const,
  list: (params: ListCustomersParams) => [...crmKeys.lists(), params] as const,
  details: () => [...crmKeys.all, "detail"] as const,
  detail: (code: string) => [...crmKeys.details(), code] as const,
  detailHistory: (code: string, name?: string, phone?: string, startDate?: string, endDate?: string) => [...crmKeys.details(), code, "history", name, phone, startDate, endDate] as const,
  insights: (startDate: string, endDate: string) => [...crmKeys.all, "insights", startDate, endDate] as const,
  upcomingBirthdays: (outlet?: string) => [...crmKeys.all, "upcomingBirthdays", outlet || "all"] as const,
};

// ─── WhatsApp API Placeholders (Under Construction) ───────────────────────────


export interface SendWhatsAppParams {
  recipients: CustomerListItem[];
  message: string;
  imageFile?: File;
  imageUrl?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  message: string;
  jobId?: string;
  estimatedSeconds?: number;
  skippedDueToLimit?: number;
}

export interface WhatsAppJobProgress {
  status: "pending" | "processing" | "completed" | "failed";
  totalRecipients: number;
  sentCount: number;
  failCount: number;
  results: { name: string; phone: string; status: "sent" | "failed"; error?: string }[];
}

export async function getWhatsAppSendProgress(jobId: string): Promise<WhatsAppJobProgress | null> {
  return null;
}

export async function getWhatsAppStatus(tenant: string): Promise<{ dailyCount: number, dailyLimit: number }> {
  return { dailyCount: 0, dailyLimit: 15 };
}

export async function fetchTopSpenders(
  startDate: string,
  endDate: string,
  limit: number = 5,
  _getToken?: () => Promise<string | null>,
): Promise<CustomerListItem[]> {
  const insights = await fetchCustomerInsights(startDate, endDate, undefined, _getToken);
  const raw = insights.raw;
  // sort by total_spending desc
  raw.sort((a, b) => (Number(b.total_spending) || 0) - (Number(a.total_spending) || 0));
  
  const top = raw.slice(0, limit);
  // map them to CustomerListItem
  return top.map(insight => {
    return mapInsightToListItem(insight);
  });
}

export interface RevenueAnalyticsItem {
  month: string;
  month_key: string;
  revenue: number;
}

export async function fetchRevenueAnalytics(
  timeframe: number,
  outlet?: string,
  _getToken?: () => Promise<string | null>,
): Promise<RevenueAnalyticsItem[]> {
  const base = getCrmBaseUrl();
  const qs = new URLSearchParams();
  qs.set("timeframe", String(timeframe));
  if (outlet && outlet !== "All Outlets" && outlet !== "all") {
    let code = outlet;
    if (code === "Ombe") code = "OB";
    if (code === "Lakers") code = "LK";
    if (code === "Bodega") code = "BD";
    if (code === "AtoZ") code = "AZ";
    if (code === "BOSA") code = "BS";
    if (code === "RH") code = "RH";
    if (code === "D5") code = "D5";
    qs.set("outlet", code);
  }
  const url = `${base}/api/analytics/revenue?${qs}`;
  const resp = await vsfRequest<VsoftResponse<RevenueAnalyticsItem[]>>(url);
  return resp.data || [];
}

export async function fetchTopSpendersAnalytics(
  outlet?: string,
  _getToken?: () => Promise<string | null>,
): Promise<any[]> {
  const base = getCrmBaseUrl();
  const qs = new URLSearchParams();
  if (outlet && outlet !== "All Outlets" && outlet !== "all") {
    let code = outlet;
    if (code === "Ombe") code = "OB";
    if (code === "Lakers") code = "LK";
    if (code === "Bodega") code = "BD";
    if (code === "AtoZ") code = "AZ";
    if (code === "BOSA") code = "BS";
    if (code === "RH") code = "RH";
    if (code === "D5") code = "D5";
    qs.set("outlet", code);
  }
  const url = `${base}/api/analytics/top-spenders?${qs}`;
  const resp = await vsfRequest<VsoftResponse<any[]>>(url);
  return resp.data || [];
}

export interface AnalyticsItem {
  nama_barang: string;
  total_sold: number;
}

export async function fetchTopItemsAnalytics(
  outlet?: string,
  _getToken?: () => Promise<string | null>,
  sort?: string,
): Promise<AnalyticsItem[]> {
  const base = getCrmBaseUrl();
  const qs = new URLSearchParams();
  if (outlet && outlet !== "All Outlets" && outlet !== "all") {
    let code = outlet;
    if (code === "Ombe") code = "OB";
    if (code === "Lakers") code = "LK";
    if (code === "Bodega") code = "BD";
    if (code === "AtoZ") code = "AZ";
    if (code === "BOSA") code = "BS";
    if (code === "RH") code = "RH";
    if (code === "D5") code = "D5";
    qs.set("outlet", code);
  }
  if (sort) {
    qs.set("sort", sort);
  }
  const url = `${base}/api/analytics/top-items?${qs}`;
  const resp = await vsfRequest<VsoftResponse<AnalyticsItem[]>>(url);
  return resp.data || [];
}

export async function sendWhatsAppAtoZ(params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const base = getCrmBaseUrl();
  const recipients = params.recipients.map((r: any) => ({
    name:  r.fullName || r.name || r.customer_name || "Pelanggan",
    phone: r.phone_number || r.phone || "",
  }));

  try {
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    if (params.imageFile) {
      const b64 = await fileToBase64(params.imageFile);
      imageBase64 = b64.split(",")[1];
      imageMimeType = params.imageFile.type;
    }

    const resp = await fetch(`${base}/api/wa/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outlet:     "atoz",
        recipients,
        message:    params.message,
        imageBase64,
        imageMimeType,
      }),
    });

    const json = await resp.json();

    if (!resp.ok || !json.success) {
      return { success: false, message: json.message || "Gagal mengirim pesan" };
    }

    const d = json.data || {};
    return {
      success:    true,
      message:    json.message || `Terkirim ke ${d.sentCount} penerima`,
      jobId:      undefined,
    };
  } catch (error: any) {
    console.error("WA AtoZ error:", error);
    return { success: false, message: error?.message || "Kesalahan jaringan" };
  }
}

export async function sendWhatsAppBosa(params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const base = getCrmBaseUrl();
  const recipients = params.recipients.map((r: any) => ({
    name:  r.fullName || r.name || r.customer_name || "Pelanggan",
    phone: r.phone_number || r.phone || "",
  }));

  try {
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;
    if (params.imageFile) {
      const b64 = await fileToBase64(params.imageFile);
      imageBase64 = b64.split(",")[1];
      imageMimeType = params.imageFile.type;
    }

    const resp = await fetch(`${base}/api/wa/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outlet:     "bosa",
        recipients,
        message:    params.message,
        imageBase64,
        imageMimeType,
      }),
    });

    const json = await resp.json();

    if (!resp.ok || !json.success) {
      return { success: false, message: json.message || "Gagal mengirim pesan" };
    }

    const d = json.data || {};
    return {
      success:    true,
      message:    json.message || `Terkirim ke ${d.sentCount} penerima`,
      jobId:      undefined,
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Koneksi ke server gagal" };
  }
}

export async function sendWhatsAppBodega(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: false, message: "WhatsApp Bodega belum dikonfigurasi. Hubungi admin." };
}
export async function sendWhatsAppLakers(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: false, message: "WhatsApp Lakers belum dikonfigurasi. Hubungi admin." };
}
export async function sendWhatsAppRedhare(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: false, message: "WhatsApp Redhare belum dikonfigurasi. Hubungi admin." };
}
export async function sendWhatsAppOombee(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: false, message: "WhatsApp Ombe belum dikonfigurasi. Hubungi admin." };
}
export async function sendWhatsAppShiraz(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: false, message: "WhatsApp Shiraz belum dikonfigurasi. Hubungi admin." };
}
export async function sendWhatsAppDistrict5(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: false, message: "WhatsApp District5 belum dikonfigurasi. Hubungi admin." };
}
export async function sendWhatsAppInfinity(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  return { success: false, message: "WhatsApp Infinity belum dikonfigurasi. Hubungi admin." };
}

export interface WhatsAppMessageLog {
  id: string;
  sent_at?: string;
  created_at: string;
  customer_name?: string;
  recipient_number: string;
  message_text: string;
  image_url?: string;
  brand_id: string;
  status: "pending" | "success" | "failed";
  delivery_status?: "pending" | "sent" | "read" | "failed";
  wablas_message_id?: string;
  read_at?: string;
  error_message?: string;
}

export interface WhatsAppReportsSummary {
  totalMessages: number;
  totalSent: number;
  totalRead: number;
  totalFailed: number;
}

export async function fetchWhatsAppReports(
  startDate?: string,
  endDate?: string,
  brandFilter?: string
): Promise<{ data: WhatsAppMessageLog[]; summary: WhatsAppReportsSummary }> {
  try {
    const waApiUrl = (import.meta as any).env.VITE_WA_API_URL || "https://apiwa.atozgroupsemarang.com";
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (brandFilter) params.append("brandId", brandFilter.toLowerCase());

    const resp = await fetch(`${waApiUrl}/api/reports?${params.toString()}`);
    if (!resp.ok) throw new Error("Failed to fetch reports");
    const json = await resp.json();
    if (json.success) {
      return {
        data: json.data || [],
        summary: json.summary || { totalMessages: 0, totalSent: 0, totalRead: 0, totalFailed: 0 }
      };
    }
    throw new Error(json.error || "Failed");
  } catch (error) {
    console.error("fetchWhatsAppReports error:", error);
    return {
      data: [],
      summary: { totalMessages: 0, totalSent: 0, totalRead: 0, totalFailed: 0 }
    };
  }
}
