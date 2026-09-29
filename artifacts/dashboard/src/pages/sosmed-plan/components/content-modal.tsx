import { useState, useEffect } from "react";
import { Sparkles, Send, Check, X, Maximize2, Link as LinkIcon, Edit3, Image as ImageIcon, Megaphone, FileText, ClipboardList, Copy, CheckCircle, Clock, User } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  type SosmedContent, type ContentPlatform, type ContentFormat, type ContentPillar,
  type ContentFunnel, type ContentStatus, type ApprovalStatus, type SosmedComment, type ContentOutlet
} from "@/lib/sosmed-api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content?: SosmedContent | null;
  onSave: (data: Partial<SosmedContent>) => void;
  onAddComment?: (contentId: string, message: string) => void;
  initialDate?: Date;
}

// ─── Form defaults ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "", platform: "instagram" as ContentPlatform, format: "Reels" as ContentFormat,
  duration: "", pillar: "Brand Awareness" as ContentPillar, funnel: "TOFU" as ContentFunnel,
  status: "ideation" as ContentStatus, approval: "pending" as ApprovalStatus, outlet: "atoz" as ContentOutlet,
  scheduledDate: new Date().toISOString().split("T")[0],
  productionDate: "",
  objective: "", judulKeranjang: "", referensiKonten: "", contentPreviewLink: "",
  promptTambahan: "", hook: "", visualHook: "", body: "", visualBody: "",
  cta: "", visualCta: "", caption: "", notes: "", screenshotUrl: "",
};

const PLATFORMS: ContentPlatform[] = ["instagram", "tiktok", "youtube", "twitter", "facebook"];
const FORMATS: ContentFormat[] = ["Reels", "Story", "Carousel", "Single Post", "Short", "Long Video", "Thread"];
const PILLARS: ContentPillar[] = ["Brand Awareness", "Engagement", "Promotion", "Education", "Entertainment"];
const FUNNELS: ContentFunnel[] = ["TOFU", "MOFU", "BOFU"];
const STATUSES: ContentStatus[] = ["ideation", "scripting", "take_konten", "editing", "scheduled", "published"];
const OUTLETS: ContentOutlet[] = ["atoz", "bosa", "bodega", "lakers"];

// ─── Helper Components ────────────────────────────────────────────────────────

const FieldLabel = ({ children, icon: Icon, rightAction, iconColor = "text-muted-foreground", ...props }: any) => (
  <div className="flex items-center justify-between mb-2">
    <Label className="text-xs font-bold text-muted-foreground tracking-wide flex items-center gap-2 uppercase" {...props}>
      {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      {children}
    </Label>
    {rightAction}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentModal({ open, onOpenChange, content, onSave, onAddComment, initialDate }: ContentModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<SosmedComment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const isEdit = !!content;

  useEffect(() => {
    if (content) {
      setForm({
        title: content.title, platform: content.platform, format: content.format,
        duration: content.duration, pillar: content.pillar, funnel: content.funnel,
        status: content.status, approval: content.approval, outlet: content.outlet || "atoz",
        scheduledDate: content.scheduledDate, productionDate: content.productionDate || "",
        objective: content.objective || "", judulKeranjang: content.judulKeranjang || "",
        referensiKonten: content.referensiKonten || "", contentPreviewLink: content.contentPreviewLink || "",
        promptTambahan: content.promptTambahan, hook: content.hook,
        visualHook: content.visualHook, body: content.body, visualBody: content.visualBody,
        cta: content.cta, visualCta: content.visualCta, caption: content.caption, notes: content.notes,
        screenshotUrl: content.screenshotUrl || "",
      });
      setComments(content.comments || []);
    } else {
      setForm({
        ...EMPTY_FORM,
        scheduledDate: initialDate ? format(initialDate, "yyyy-MM-dd") : EMPTY_FORM.scheduledDate,
        productionDate: ""
      });
      setComments([]);
    }
  }, [content, open, initialDate]);

  const handleField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Judul konten harus diisi");
      return;
    }
    onSave({ ...form, id: content?.id });
    onOpenChange(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: SosmedComment = {
      id: `cm-${Date.now()}`, author: "You", message: commentText,
      timestamp: new Date().toISOString(),
    };
    setComments(prev => [...prev, newComment]);
    if (content?.id && onAddComment) onAddComment(content.id, commentText);
    setCommentText("");
  };

  const handleApproval = (status: ApprovalStatus) => {
    setForm(prev => {
      if (status === "approved") {
        const currentIndex = STATUSES.indexOf(prev.status);
        // If not the last phase, advance to the next phase automatically
        if (currentIndex < STATUSES.length - 1) {
          toast.success(`Fase ${getStatusLabel(prev.status)} disetujui ✅ Lanjut ke ${getStatusLabel(STATUSES[currentIndex + 1])}`);
          return { ...prev, status: STATUSES[currentIndex + 1], approval: "pending" };
        }
        // If it's already the last phase (published)
        toast.success("Konten telah selesai dan dipublikasikan 🎉");
        return { ...prev, approval: "approved" };
      }
      
      // If rejected
      toast.error("Fase ditolak ❌");
      return { ...prev, approval: status };
    });
  };

  const handleGenerateAI = () => {
    toast.info("🤖 AI Generate sedang dalam pengembangan...");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://apisosmed.atozgroupsemarang.com/api/contents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload gagal");
      const data = await res.json();
      
      handleField("screenshotUrl", data.url);
      toast.success("Screenshot berhasil diunggah!");
    } catch (err) {
      toast.error("Gagal mengunggah gambar");
      console.error(err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Convert status to display text
  const getStatusLabel = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit Konten" : "Konten Baru"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-8">

            {/* ─── Top Section: Grid Meta ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <FieldLabel>JUDUL / TOPIK <span className="text-destructive">*</span></FieldLabel>
                <Input value={form.title} onChange={(e: any) => handleField("title", e.target.value)} placeholder="Contoh: Promo Spesial" className="bg-muted/30" />
              </div>
              <div>
                <FieldLabel>PLATFORM <span className="text-destructive">*</span></FieldLabel>
                <Select value={form.platform} onValueChange={v => handleField("platform", v)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel>OUTLET <span className="text-destructive">*</span></FieldLabel>
                <Select value={form.outlet} onValueChange={v => handleField("outlet", v)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTLETS.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel>FORMAT KONTEN</FieldLabel>
                <Select value={form.format} onValueChange={v => handleField("format", v)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>DURASI / SLIDE</FieldLabel>
                <Input value={form.duration} onChange={(e: any) => handleField("duration", e.target.value)} placeholder="Contoh: 60s atau 10 slides" className="bg-muted/30" />
              </div>

              <div>
                <FieldLabel>PILAR KONTEN</FieldLabel>
                <Select value={form.pillar} onValueChange={v => handleField("pillar", v)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="-- Pilih --" />
                  </SelectTrigger>
                  <SelectContent>
                    {PILLARS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>FUNNEL</FieldLabel>
                <Select value={form.funnel} onValueChange={v => handleField("funnel", v)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="-- Pilih --" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNNELS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel>OBJECTIVE</FieldLabel>
                <Select value={form.objective} onValueChange={v => handleField("objective", v)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="-- Pilih --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">Awareness</SelectItem>
                    <SelectItem value="consideration">Consideration</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>STATUS</FieldLabel>
                <Select value={form.status} onValueChange={v => handleField("status", v)}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`w-3.5 h-3.5 ${s === 'published' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                          {getStatusLabel(s)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>TANGGAL PRODUKSI</FieldLabel>
                  <Input type="date" value={form.productionDate || ""} onChange={(e: any) => handleField("productionDate", e.target.value)} className="bg-muted/30" />
                </div>
                <div>
                  <FieldLabel>TANGGAL POSTING</FieldLabel>
                  <Input type="date" value={form.scheduledDate} onChange={(e: any) => handleField("scheduledDate", e.target.value)} className="bg-muted/30" />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <FieldLabel>JUDUL KERANJANG</FieldLabel>
                <Input value={form.judulKeranjang} onChange={(e: any) => handleField("judulKeranjang", e.target.value)} placeholder="Contoh: Paket Growth Content Planner" className="bg-muted/30" />
              </div>
              <div>
                <FieldLabel>REFERENSI KONTEN</FieldLabel>
                <Input value={form.referensiKonten} onChange={(e: any) => handleField("referensiKonten", e.target.value)} placeholder="https://..." className="bg-muted/30" />
              </div>
              <div>
                <FieldLabel icon={ImageIcon}>GAMBAR SCREENSHOT (OPSIONAL)</FieldLabel>
                <p className="text-xs text-muted-foreground mb-2">Unggah screenshot konten jika link referensi tidak memunculkan gambar dengan baik.</p>
                
                {form.screenshotUrl ? (
                  <div className="relative rounded-md overflow-hidden border border-border aspect-video max-w-sm group">
                    <img src={form.screenshotUrl} alt="Screenshot" className="w-full h-full object-cover" />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleField("screenshotUrl", "")}
                    >
                      <X className="w-4 h-4 mr-1" /> Hapus
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-md aspect-video max-w-sm flex flex-col items-center justify-center text-muted-foreground bg-muted/20 relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
                    <span className="text-sm font-medium">{isUploading ? "Mengunggah..." : "Pilih Gambar"}</span>
                    <span className="text-xs opacity-60 mt-1">Klik atau seret file ke sini</span>
                  </div>
                )}
              </div>
            </div>



            <div>
              <FieldLabel icon={LinkIcon}>CONTENT PREVIEW LINK</FieldLabel>
              <Input value={form.contentPreviewLink} onChange={(e: any) => handleField("contentPreviewLink", e.target.value)} placeholder="Google Drive, TikTok, Instagram, atau YouTube link" className="bg-muted/30" />
            </div>

            {/* ─── Editor Grid ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Hook */}
              <div className="rounded-xl border bg-card/50 shadow-sm p-4 flex flex-col">
                <FieldLabel icon={Edit3} rightAction={<Button variant="ghost" size="icon" className="h-6 w-6"><Maximize2 className="w-3.5 h-3.5 text-muted-foreground"/></Button>}>
                  HOOK / OPENING
                </FieldLabel>
                <Textarea value={form.hook} onChange={(e: any) => handleField("hook", e.target.value)} placeholder="Kalimat pembuka yang bikin penonton berhenti scroll..." className="flex-1 bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[80px] shadow-none" />
              </div>
              <div className="rounded-xl border bg-card/50 shadow-sm p-4 flex flex-col">
                <FieldLabel icon={ImageIcon} iconColor="text-amber-500">VISUAL (HOOK)</FieldLabel>
                <Textarea value={form.visualHook} onChange={(e: any) => handleField("visualHook", e.target.value)} placeholder="Referensi adegan untuk Hook..." className="flex-1 bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[80px] shadow-none" />
              </div>

              {/* Body */}
              <div className="rounded-xl border bg-card/50 shadow-sm p-4 flex flex-col">
                <FieldLabel icon={FileText} rightAction={<Button variant="ghost" size="icon" className="h-6 w-6"><Maximize2 className="w-3.5 h-3.5 text-muted-foreground"/></Button>}>
                  BODY (NASKAH)
                </FieldLabel>
                <Textarea value={form.body} onChange={(e: any) => handleField("body", e.target.value)} placeholder="Tulis naskah atau outline konten utama di sini..." className="flex-1 bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[80px] shadow-none" />
              </div>
              <div className="rounded-xl border bg-card/50 shadow-sm p-4 flex flex-col">
                <FieldLabel icon={ImageIcon} iconColor="text-amber-500">VISUAL (BODY)</FieldLabel>
                <Textarea value={form.visualBody} onChange={(e: any) => handleField("visualBody", e.target.value)} placeholder="Referensi visual untuk body konten..." className="flex-1 bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[80px] shadow-none" />
              </div>

              {/* CTA */}
              <div className="rounded-xl border bg-card/50 shadow-sm p-4 flex flex-col">
                <FieldLabel icon={Megaphone} rightAction={<Button variant="ghost" size="icon" className="h-6 w-6"><Maximize2 className="w-3.5 h-3.5 text-muted-foreground"/></Button>}>
                  CTA
                </FieldLabel>
                <Textarea value={form.cta} onChange={(e: any) => handleField("cta", e.target.value)} placeholder="Like, follow, comment, save, klik link bio..." className="flex-1 bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[60px] shadow-none" />
              </div>
              <div className="rounded-xl border bg-card/50 shadow-sm p-4 flex flex-col">
                <FieldLabel icon={ImageIcon} iconColor="text-amber-500">VISUAL (CTA)</FieldLabel>
                <Textarea value={form.visualCta} onChange={(e: any) => handleField("visualCta", e.target.value)} placeholder="Visual yang menarik untuk call to action..." className="flex-1 bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[60px] shadow-none" />
              </div>
            </div>

            {/* ─── Caption & Notes ─── */}
            <div className="rounded-xl border bg-card/50 shadow-sm p-4">
              <FieldLabel icon={Edit3} rightAction={<Button variant="ghost" size="icon" className="h-6 w-6"><Maximize2 className="w-3.5 h-3.5 text-muted-foreground"/></Button>}>
                CAPTION
              </FieldLabel>
              <Textarea value={form.caption} onChange={(e: any) => handleField("caption", e.target.value)} placeholder="Sematkan hashtag, tagar, dan deskripsi postingan..." className="bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[80px] shadow-none" />
            </div>

            <div className="rounded-xl border bg-card/50 shadow-sm p-4">
              <FieldLabel icon={ClipboardList} rightAction={<Button variant="ghost" size="icon" className="h-6 w-6"><Maximize2 className="w-3.5 h-3.5 text-muted-foreground"/></Button>}>
                CATATAN / NOTES
              </FieldLabel>
              <Textarea value={form.notes} onChange={(e: any) => handleField("notes", e.target.value)} placeholder="Catatan opsional untuk properti, arahan produksi, atau detail tambahan konten..." className="bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[80px] shadow-none" />
              <div className="flex justify-end mt-2">
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded">Internal Team</span>
              </div>
            </div>

            {/* ─── Approval Section ─── */}
            <div className="pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide">Approval & History</h3>
                  <p className="text-xs text-muted-foreground mt-1">Fase berjalan: {getStatusLabel(form.status)}</p>
                </div>
                
                {form.approval === "approved" ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-md text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved
                  </div>
                ) : form.approval === "rejected" ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive rounded-md text-xs font-semibold">
                    <X className="w-3.5 h-3.5" /> Rejected
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-md text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => handleApproval("approved")} 
                className="w-full gap-2 h-11"
                disabled={form.status === "published" && form.approval === "approved"}
                type="button"
              >
                <Check className="w-4 h-4" /> 
                {form.status === "published" && form.approval === "approved" ? "Selesai & Dipublikasikan" : `Approve Fase ${getStatusLabel(form.status)}`}
              </Button>
            </div>

            {/* ─── Comments Section ─── */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Komentar Tim</h3>
              
              {comments.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground border rounded-xl bg-muted/20 dashed">
                  Belum ada komentar aktif.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{c.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(c.timestamp), "dd MMM, HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 mt-1">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <Textarea
                  value={commentText} onChange={(e: any) => setCommentText(e.target.value)}
                  placeholder="Tulis komentar/revisi..."
                  className="min-h-[100px] pb-12 bg-muted/30"
                  onKeyDown={(e: any) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAddComment())}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddComment} 
                  disabled={!commentText.trim()} 
                  className="absolute bottom-3 right-3 h-8 text-xs font-medium"
                >
                  Kirim
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Footer Buttons ─── */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Copy className="w-4 h-4" /> Duplicate
            </Button>
            <Button onClick={handleSave}>
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
