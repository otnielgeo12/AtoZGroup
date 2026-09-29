// ─── Sosmed Plan — Mock API Service ───────────────────────────────────────────
// All functions return Promises and simulate network latency.
// TODO: Replace each function body with actual fetch/axios calls to your API.

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentPlatform = "instagram" | "tiktok" | "youtube" | "twitter" | "facebook";
export type ContentFormat = "Reels" | "Story" | "Carousel" | "Single Post" | "Short" | "Long Video" | "Thread";
export type ContentPillar = "Brand Awareness" | "Engagement" | "Promotion" | "Education" | "Entertainment";
export type ContentFunnel = "TOFU" | "MOFU" | "BOFU";
export type ContentStatus = "ideation" | "scripting" | "take_konten" | "editing" | "scheduled" | "published";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ContentOutlet = "atoz" | "bosa" | "bodega" | "lakers";

export interface SosmedComment {
  id: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface SosmedContent {
  id: string;
  title: string;
  platform: ContentPlatform;
  format: ContentFormat;
  duration: string;
  pillar: ContentPillar;
  funnel: ContentFunnel;
  status: ContentStatus;
  outlet: ContentOutlet;
  approval: ApprovalStatus;
  scheduledDate: string;
  productionDate?: string;
  createdAt: string;
  // Text fields
  objective: string;
  judulKeranjang: string;
  referensiKonten: string;
  screenshotUrl?: string;
  contentPreviewLink: string;
  promptTambahan: string;
  hook: string;
  visualHook: string;
  body: string;
  visualBody: string;
  cta: string;
  visualCta: string;
  caption: string;
  notes: string;
  // Approval & comments
  comments: SosmedComment[];
}

export interface CreateContentData {
  title: string;
  platform: ContentPlatform;
  format: ContentFormat;
  duration?: string;
  pillar?: ContentPillar;
  funnel?: ContentFunnel;
  status: ContentStatus;
  outlet?: ContentOutlet;
  approval: ApprovalStatus;
  scheduledDate: string;
  productionDate?: string;
  objective?: string;
  judulKeranjang?: string;
  referensiKonten?: string;
  screenshotUrl?: string;
  contentPreviewLink?: string;
  promptTambahan?: string;
  hook?: string;
  visualHook?: string;
  body?: string;
  visualBody?: string;
  cta?: string;
  visualCta?: string;
  caption?: string;
  notes?: string;
}

export interface MonthlyInsightData {
  date?: string; // used for new format
  month?: string; // used for legacy format
  reach: number;
  impressions: number;
  engagement: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  profileVisits?: number;
  followersGained?: number;
}

export interface SosmedInsight {
  content_id: string;
  reach: number;
  impressions: number;
  likes: number;
  comments_count: number;
  shares: number;
  saves: number;
  profile_visits: number;
  followers_gained: number;
}

export interface ContentStats {
  totalContent: number;
  published: number;
  scheduled: number;
  avgEngagement: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  platform: ContentPlatform;
  status: ContentStatus;
}

// ─── Status Labels & Colors ───────────────────────────────────────────────────

export const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string; bg: string }> = {
  ideation:     { label: "Ideation",     color: "text-slate-700 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-800" },
  scripting:    { label: "Scripting",    color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-100 dark:bg-violet-900/40" },
  take_konten:  { label: "Take Konten",  color: "text-sky-700 dark:text-sky-300",       bg: "bg-sky-100 dark:bg-sky-900/40" },
  editing:      { label: "Editing",      color: "text-blue-700 dark:text-blue-300",     bg: "bg-blue-100 dark:bg-blue-900/40" },
  scheduled:    { label: "Scheduled",    color: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-100 dark:bg-amber-900/40" },
  published:    { label: "Published",    color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
};

export const PLATFORM_CONFIG: Record<ContentPlatform, { label: string; color: string }> = {
  instagram: { label: "Instagram", color: "#E1306C" },
  tiktok:    { label: "TikTok",    color: "#010101" },
  youtube:   { label: "YouTube",   color: "#FF0000" },
  twitter:   { label: "X / Twitter", color: "#1DA1F2" },
  facebook:  { label: "Facebook",  color: "#1877F2" },
};

export const FUNNEL_CONFIG: Record<ContentFunnel, { label: string; color: string; bg: string }> = {
  TOFU: { label: "TOFU", color: "text-cyan-700 dark:text-cyan-300",   bg: "bg-cyan-100 dark:bg-cyan-900/40" },
  MOFU: { label: "MOFU", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/40" },
  BOFU: { label: "BOFU", color: "text-rose-700 dark:text-rose-300",   bg: "bg-rose-100 dark:bg-rose-900/40" },
};

export const KANBAN_COLUMNS: ContentStatus[] = [
  "ideation", "scripting", "take_konten", "editing", "scheduled", "published",
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

let mockContents: SosmedContent[] = [
  {
    id: "sc-001", title: "Grand Opening AtoZ September", platform: "instagram", format: "Reels",
    duration: "30s", pillar: "Brand Awareness", funnel: "TOFU", status: "published", approval: "approved", outlet: "atoz",
    scheduledDate: "2026-09-15", createdAt: "2026-09-10",
    objective: "", judulKeranjang: "", referensiKonten: "https://instagram.com", contentPreviewLink: "",
    promptTambahan: "", hook: "Ini dia tempat nongkrong terbaru!", visualHook: "Drone shot outlet",
    body: "Nikmati suasana baru di AtoZ dengan menu spesial", visualBody: "Interior walkthrough",
    cta: "Kunjungi sekarang!", visualCta: "Map + logo animation", caption: "Grand Opening AtoZ 🎉 #atoz #opening", notes: "",
    comments: [{ id: "c1", author: "Admin", message: "Sudah approved, bisa publish", timestamp: "2026-09-14T10:00:00Z" }],
  },
  {
    id: "sc-002", title: "Promo Weekend Bosa 50%", platform: "instagram", format: "Carousel",
    duration: "-", pillar: "Promotion", funnel: "BOFU", status: "scheduled", approval: "approved", outlet: "bosa",
    scheduledDate: "2026-09-22", createdAt: "2026-09-18",
    objective: "", judulKeranjang: "", referensiKonten: "https://tiktok.com", contentPreviewLink: "",
    body: "Setiap akhir pekan, nikmati diskon 50% untuk semua menu", visualBody: "Food photography grid",
    cta: "Pesan via WhatsApp", visualCta: "QR code + phone number", caption: "Weekend deals 🔥 #bosa #promo", notes: "Pastikan promo code aktif",
    comments: [],
  },
  {
    id: "sc-003", title: "Behind the Scene Chef Lakers", platform: "tiktok", format: "Short",
    duration: "60s", pillar: "Entertainment", funnel: "TOFU", status: "editing", approval: "pending",
    scheduledDate: "2026-09-25", createdAt: "2026-09-19",
    promptTambahan: "Fokus ke personality chef", hook: "Gimana sih di balik layar?", visualHook: "Quick cuts kitchen",
    body: "Hari ini kita intip proses masak menu signature Lakers", visualBody: "Close-up cooking process",
    cta: "Follow untuk konten seru!", visualCta: "Follow button CTA", caption: "Di balik layar 🍳 #lakers #bts", notes: "",
    comments: [{ id: "c2", author: "Tim Kreatif", message: "Tambah sound effect di menit 0:30", timestamp: "2026-09-20T14:30:00Z" }],
  },
  {
    id: "sc-004", title: "Tips Memilih Wine Terbaik", platform: "youtube", format: "Long Video",
    duration: "8min", pillar: "Education", funnel: "MOFU", status: "scripting", approval: "pending",
    scheduledDate: "2026-09-28", createdAt: "2026-09-17",
    promptTambahan: "Target audience: wine enthusiast pemula", hook: "Bingung pilih wine? Simak tips ini!", visualHook: "Wine pouring cinematic",
    body: "5 tips memilih wine yang cocok untuk pemula", visualBody: "Wine tasting shots + text overlay",
    cta: "Subscribe untuk tips lainnya", visualCta: "Subscribe button", caption: "Wine 101 🍷 #wine #tips #education", notes: "Panjang max 10 menit",
    comments: [],
  },
  {
    id: "sc-005", title: "Redhare Live Music Night Recap", platform: "instagram", format: "Reels",
    duration: "45s", pillar: "Entertainment", funnel: "TOFU", status: "published", approval: "approved",
    scheduledDate: "2026-09-12", createdAt: "2026-09-08",
    promptTambahan: "", hook: "Malam yang penuh energy!", visualHook: "Crowd + band shot",
    body: "Recap dari live music night kemarin di Redhare", visualBody: "Multi-angle concert footage",
    cta: "Jangan lewatkan event selanjutnya!", visualCta: "Event poster", caption: "🎵 Live music vibes #redhare #livemusic", notes: "",
    comments: [{ id: "c3", author: "Manager", message: "Bagus! Bisa pakai di story juga", timestamp: "2026-09-13T09:00:00Z" }],
  },
  {
    id: "sc-006", title: "Oombee Cocktail Tutorial", platform: "tiktok", format: "Short",
    duration: "30s", pillar: "Education", funnel: "MOFU", status: "take_konten", approval: "pending",
    scheduledDate: "2026-09-30", createdAt: "2026-09-20",
    promptTambahan: "Buat menarik dan fun", hook: "Bikin cocktail sendiri di rumah!", visualHook: "Shaker action shot",
    body: "Tutorial cocktail signature Oombee yang bisa kamu coba", visualBody: "Step by step mixing",
    cta: "Save & share ke temen kamu!", visualCta: "Save button animation", caption: "Cocktail time 🍸 #oombee #tutorial", notes: "Jangan lupa watermark",
    comments: [],
  },
  {
    id: "sc-007", title: "District 5 New Menu Launch", platform: "facebook", format: "Single Post",
    duration: "-", pillar: "Promotion", funnel: "BOFU", status: "ideation", approval: "pending",
    scheduledDate: "2026-10-01", createdAt: "2026-09-19",
    promptTambahan: "Menu baru Q4", hook: "Menu baru sudah hadir!", visualHook: "Hero shot menu",
    body: "Introducing 5 menu baru di District 5 untuk bulan Oktober", visualBody: "Flat lay food photography",
    cta: "Book your table now", visualCta: "Booking link button", caption: "New menu drop 🍽 #district5 #newmenu", notes: "Koordinasi dengan kitchen untuk foto",
    comments: [],
  },
  {
    id: "sc-008", title: "Customer Testimonial Shiraz", platform: "instagram", format: "Story",
    duration: "15s", pillar: "Engagement", funnel: "MOFU", status: "scheduled", approval: "approved",
    scheduledDate: "2026-09-23", createdAt: "2026-09-18",
    promptTambahan: "", hook: "Kata mereka tentang Shiraz", visualHook: "Customer selfie + text",
    body: "Testimoni asli dari pelanggan setia Shiraz", visualBody: "Screen record review",
    cta: "Tag teman kamu!", visualCta: "Tag button", caption: "Thank you! 💕 #shiraz #testimonial", notes: "",
    comments: [],
  },
  {
    id: "sc-009", title: "Bodega Happy Hour Announcement", platform: "twitter", format: "Thread",
    duration: "-", pillar: "Promotion", funnel: "BOFU", status: "published", approval: "approved",
    scheduledDate: "2026-09-10", createdAt: "2026-09-08",
    promptTambahan: "", hook: "Happy Hour is BACK!", visualHook: "Bold text graphic",
    body: "Setiap Senin-Jumat jam 4-7 PM, semua cocktails diskon 30%", visualBody: "Menu list graphic",
    cta: "See you there!", visualCta: "Location pin", caption: "Happy Hour 🍻 #bodega #happyhour", notes: "",
    comments: [],
  },
  {
    id: "sc-010", title: "Infinity Pool Party Teaser", platform: "tiktok", format: "Short",
    duration: "15s", pillar: "Brand Awareness", funnel: "TOFU", status: "editing", approval: "pending",
    scheduledDate: "2026-10-05", createdAt: "2026-09-21",
    promptTambahan: "Build up hype!", hook: "Something big is coming...", visualHook: "Silhouette + water splash",
    body: "Get ready for the biggest pool party of the year", visualBody: "Quick cut teaser montage",
    cta: "Stay tuned 👀", visualCta: "Countdown timer", caption: "Coming soon... 🏊 #infinity #poolparty", notes: "Music clearance needed",
    comments: [],
  },
  {
    id: "sc-011", title: "AtoZ Signature Dish Reveal", platform: "instagram", format: "Reels",
    duration: "30s", pillar: "Brand Awareness", funnel: "TOFU", status: "ideation", approval: "pending",
    scheduledDate: "2026-10-08", createdAt: "2026-09-22",
    promptTambahan: "", hook: "Menu rahasia yang bikin ketagihan!", visualHook: "Smoke reveal",
    body: "Akhirnya kita bongkar resep signature dish AtoZ", visualBody: "Close-up plating",
    cta: "Mau coba? Link di bio!", visualCta: "Link in bio animation", caption: "The secret is out 🤫 #atoz #signature", notes: "",
    comments: [],
  },
  {
    id: "sc-012", title: "Lakers Game Day Promo", platform: "instagram", format: "Story",
    duration: "15s", pillar: "Promotion", funnel: "BOFU", status: "scripting", approval: "pending",
    scheduledDate: "2026-10-02", createdAt: "2026-09-20",
    promptTambahan: "Tie in dengan jadwal NBA", hook: "Game Day = Promo Day!", visualHook: "Basketball graphic",
    body: "Tunjukkan jersey NBA kamu dan dapatkan diskon 20%", visualBody: "Lifestyle shot with jersey",
    cta: "Show your jersey today!", visualCta: "Promo code overlay", caption: "Game day deals 🏀 #lakers #gameday", notes: "",
    comments: [],
  },
  {
    id: "sc-013", title: "Bosa Rooftop Sunset Vibes", platform: "youtube", format: "Short",
    duration: "60s", pillar: "Entertainment", funnel: "TOFU", status: "take_konten", approval: "pending",
    scheduledDate: "2026-10-10", createdAt: "2026-09-22",
    promptTambahan: "Aesthetic chill vibes", hook: "Golden hour di Bosa ☀️", visualHook: "Timelapse sunset",
    body: "Nikmati sunset terbaik kota dari rooftop Bosa", visualBody: "Drone + handheld mix",
    cta: "Reserve your spot", visualCta: "Booking CTA overlay", caption: "Sunset state of mind 🌅 #bosa #rooftop", notes: "Shoot on a clear day",
    comments: [],
  },
  {
    id: "sc-014", title: "Redhare DJ Lineup Oktober", platform: "instagram", format: "Carousel",
    duration: "-", pillar: "Brand Awareness", funnel: "TOFU", status: "scripting", approval: "pending",
    scheduledDate: "2026-10-03", createdAt: "2026-09-21",
    promptTambahan: "", hook: "Oktober lineup 🔥", visualHook: "DJ photo grid",
    body: "Introducing our October DJ lineup at Redhare", visualBody: "Individual DJ portraits",
    cta: "RSVP now!", visualCta: "RSVP link button", caption: "October is going to be 🔥 #redhare #dj", notes: "Confirm all DJ names first",
    comments: [],
  },
  {
    id: "sc-015", title: "Shiraz Wine Pairing Dinner", platform: "facebook", format: "Single Post",
    duration: "-", pillar: "Promotion", funnel: "BOFU", status: "scheduled", approval: "approved",
    scheduledDate: "2026-09-27", createdAt: "2026-09-20",
    promptTambahan: "", hook: "Exclusive wine pairing experience", visualHook: "Elegant table setup",
    body: "5-course dinner with curated wine pairing at Shiraz", visualBody: "Menu card + wine bottles",
    cta: "Limited seats — book now!", visualCta: "Booking form link", caption: "Fine dining experience 🍷🍽 #shiraz #winepairing", notes: "Only 30 seats available",
    comments: [{ id: "c4", author: "Owner", message: "Pastikan harga sudah final", timestamp: "2026-09-21T16:00:00Z" }],
  },
];

// ─── Mock Engagement Data ─────────────────────────────────────────────────────

export async function getMonthlyInsightsData(filters?: { outlet?: string; month?: string; year?: string }): Promise<MonthlyInsightData[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.outlet) params.append("outlet", filters.outlet);
    if (filters?.month) params.append("month", filters.month);
    if (filters?.year) params.append("year", filters.year);

    const res = await fetch(`${API_BASE_URL}/insights/monthly?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch monthly insights");
    return res.json();
  } catch (error) {
    console.error("Error fetching monthly insights:", error);
    return [];
  }
}

// ─── API Functions ────────────────────────────────────────────────────────────

const API_BASE_URL = "https://apisosmed.atozgroupsemarang.com/api/contents";

export async function getContentStats(): Promise<ContentStats> {
  const res = await fetch(`${API_BASE_URL}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}



export async function listContents(filters?: {
  search?: string;
  platform?: ContentPlatform;
  status?: ContentStatus;
  funnel?: ContentFunnel;
  outlet?: ContentOutlet | "all";
  page?: number;
  pageSize?: number;
}): Promise<{ data: SosmedContent[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.platform) params.append("platform", filters.platform);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.funnel) params.append("funnel", filters.funnel);
  if (filters?.outlet) params.append("outlet", filters.outlet);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.pageSize) params.append("pageSize", filters.pageSize.toString());

  const res = await fetch(`${API_BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch contents");
  return res.json();
}

export async function getContentById(id: string): Promise<SosmedContent | null> {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch content");
  }
  return res.json();
}

export async function createContent(body: Omit<SosmedContent, "id" | "createdAt" | "comments">): Promise<SosmedContent> {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create content");
  return res.json();
}

export async function updateContent(id: string, body: Partial<SosmedContent>): Promise<SosmedContent | null> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to update content");
  }
  return getContentById(id);
}

export async function deleteContent(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function updateContentStatus(id: string, status: ContentStatus): Promise<SosmedContent | null> {
  return updateContent(id, { status });
}

export async function addComment(contentId: string, comment: { author: string; message: string }): Promise<SosmedComment | null> {
  const res = await fetch(`${API_BASE_URL}/${contentId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export async function getCalendarEvents(month: number, year: number, outlet?: ContentOutlet | "all", dateType: "posting" | "produksi" = "posting"): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    month: month.toString(),
    year: year.toString(),
    dateType,
  });
  if (outlet) params.append("outlet", outlet);

  const res = await fetch(`${API_BASE_URL}/calendar?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  return res.json();
}

export async function getKanbanBoard(): Promise<Record<ContentStatus, SosmedContent[]>> {
  const res = await fetch(`${API_BASE_URL}/kanban`);
  if (!res.ok) throw new Error("Failed to fetch kanban board");
  return res.json();
}

export async function getInsight(contentId: string): Promise<SosmedInsight> {
  const res = await fetch(`${API_BASE_URL}/${contentId}/insight`);
  if (!res.ok) throw new Error("Failed to fetch insight");
  return res.json();
}

export async function updateInsight(contentId: string, data: Partial<SosmedInsight>): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/${contentId}/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update insight");
  return res.json();
}
