import { useState, useCallback, useEffect } from "react";
import { Plus, LayoutDashboard, CalendarDays, Database, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  createContent, updateContent, addComment, getContentById,
  type SosmedContent,
} from "@/lib/sosmed-api";
import { SosmedDashboard } from "./dashboard";
import { SosmedCalendar } from "./calendar";
import { SosmedContentTable } from "./content";
import { SosmedKanban } from "./kanban";
import { SosmedGrid } from "./grid";
import { ContentModal } from "./components/content-modal";

const TAB_ITEMS = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "calendar", label: "Kalender", icon: CalendarDays },
  { value: "content", label: "Konten", icon: Database },
  { value: "kanban", label: "Kanban", icon: Columns3 },
  { value: "grid", label: "Grid", icon: LayoutDashboard },
];

export default function SosmedPlanPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<SosmedContent | null>(null);
  const [initialDate, setInitialDate] = useState<Date | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // Read tab from URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && TAB_ITEMS.some(t => t.value === tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  const handleNewContent = () => {
    setEditingContent(null);
    setInitialDate(undefined);
    setModalOpen(true);
  };
  
  const handleDayClick = (date: Date) => {
    setEditingContent(null);
    setInitialDate(date);
    setModalOpen(true);
  };

  const handleEdit = useCallback(async (content: SosmedContent) => {
    const fullContent = await getContentById(content.id);
    setEditingContent(fullContent || content);
    setModalOpen(true);
  }, []);

  const handleCalendarEventClick = useCallback(async (id: string) => {
    const content = await getContentById(id);
    if (content) {
      setEditingContent(content);
      setModalOpen(true);
    }
  }, []);

  const handleSave = async (data: Partial<SosmedContent>) => {
    try {
      if (data.id) {
        await updateContent(data.id, data);
        toast.success("Konten berhasil diperbarui ✨");
      } else {
        await createContent(data as any);
        toast.success("Konten baru berhasil dibuat 🎉");
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error("Gagal menyimpan konten");
    }
  };

  const handleAddComment = async (contentId: string, message: string) => {
    await addComment(contentId, { author: "You", message });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sosmed Plan</h1>
          <p className="text-muted-foreground mt-1">Kelola dan jadwalkan konten sosial media Anda.</p>
        </div>
        <Button onClick={handleNewContent} className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
          <Plus className="w-4 h-4" /> Konten Baru
        </Button>
      </div>

      {/* ─── Tabs ─── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-muted/50 p-1 rounded-lg border border-border">
          {TAB_ITEMS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-2 data-[state=active]:shadow-sm data-[state=active]:bg-background"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <SosmedDashboard key={`dash-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <SosmedCalendar key={`cal-${refreshKey}`} onEventClick={handleCalendarEventClick} onDayClick={handleDayClick} />
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <SosmedContentTable key={`content-${refreshKey}`} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <SosmedKanban key={`kanban-${refreshKey}`} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="grid" className="mt-6">
          <SosmedGrid key={`grid-${refreshKey}`} onEdit={handleEdit} />
        </TabsContent>
      </Tabs>

      {/* ─── Content Modal ─── */}
      <ContentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        content={editingContent}
        onSave={handleSave}
        onAddComment={handleAddComment}
        initialDate={initialDate}
      />
    </div>
  );
}
