import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useListBanners, 
  useCreateBanner, 
  useUpdateBanner, 
  useDeleteBanner,
  getListBannersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Check, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/image-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const bannerSchema = z.object({
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  imagePath: z.string().min(1, "Image is required"),
  ctaLabel: z.string().nullable().optional(),
  ctaHref: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

export default function BannersPage() {
  const { data: banners, isLoading } = useListBanners();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [deletingBanner, setDeletingBanner] = useState<any>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
        toast({ title: "Banner created successfully" });
        setIsCreateOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to create banner", variant: "destructive" });
      }
    }
  });

  const updateMutation = useUpdateBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
        toast({ title: "Banner updated successfully" });
        setEditingBanner(null);
      },
      onError: () => {
        toast({ title: "Failed to update banner", variant: "destructive" });
      }
    }
  });

  const deleteMutation = useDeleteBanner({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
        toast({ title: "Banner deleted successfully" });
        setDeletingBanner(null);
      },
      onError: () => {
        toast({ title: "Failed to delete banner", variant: "destructive" });
      }
    }
  });

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      imagePath: "",
      ctaLabel: "",
      ctaHref: "",
      sortOrder: 0,
      active: true,
    }
  });

  const onOpenChangeCreate = (open: boolean) => {
    setIsCreateOpen(open);
    if (open) {
      form.reset({
        title: "",
        subtitle: "",
        imagePath: "",
        ctaLabel: "",
        ctaHref: "",
        sortOrder: (banners?.length || 0) * 10,
        active: true,
      });
    }
  };

  const onOpenChangeEdit = (open: boolean, banner?: any) => {
    if (open && banner) {
      setEditingBanner(banner);
      form.reset({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        imagePath: banner.imagePath,
        ctaLabel: banner.ctaLabel || "",
        ctaHref: banner.ctaHref || "",
        sortOrder: banner.sortOrder,
        active: banner.active,
      });
    } else {
      setEditingBanner(null);
    }
  };

  const onSubmit = (data: BannerFormValues) => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground mt-1">Manage homepage slider banners and promotions.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={onOpenChangeCreate}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-banner">
              <Plus className="w-4 h-4 mr-2" />
              New Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Banner</DialogTitle>
              <DialogDescription>
                Add a new banner to the homepage slider.
              </DialogDescription>
            </DialogHeader>
            <BannerForm 
              form={form} 
              onSubmit={onSubmit} 
              isPending={createMutation.isPending} 
              onCancel={() => setIsCreateOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingBanner} onOpenChange={(open) => onOpenChangeEdit(open, editingBanner)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
            <DialogDescription>
              Make changes to the banner.
            </DialogDescription>
          </DialogHeader>
          <BannerForm 
            form={form} 
            onSubmit={onSubmit} 
            isPending={updateMutation.isPending} 
            onCancel={() => setEditingBanner(null)} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingBanner} onOpenChange={(open) => !open && setDeletingBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the banner. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate({ id: deletingBanner.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !banners?.length ? (
        <div className="text-center py-16 px-4 bg-card border border-dashed rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No banners yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">Create your first banner to display on the homepage.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Banner
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={`overflow-hidden transition-all duration-200 hover:shadow-md ${!banner.active ? 'opacity-75 grayscale-[0.2]' : ''}`}>
              <div className="relative aspect-video w-full group">
                <img 
                  src={`/api/storage${banner.imagePath}`} 
                  alt={banner.title || "Banner"} 
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute top-2 right-2 flex gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium backdrop-blur-sm ${banner.active ? 'bg-green-500/80 text-white' : 'bg-secondary/80 text-secondary-foreground'}`}>
                    {banner.active ? 'Active' : 'Inactive'}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-7 w-7 bg-black/40 text-white hover:bg-black/60 border-none backdrop-blur-sm" data-testid={`button-banner-menu-${banner.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onOpenChangeEdit(true, banner)} data-testid={`action-edit-banner-${banner.id}`}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          updateMutation.mutate({ 
                            id: banner.id, 
                            data: { active: !banner.active } 
                          });
                        }}
                      >
                        {banner.active ? <X className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        {banner.active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingBanner(banner)} 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        data-testid={`action-delete-banner-${banner.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base truncate">{banner.title || "Untitled Banner"}</h3>
                    <p className="text-sm text-muted-foreground truncate">{banner.subtitle || "No subtitle"}</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                    <GripVertical className="w-3 h-3 mr-1 opacity-50" />
                    Order {banner.sortOrder}
                  </div>
                </div>
                {banner.ctaLabel && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center text-sm">
                    <span className="font-medium mr-2">CTA:</span>
                    <span className="truncate flex-1">{banner.ctaLabel}</span>
                    <span className="text-muted-foreground text-xs truncate max-w-[100px] ml-2">({banner.ctaHref})</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BannerForm({ 
  form, 
  onSubmit, 
  isPending, 
  onCancel 
}: { 
  form: any, 
  onSubmit: (data: BannerFormValues) => void, 
  isPending: boolean, 
  onCancel: () => void 
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="imagePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banner Image</FormLabel>
              <FormControl>
                <ImageUpload value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>
                Landscape image, recommended 1920x1080px.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Taste the Tradition" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subtitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtitle (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. New menu out now" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ctaLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Button Label (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. View Menu" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ctaHref"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Button Link (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. /menu" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Lower numbers appear first</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto h-10">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-banner">
            {isPending ? "Saving..." : "Save Banner"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
