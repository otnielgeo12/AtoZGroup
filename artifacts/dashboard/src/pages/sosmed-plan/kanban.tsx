import { useState, useEffect } from "react";
import {
  DndContext, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getKanbanBoard, updateContentStatus,
  type SosmedContent, type ContentStatus, STATUS_CONFIG, KANBAN_COLUMNS,
} from "@/lib/sosmed-api";
import { KanbanCard } from "./components/kanban-card";
import { toast } from "sonner";

// ─── Droppable Column ─────────────────────────────────────────────────────────

function KanbanColumn({
  status, items, onEdit,
}: {
  status: ContentStatus;
  items: SosmedContent[];
  onEdit: (content: SosmedContent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] w-full shrink-0">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg border border-b-0 border-border ${cfg.bg}`}>
        <span className={`w-2 h-2 rounded-full ${
          status === "ideation" ? "bg-slate-500" :
          status === "scripting" ? "bg-violet-500" :
          status === "take_konten" ? "bg-sky-500" :
          status === "editing" ? "bg-blue-500" :
          status === "scheduled" ? "bg-amber-500" :
          "bg-emerald-500"
        }`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className="ml-auto text-[10px] font-semibold text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 rounded-b-lg border border-border bg-muted/10 min-h-[200px] transition-all duration-200 ${
          isOver ? "bg-primary/5 border-primary/30 ring-2 ring-primary/10" : ""
        }`}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <KanbanCard key={item.id} content={item} onEdit={onEdit} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-border/50 text-xs text-muted-foreground/40">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Kanban Board ────────────────────────────────────────────────────────

export function SosmedKanban({ onEdit }: { onEdit: (content: SosmedContent) => void }) {
  const [board, setBoard] = useState<Record<ContentStatus, SosmedContent[]>>({
    ideation: [], scripting: [], take_konten: [], editing: [], scheduled: [], published: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<SosmedContent | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getKanbanBoard();
      setBoard(data);
      setLoading(false);
    }
    load();
  }, []);

  const findContainerOfItem = (id: string): ContentStatus | null => {
    for (const col of KANBAN_COLUMNS) {
      if (board[col].some(item => item.id === id)) return col;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const container = findContainerOfItem(active.id as string);
    if (container) {
      const item = board[container].find(i => i.id === active.id);
      setActiveItem(item || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainerOfItem(active.id as string);
    const overId = over.id as string;

    // Determine target container
    let overContainer: ContentStatus | null = null;
    if (KANBAN_COLUMNS.includes(overId as ContentStatus)) {
      overContainer = overId as ContentStatus;
    } else {
      overContainer = findContainerOfItem(overId);
    }

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    // Move item between columns
    setBoard(prev => {
      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer!]];
      const activeIdx = activeItems.findIndex(i => i.id === active.id);
      if (activeIdx === -1) return prev;

      const [movedItem] = activeItems.splice(activeIdx, 1);
      movedItem.status = overContainer!;
      overItems.push(movedItem);

      return { ...prev, [activeContainer]: activeItems, [overContainer!]: overItems };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active } = event;
    setActiveItem(null);

    // Persist the status change
    const newContainer = findContainerOfItem(active.id as string);
    if (newContainer) {
      await updateContentStatus(active.id as string, newContainer);
      toast.success(`Dipindahkan ke ${STATUS_CONFIG[newContainer].label}`);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(col => (
          <div key={col} className="min-w-[260px] space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn
            key={col}
            status={col}
            items={board[col]}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem && (
          <div className="opacity-90 rotate-2 scale-105">
            <KanbanCard content={activeItem} onEdit={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
