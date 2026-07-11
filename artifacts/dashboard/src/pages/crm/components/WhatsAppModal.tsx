import { useState, useRef } from "react";
import { MessageCircle, ImagePlus, X, Send, Loader2, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import {
  sendWhatsAppAtoZ,
  sendWhatsAppBosa,
  sendWhatsAppBodega,
  sendWhatsAppLakers,
  sendWhatsAppRedhare,
  sendWhatsAppOombee,
  sendWhatsAppShiraz,
  sendWhatsAppDistrict5,
  sendWhatsAppInfinity,
  type CustomerListItem,
} from "@/lib/crm-api";

// ─── Types & Config ───────────────────────────────────────────────────────────

interface WhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomers: CustomerListItem[];
  onClearSelection: () => void;
}

type BrandKey = "AtoZ" | "Bosa" | "Bodega" | "Lakers" | "Redhare" | "Oombee" | "Shiraz" | "District5" | "Infinity";

interface BrandItem {
  key: BrandKey;
  label: string;
  group: "fnb" | "entertainment";
  className: string;
}

const ALL_BRANDS: BrandItem[] = [
  // F&B Group
  { key: "AtoZ", label: "Send for AtoZ", group: "fnb", className: "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-emerald-500/20" },
  { key: "Bosa", label: "Send for Bosa", group: "fnb", className: "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-teal-500/20" },
  { key: "Bodega", label: "Send for Bodega", group: "fnb", className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-500/20" },
  { key: "Lakers", label: "Send for Lakers", group: "fnb", className: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-amber-500/20" },
  // Entertainment Group
  { key: "Redhare", label: "Send for Redhare", group: "entertainment", className: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-rose-500/20" },
  { key: "Oombee", label: "Send for Oombee", group: "entertainment", className: "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-purple-500/20" },
  { key: "Shiraz", label: "Send for Shiraz", group: "entertainment", className: "bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white border-fuchsia-500/20" },
  { key: "District5", label: "Send for District 5", group: "entertainment", className: "bg-gradient-to-r from-indigo-600 to-slate-700 hover:from-indigo-700 hover:to-slate-800 text-white border-indigo-500/20" },
  { key: "Infinity", label: "Send for Infinity", group: "entertainment", className: "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-cyan-500/20" },
];

// ─── WhatsAppModal ────────────────────────────────────────────────────────────

export function WhatsAppModal({
  open, onOpenChange, selectedCustomers, onClearSelection,
}: WhatsAppModalProps) {
  const { isSuperAdmin, isFnbAdmin, isEntertainmentAdmin } = useAuth();
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sendingBrand, setSendingBrand] = useState<BrandKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter based on admin role (just like in Outlets page)
  const showFnb = isSuperAdmin || isFnbAdmin || (!isFnbAdmin && !isEntertainmentAdmin); // superadmin or legacy admin sees all
  const showEntertainment = isSuperAdmin || isEntertainmentAdmin || (!isFnbAdmin && !isEntertainmentAdmin);

  const fnbBrands = ALL_BRANDS.filter(b => b.group === "fnb");
  const entertainmentBrands = ALL_BRANDS.filter(b => b.group === "entertainment");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendBrand = async (brand: BrandKey) => {
    setSendingBrand(brand);
    try {
      const payload = {
        recipients: selectedCustomers,
        message,
        imageFile: imageFile ?? undefined,
      };

      switch (brand) {
        case "AtoZ":      await sendWhatsAppAtoZ(payload); break;
        case "Bosa":      await sendWhatsAppBosa(payload); break;
        case "Bodega":    await sendWhatsAppBodega(payload); break;
        case "Lakers":    await sendWhatsAppLakers(payload); break;
        case "Redhare":   await sendWhatsAppRedhare(payload); break;
        case "Oombee":    await sendWhatsAppOombee(payload); break;
        case "Shiraz":    await sendWhatsAppShiraz(payload); break;
        case "District5": await sendWhatsAppDistrict5(payload); break;
        case "Infinity":  await sendWhatsAppInfinity(payload); break;
      }

      alert(
        `[${brand}] WhatsApp API belum terhubung (masih dalam tahap pembuatan / kosong).\n\nPesan siap dikirim ke ${selectedCustomers.length} customer melalui akun ${brand}.`
      );
      setMessage("");
      removeImage();
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to send WhatsApp for ${brand}:`, error);
      alert(`Gagal mengirim pesan untuk ${brand}.`);
    } finally {
      setSendingBrand(null);
    }
  };

  const recipientCount = selectedCustomers.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-400">
              <MessageCircle className="w-5 h-5" />
            </span>
            Send WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Compose a promotional message to send to selected customers via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">

          {/* Recipients summary */}
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-900/50 dark:bg-green-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  {recipientCount} Recipient{recipientCount !== 1 ? "s" : ""} Selected
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                onClick={onClearSelection}
              >
                <Trash2 className="w-3 h-3 mr-1" />Clear
              </Button>
            </div>

            {/* Show first few names */}
            {recipientCount > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedCustomers.slice(0, 5).map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white border border-green-200 text-green-800 dark:bg-background dark:border-green-800 dark:text-green-300"
                  >
                    <span className="w-4 h-4 rounded-full bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                      {c.fullName[0]?.toUpperCase()}
                    </span>
                    <span className="truncate max-w-[100px]">{c.fullName}</span>
                    <span className="text-green-400">•</span>
                    <span className="text-[10px] text-green-600 dark:text-green-400 tabular-nums">{c.phone}</span>
                  </span>
                ))}
                {recipientCount > 5 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white border border-green-200 text-green-600 font-medium dark:bg-background dark:border-green-800 dark:text-green-400">
                    +{recipientCount - 5} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Message content */}
          <div className="space-y-2">
            <Label htmlFor="wa-message" className="text-sm font-medium">
              Message Content
            </Label>
            <Textarea
              id="wa-message"
              placeholder="Type your promotional message here...\n\nExample:\nHi {{name}}, we have a special promo just for you! 🎉\nVisit us this weekend and get 20% off."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-y"
              data-testid="wa-message-input"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: Use <code className="px-1 py-0.5 bg-muted rounded text-xs">{`{{name}}`}</code> to personalize the message with each customer's name.
            </p>
          </div>

          {/* Image / Voucher upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Promotional Image / Voucher
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>

            {imagePreview ? (
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30 group">
                <img
                  src={imagePreview}
                  alt="Promotional preview"
                  className="w-full max-h-[200px] object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  onClick={removeImage}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
                <div className="px-3 py-2 bg-muted/80 border-t text-xs text-muted-foreground flex items-center justify-between">
                  <span className="truncate">{imageFile?.name ?? "Uploaded image"}</span>
                  <span>{imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ""}</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-green-400 hover:bg-green-50/30 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer group"
                data-testid="wa-image-upload"
              >
                <div className="p-2 rounded-full bg-muted group-hover:bg-green-100 transition-colors dark:group-hover:bg-green-950">
                  <ImagePlus className="w-5 h-5 text-muted-foreground group-hover:text-green-600 transition-colors dark:group-hover:text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-green-700 transition-colors dark:group-hover:text-green-300">
                    Click to upload image
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    PNG, JPG, or GIF up to 5MB
                  </p>
                </div>
              </button>
            )}

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
              data-testid="wa-image-input"
            />
          </div>

          {/* Send Action Section: Brand Buttons Filtered by Role */}
          <div className="pt-4 border-t mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                <Send className="w-4 h-4 text-green-600 dark:text-green-400" />
                Select Sender Brand ({recipientCount} recipients)
              </Label>
              <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                API Under Construction
              </span>
            </div>

            {/* F&B Group */}
            {showFnb && (
              <div className="space-y-2">
                {showEntertainment && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                    F&B Group
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  {fnbBrands.map((b) => (
                    <Button
                      key={b.key}
                      type="button"
                      className={`shadow-sm h-11 font-medium transition-all duration-200 hover:shadow hover:scale-[1.01] active:scale-[0.99] border ${b.className}`}
                      disabled={!message.trim() || recipientCount === 0 || sendingBrand !== null}
                      onClick={() => handleSendBrand(b.key)}
                      data-testid={`wa-send-${b.key.toLowerCase()}`}
                    >
                      {sendingBrand === b.key ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending {b.key}…</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2 opacity-90" />{b.label}</>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Entertainment Group */}
            {showEntertainment && (
              <div className="space-y-2">
                {showFnb && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                    Entertainment Group
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {entertainmentBrands.map((b) => (
                    <Button
                      key={b.key}
                      type="button"
                      className={`shadow-sm h-11 font-medium transition-all duration-200 hover:shadow hover:scale-[1.01] active:scale-[0.99] border ${b.className}`}
                      disabled={!message.trim() || recipientCount === 0 || sendingBrand !== null}
                      onClick={() => handleSendBrand(b.key)}
                      data-testid={`wa-send-${b.key.toLowerCase()}`}
                    >
                      {sendingBrand === b.key ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending {b.key}…</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2 opacity-90" />{b.label}</>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={sendingBrand !== null}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

