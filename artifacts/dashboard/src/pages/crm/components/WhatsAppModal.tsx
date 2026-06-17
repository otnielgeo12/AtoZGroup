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
import type { CustomerListItem } from "@/lib/crm-api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomers: CustomerListItem[];
  onClearSelection: () => void;
}

// ─── WhatsAppModal ────────────────────────────────────────────────────────────

export function WhatsAppModal({
  open, onOpenChange, selectedCustomers, onClearSelection,
}: WhatsAppModalProps) {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async () => {
    setIsSending(true);
    // TODO: Connect to WhatsApp API when ready
    // For now simulate a short delay then show alert
    await new Promise(res => setTimeout(res, 1500));
    setIsSending(false);
    alert(
      `WhatsApp API belum terhubung.\n\nPesan akan dikirim ke ${selectedCustomers.length} customer setelah API WhatsApp siap.`
    );
    // Reset state
    setMessage("");
    removeImage();
    onOpenChange(false);
  };

  const recipientCount = selectedCustomers.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-green-100 text-green-600">
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
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
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
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white border border-green-200 text-green-800"
                  >
                    <span className="w-4 h-4 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                      {c.fullName[0]?.toUpperCase()}
                    </span>
                    <span className="truncate max-w-[100px]">{c.fullName}</span>
                    <span className="text-green-400">•</span>
                    <span className="text-[10px] text-green-600 tabular-nums">{c.phone}</span>
                  </span>
                ))}
                {recipientCount > 5 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white border border-green-200 text-green-600 font-medium">
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
                <div className="p-2 rounded-full bg-muted group-hover:bg-green-100 transition-colors">
                  <ImagePlus className="w-5 h-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-green-700 transition-colors">
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
        </div>

        <DialogFooter className="pt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
            disabled={!message.trim() || recipientCount === 0 || isSending}
            onClick={handleSend}
            data-testid="wa-send-button"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message ({recipientCount})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
