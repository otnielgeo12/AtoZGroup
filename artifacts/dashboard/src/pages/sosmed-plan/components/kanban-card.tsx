import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { type SosmedContent, STATUS_CONFIG, FUNNEL_CONFIG } from "@/lib/sosmed-api";
import { PlatformIcon } from "./platform-icon";
import { format } from "date-fns";

interface KanbanCardProps {
  content: SosmedContent;
  onEdit: (content: SosmedContent) => void;
}

export function KanbanCard({ content, onEdit }: KanbanCardProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const funnelCfg = FUNNEL_CONFIG[content.funnel];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-card p-3 space-y-2.5 transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging
          ? "opacity-50 shadow-2xl scale-105 border-primary/50 ring-2 ring-primary/20 z-50"
          : "hover:shadow-md hover:border-primary/20"
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Drag handle indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      {/* Title */}
      <p className="text-sm font-semibold leading-tight pr-5 line-clamp-2">{content.title}</p>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <PlatformIcon platform={content.platform} size="sm" />
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${funnelCfg.bg} ${funnelCfg.color}`}>
          {funnelCfg.label}
        </span>
        {content.approval === "approved" ? (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        ) : content.approval === "rejected" ? (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            Rejected
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )}
      </div>

      {/* Footer: date + edit */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarDays className="w-3 h-3" />
          {format(new Date(content.scheduledDate), "dd MMM yyyy")}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(content); }}
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
