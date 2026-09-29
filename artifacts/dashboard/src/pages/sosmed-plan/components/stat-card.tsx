import { TrendingUp, TrendingDown } from "lucide-react";

interface SosmedStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
}

export function SosmedStatCard({
  title, value, icon, iconColor, change, changeType = "neutral", subtitle,
}: SosmedStatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group">
      {/* Decorative gradient blob */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20 ${iconColor}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {(change || subtitle) && (
            <div className="flex items-center gap-2">
              {change && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                  changeType === "positive"
                    ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40"
                    : changeType === "negative"
                    ? "text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-950/40"
                    : "text-muted-foreground bg-muted"
                }`}>
                  {changeType === "positive" ? <TrendingUp className="w-3 h-3" /> : changeType === "negative" ? <TrendingDown className="w-3 h-3" /> : null}
                  {change}
                </span>
              )}
              {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${iconColor} text-white shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
