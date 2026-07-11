import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Upload, X, Loader2, ImagePlus, Sparkles,
} from "lucide-react";

import { createLady, updateLady, getLady, ladiesKeys } from "@/lib/ladies-api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const isLadyActive = (val: any) => val !== false && val !== 0 && val !== "0" && val !== "false" && val !== null && val !== undefined;

// ─── Form Schema ────────────────────────────────────────────────────────────
const ladySchema = z.object({
  name:         z.string().min(1, "Name is required"),
  age:          z.coerce.number().min(18, "Must be at least 18").max(60, "Max age is 60"),
  category:     z.enum(["sapphire", "diamond", "spahiere"], { required_error: "Category is required" }),
  description:  z.string().optional(),
  height:       z.string().optional(),
  weight:       z.string().optional(),
  is_active:    z.boolean().optional().default(true),
});

type LadyFormValues = z.infer<typeof ladySchema>;

const OUTLET_NAMES: Record<string, string> = {
  district5: "District5",
  infinity: "Infinity",
};

export default function AddLadyPage() {
  const [matchAdd, paramsAdd] = useRoute("/ladies/:outlet/add");
  const [matchEdit, paramsEdit] = useRoute("/ladies/:outlet/edit/:id");

  const isEdit = !!matchEdit;
  const outlet = paramsAdd?.outlet || paramsEdit?.outlet || "district5";
  const editId = paramsEdit?.id ? parseInt(paramsEdit.id) : null;
  const outletName = OUTLET_NAMES[outlet] || outlet;

  const [, setLocation] = useLocation();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Photo Upload State ──────────────────────────────────────────────────
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{ id: number; url: string }[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LADIES_API_URL = import.meta.env.VITE_LADIES_API_URL || "https://apid5.atozgroupsemarang.com";

  // ── Load existing lady for edit ─────────────────────────────────────────
  const { isLoading: isLoadingLady, data: ladyData } = useQuery({
    queryKey: ladiesKeys.detail(editId || 0),
    queryFn: () => getLady(editId!, getToken),
    enabled: isEdit && !!editId,
    refetchOnWindowFocus: false,
  });

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<LadyFormValues>({
    resolver: zodResolver(ladySchema),
    defaultValues: {
      name: "",
      age: 20,
      category: undefined,
      description: "",
      height: "",
      weight: "",
      is_active: true,
    },
  });

  // Effect to populate form and photos when lady data loads
  useEffect(() => {
    if (isEdit && ladyData) {
      form.reset({
        name: ladyData.name || "",
        age: Number(ladyData.age) || 20,
        category: (ladyData.category as any) || undefined,
        description: ladyData.description || "",
        height: ladyData.height || "",
        weight: ladyData.weight || "",
        is_active: isLadyActive(ladyData.is_active),
      });
      if (ladyData.photos) {
        setExistingPhotos(
          ladyData.photos.map((p: any) => ({
            id: p.id,
            url: p.photo_path.startsWith("http")
              ? p.photo_path
              : `${LADIES_API_URL}${p.photo_path.startsWith("/") ? "" : "/"}${p.photo_path}`,
          }))
        );
      }
    }
  }, [isEdit, ladyData, form, LADIES_API_URL]);

  // ── Photo Handlers ────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalPhotos = photos.length + existingPhotos.length - removedPhotoIds.length + files.length;

    if (totalPhotos > 5) {
      toast({
        title: "Maximum 5 photos",
        description: `You can only upload ${5 - (existingPhotos.length - removedPhotoIds.length + photos.length)} more photo(s).`,
        variant: "destructive",
      });
      return;
    }

    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Generate previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [photos, existingPhotos, removedPhotoIds, toast]);

  const removeNewPhoto = useCallback((index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }, [photoPreviews]);

  const removeExistingPhoto = useCallback((photoId: number) => {
    setRemovedPhotoIds((prev) => [...prev, photoId]);
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    const totalPhotos = photos.length + existingPhotos.length - removedPhotoIds.length + files.length;
    if (totalPhotos > 5) {
      toast({
        title: "Maximum 5 photos",
        description: "You've exceeded the photo limit.",
        variant: "destructive",
      });
      return;
    }

    setPhotos((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  }, [photos, existingPhotos, removedPhotoIds, toast]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: LadyFormValues) =>
      createLady({ ...data, outlet, photos }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ladiesKeys.lists() });
      toast({ title: "Lady added successfully!" });
      setLocation(`/ladies/${outlet}`);
    },
    onError: (err: Error) =>
      toast({ title: "Failed to add", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: LadyFormValues) =>
      updateLady(editId!, { ...data, outlet, photos, removePhotoIds: removedPhotoIds }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ladiesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ladiesKeys.details() });
      toast({ title: "Lady updated successfully!" });
      setLocation(`/ladies/${outlet}`);
    },
    onError: (err: Error) =>
      toast({ title: "Failed to update", description: err.message, variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: LadyFormValues) => {
    if (isEdit && editId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const activeExistingCount = existingPhotos.length;
  const canAddMore = photos.length + activeExistingCount < 5;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation(`/ladies/${outlet}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {isEdit ? "Edit Lady" : "Add New Lady"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {outletName} Outlet
          </p>
        </div>
      </div>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos (max 5)</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Preview Grid */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            {/* Existing Photos */}
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(photo.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* New Photo Previews */}
            {photoPreviews.map((preview, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add More Button */}
            {canAddMore && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-[10px] font-medium">Add</span>
              </button>
            )}
          </div>

          {/* Drop Zone */}
          {photos.length === 0 && existingPhotos.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/40"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Drag & drop photos here, or
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPEG, PNG, WebP • Max 5MB each • Up to 5 photos
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Aria Chen" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input type="number" min={18} max={60} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sapphire">Sapphire (Spahiere)</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />


                <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height</FormLabel>
                    <FormControl><Input placeholder={`e.g. 5'6"`} {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl><Input placeholder="e.g. 48 kg" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>Attendance Status (Landing Page Visibility)</FormLabel>
                    <FormControl>
                      <div
                        className="flex items-center gap-3 h-10 px-3 bg-muted/30 rounded-md border border-border/80 cursor-pointer hover:bg-muted/50 transition-colors w-full"
                        onClick={() => field.onChange(!field.value)}
                      >
                        <span className={`text-xs font-bold tracking-wider ${!field.value ? "text-red-500" : "text-muted-foreground/60"}`}>
                          OFF
                        </span>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-emerald-500 scale-95 cursor-pointer pointer-events-none"
                        />
                        <span className={`text-xs font-bold tracking-wider ${field.value ? "text-emerald-500" : "text-muted-foreground/60"}`}>
                          ON
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {field.value ? "Muncul di Landing Page" : "Hilang dari Landing Page (Libur)"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description about the lady..."
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(`/ladies/${outlet}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEdit ? "Updating…" : "Saving…"}</>
                  ) : (
                    isEdit ? "Update Lady" : "Add Lady"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
