// Ladies API Client for Dashboard
// Connects to the api-server-ladies backend

const LADIES_API_URL = import.meta.env.VITE_LADIES_API_URL || "https://apid5.atozgroupsemarang.com";

type GetTokenFn = () => Promise<string | null>;

async function apiFetch(path: string, getToken: GetTokenFn, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${LADIES_API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LadyPhoto {
  id: number;
  lady_id: number;
  photo_path: string;
  sort_order: number;
}

export interface Lady {
  id: number;
  name: string;
  age: number;
  category: "sapphire" | "diamond" | "spahiere";
  outlet: "district5" | "infinity";
  description: string | null;
  height: string | null;
  weight: string | null;
  status: "ready" | "book" | "reserve" | "engaged";
  is_active?: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  photos: LadyPhoto[];
}

export interface LadyReport {
  id: number;
  name: string;
  category: string;
  age: number;
  total_hours: number;
  total_bookings: number;
  photo: string | null;
}

export interface RoomBooking {
  id: number;
  lady_id: number;
  outlet: string;
  hours: number;
  booking_date: string;
  notes: string | null;
  status: "waiting" | "active" | "completed" | "cancelled";
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
  lady_name: string;
  lady_category: string;
  lady_age: number;
  lady_status: string;
  lady_photo: string | null;
}

export interface CreateLadyData {
  name: string;
  age: number;
  category: string;
  outlet: string;
  description?: string;
  height?: string;
  weight?: string;
  is_active?: boolean;
  photos?: File[];
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function listLadies(
  outlet: string,
  getToken: GetTokenFn,
  category?: string,
  search?: string
): Promise<Lady[]> {
  const params = new URLSearchParams({ outlet });
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  return apiFetch(`/api/ladies?${params}`, getToken);
}

export async function getLady(id: number, getToken: GetTokenFn): Promise<Lady> {
  return apiFetch(`/api/ladies/${id}`, getToken);
}

export async function createLady(data: CreateLadyData, getToken: GetTokenFn): Promise<Lady> {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("age", String(data.age));
  formData.append("category", data.category);
  formData.append("outlet", data.outlet);
  if (data.description) formData.append("description", data.description);
  if (data.height) formData.append("height", data.height);
  if (data.weight) formData.append("weight", data.weight);
  if (data.is_active !== undefined) formData.append("is_active", String(data.is_active));

  if (data.photos) {
    data.photos.forEach((file) => {
      formData.append("photos", file);
    });
  }

  return apiFetch("/api/ladies", getToken, {
    method: "POST",
    body: formData,
  });
}

export async function updateLady(
  id: number,
  data: Partial<CreateLadyData> & { removePhotoIds?: number[] },
  getToken: GetTokenFn
): Promise<Lady> {
  const formData = new FormData();
  if (data.name) formData.append("name", data.name);
  if (data.age) formData.append("age", String(data.age));
  if (data.category) formData.append("category", data.category);
  if (data.outlet) formData.append("outlet", data.outlet);
  if (data.description !== undefined) formData.append("description", data.description || "");
  if (data.height !== undefined) formData.append("height", data.height || "");
  if (data.weight !== undefined) formData.append("weight", data.weight || "");
  if (data.is_active !== undefined) formData.append("is_active", String(data.is_active));

  if (data.removePhotoIds && data.removePhotoIds.length > 0) {
    formData.append("removePhotoIds", JSON.stringify(data.removePhotoIds));
  }

  if (data.photos) {
    data.photos.forEach((file) => {
      formData.append("photos", file);
    });
  }

  return apiFetch(`/api/ladies/${id}`, getToken, {
    method: "PUT",
    body: formData,
  });
}

export async function toggleLadyActive(
  id: number,
  is_active: boolean,
  getToken: GetTokenFn
): Promise<Lady> {
  return apiFetch(`/api/ladies/${id}/active`, getToken, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}

export async function deleteLady(id: number, getToken: GetTokenFn): Promise<void> {
  return apiFetch(`/api/ladies/${id}`, getToken, { method: "DELETE" });
}

export async function getLadiesReport(
  outlet: string,
  month: string,
  getToken: GetTokenFn,
  startDate?: string,
  endDate?: string
): Promise<LadyReport[]> {
  const params = new URLSearchParams({ outlet, month });
  if (startDate && endDate) {
    params.append("startDate", startDate);
    params.append("endDate", endDate);
  }
  return apiFetch(`/api/ladies-report?${params}`, getToken);
}

export async function listRoomBookings(
  outlet: string,
  getToken: GetTokenFn
): Promise<RoomBooking[]> {
  const params = new URLSearchParams({ outlet });
  return apiFetch(`/api/room-bookings?${params}`, getToken);
}

export async function startRoomBooking(
  id: number,
  getToken: GetTokenFn
): Promise<void> {
  return apiFetch(`/api/room-bookings/${id}/start`, getToken, { method: "POST" });
}

export async function addOvertimeBooking(
  id: number,
  hours: number,
  getToken: GetTokenFn
): Promise<void> {
  return apiFetch(`/api/room-bookings/${id}/overtime`, getToken, {
    method: "POST",
    body: JSON.stringify({ extra_hours: hours }),
  });
}

export async function completeRoomBooking(
  id: number,
  getToken: GetTokenFn
): Promise<void> {
  return apiFetch(`/api/room-bookings/${id}/complete`, getToken, { method: "POST" });
}

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const ladiesKeys = {
  all: () => ["ladies"] as const,
  lists: () => [...ladiesKeys.all(), "list"] as const,
  list: (outlet: string, category?: string) => [...ladiesKeys.lists(), outlet, category] as const,
  details: () => [...ladiesKeys.all(), "detail"] as const,
  detail: (id: number) => [...ladiesKeys.details(), id] as const,
  reports: () => [...ladiesKeys.all(), "report"] as const,
  report: (outlet: string, month: string, startDate?: string, endDate?: string) => [...ladiesKeys.reports(), outlet, month, startDate, endDate] as const,
  roomBookings: () => [...ladiesKeys.all(), "room-bookings"] as const,
  roomBooking: (outlet: string) => [...ladiesKeys.roomBookings(), outlet] as const,
};

