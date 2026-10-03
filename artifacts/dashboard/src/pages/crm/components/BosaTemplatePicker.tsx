import { Megaphone, Cake, Wine, Check, ImageIcon, Phone, AlertTriangle, Info } from "lucide-react";

// ─── Bosa Meta Templates ─────────────────────────────────────────────────────
// Didefinisikan sesuai template di WhatsApp Manager (WABA "AtoZ Group", nomor Bosa).
// Nama param HARUS sama dengan yang ada di backend api-crm (BOSA_TEMPLATES).

export type BosaTemplateKey = "promo_temp_bosa" | "hbd_template" | "spc";

export interface BosaTemplate {
  key: BosaTemplateKey;
  label: string;
  description: string;
  icon: typeof Megaphone;
  usesMessage: boolean;
  messageVar?: string;
  requiresImage: boolean;
  body: string;
  button?: string;
  accent: string;
}

const FOOTER =
  "For more information, feel free to reach out:\nPhone : 0811-278-054\nInstagram : @bosasemarang\n\nWarm regards,\nIntan\nSales & Marketing\nBosa by AtoZ";

export const BOSA_TEMPLATES: BosaTemplate[] = [
  {
    key: "promo_temp_bosa",
    label: "Promo Bosa",
    description: "Gambar + isi promo custom",
    icon: Megaphone,
    usesMessage: true,
    messageVar: "isi_promo",
    requiresImage: true,
    body: `Ciao Bosa! Dear, Mr/Ms {{name}},\n\n{{message}}\n\n${FOOTER}`,
    accent: "from-teal-500 to-cyan-500",
  },
  {
    key: "hbd_template",
    label: "Happy Birthday",
    description: "Ucapan ulang tahun + isi custom",
    icon: Cake,
    usesMessage: true,
    messageVar: "isi_hbd",
    requiresImage: true,
    body: `Happy Birthday Mr/Ms {{name}},\n\n{{message}}\n\n${FOOTER}`,
    accent: "from-pink-500 to-rose-500",
  },
  {
    key: "spc",
    label: "Special Spirits",
    description: "Teks sudah fix, cukup gambar",
    icon: Wine,
    usesMessage: false,
    requiresImage: true,
    body:
      "Ciao Bosa! Dear, Mr/Ms {{name}}\n\nCheers Intimately, Amore Overflows!\nWe’ve got something special for you — special prices on selected spirits at Bosa Semarang.\n\nIt’s the perfect opportunity to enjoy a fine drink experience in a cozy, intimate atmosphere.\n\nBook your table today and make the most of this exclusive offer!\n\n" +
      FOOTER,
    button: "Call phone number",
    accent: "from-amber-500 to-orange-500",
  },
];

export function getBosaTemplate(key: BosaTemplateKey): BosaTemplate {
  return BOSA_TEMPLATES.find((t) => t.key === key) ?? BOSA_TEMPLATES[0];
}

/** Alasan tombol "Send for Bosa" belum bisa dipakai (null = siap kirim) */
export function getBosaBlockReason(
  tpl: BosaTemplate,
  message: string,
  hasImage: boolean,
): string | null {
  if (tpl.requiresImage && !hasImage) return "Upload gambar terlebih dahulu — template ini memakai header gambar.";
  if (tpl.usesMessage && !message.trim()) return `Isi "Message Content" untuk mengisi variabel {{${tpl.messageVar}}}.`;
  return null;
}

// ─── Picker + Live Preview ───────────────────────────────────────────────────

interface BosaTemplatePickerProps {
  value: BosaTemplateKey;
  onChange: (key: BosaTemplateKey) => void;
  message: string;
  imagePreview: string | null;
  sampleName: string;
  disabled?: boolean;
}

export function BosaTemplatePicker({
  value, onChange, message, imagePreview, sampleName, disabled,
}: BosaTemplatePickerProps) {
  const tpl = getBosaTemplate(value);
  const blockReason = getBosaBlockReason(tpl, message, !!imagePreview);
  // Meta tidak mengizinkan newline di parameter → tampilkan seperti yang benar-benar terkirim
  const flatMessage = message.replace(/[\r\n\t]+/g, " ").trim();

  const renderBody = () => {
    const parts = tpl.body.split(/(\{\{name\}\}|\{\{message\}\})/g);
    return parts.map((p, i) => {
      if (p === "{{name}}") {
        return (
          <span key={i} className="font-semibold text-teal-700 bg-teal-100/70 rounded px-0.5">
            {sampleName}
          </span>
        );
      }
      if (p === "{{message}}") {
        return flatMessage ? (
          <span key={i} className="bg-amber-100/70 rounded px-0.5">{flatMessage}</span>
        ) : (
          <span key={i} className="italic text-gray-400 bg-gray-100 rounded px-0.5">
            [isi {tpl.messageVar} dari Message Content]
          </span>
        );
      }
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <div
      className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-cyan-50/40 p-3.5 space-y-3 dark:border-teal-900/60 dark:from-teal-950/30 dark:to-cyan-950/10"
      data-testid="bosa-template-picker"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">Template WhatsApp Bosa</p>
          <p className="text-[11px] text-teal-700/80 dark:text-teal-400/80">
            Dipakai khusus untuk tombol <b>Send for Bosa</b> (Meta WhatsApp API)
          </p>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-teal-200 text-teal-700 dark:bg-background dark:border-teal-800 dark:text-teal-300">
          {tpl.key}
        </span>
      </div>

      {/* Template choices */}
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pilih template Bosa">
        {BOSA_TEMPLATES.map((t) => {
          const Icon = t.icon;
          const active = t.key === value;
          return (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(t.key)}
              data-testid={`bosa-template-${t.key}`}
              className={`relative text-left rounded-lg border p-2.5 transition-all duration-200 disabled:opacity-60 ${
                active
                  ? "border-teal-500 bg-white shadow-md ring-2 ring-teal-500/20 dark:bg-background"
                  : "border-transparent bg-white/60 hover:bg-white hover:border-teal-200 hover:-translate-y-0.5 dark:bg-background/50"
              }`}
            >
              {active && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
              <span className={`inline-flex w-7 h-7 rounded-md bg-gradient-to-br ${t.accent} text-white items-center justify-center mb-1.5 shadow-sm`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs font-semibold leading-tight text-foreground">{t.label}</p>
              <p className="text-[10px] leading-snug text-muted-foreground mt-0.5">{t.description}</p>
            </button>
          );
        })}
      </div>

      {/* WhatsApp-style live preview */}
      <div className="rounded-lg bg-[#efe7dd] dark:bg-[#0b141a] p-3 max-h-[260px] overflow-y-auto">
        <div className="max-w-[88%] rounded-lg rounded-tl-none bg-white dark:bg-[#202c33] shadow-sm overflow-hidden">
          {imagePreview ? (
            <img src={imagePreview} alt="Header template" className="w-full max-h-[140px] object-cover" />
          ) : (
            <div className="h-20 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 gap-1">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px]">Header gambar (wajib)</span>
            </div>
          )}
          <p className="px-2.5 py-2 text-[12px] leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
            {renderBody()}
          </p>
          {tpl.button && (
            <div className="border-t border-gray-100 dark:border-gray-700 py-1.5 text-center text-[12px] font-medium text-sky-600 flex items-center justify-center gap-1">
              <Phone className="w-3 h-3" />
              {tpl.button}
            </div>
          )}
        </div>
      </div>

      {/* Status / validation hint */}
      {blockReason ? (
        <p className="text-[11px] flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
          {blockReason}
        </p>
      ) : (
        <p className="text-[11px] flex items-start gap-1.5 text-teal-700 dark:text-teal-400">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          {tpl.usesMessage
            ? "Siap dikirim. Baris baru pada pesan akan digabung jadi satu paragraf (aturan Meta)."
            : "Siap dikirim. Isi pesan template ini sudah fix dari Meta, Message Content tidak dipakai."}
        </p>
      )}
    </div>
  );
}
