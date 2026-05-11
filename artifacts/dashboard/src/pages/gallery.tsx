import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useListGalleryImages, 
  useCreateGalleryImage, 
  useUpdateGalleryImage, 
  useDeleteGalleryImage,
  useListOutlets,
  getListGalleryImagesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ImageUpload } from "@/components/image-upload";
import { getImageUrl } from "@/lib/assets";

const galleryImageSchema = z.object({
  outletId: z.coerce.number().nullable().optional().transform(val => val === 0 ? null : val),
  imagePath: z.string().min(1, "Image is required"),
  caption: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

type GalleryImageFormValues = z.infer<typeof galleryImageSchema>;

export default function GalleryPage() {
  const [filterOutlet, setFilterOutlet] = useState<number | undefined>();
  const { data: images, isLoading } = useListGalleryImages(
    filterOutlet ? { outletId: filterOutlet } : undefined,
    { query: { queryKey: getListGalleryImagesQueryKey(filterOutlet ? { outletId: filterOutlet } : undefined) } }
  );
  const { data: outlets } = useListOutlets();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [deletingImage, setDeletingImage] = useState<any>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateGalleryImage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGalleryImagesQueryKey() });
        toast({ title: "Image added successfully" });
        setIsCreateOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to add image", variant: "destructive" });
      }
    }
  });

  const updateMutation = useUpdateGalleryImage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGalleryImagesQueryKey() });
        toast({ title: "Image updated successfully" });
        setEditingImage(null);
      },
      onError: () => {
        toast({ title: "Failed to update image", variant: "destructive" });
      }
    }
  });

  const deleteMutation = useDeleteGalleryImage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGalleryImagesQueryKey() });
        toast({ title: "Image deleted successfully" });
        setDeletingImage(null);
      },
      onError: () => {
        toast({ title: "Failed to delete image", variant: "destructive" });
      }
    }
  });

  const form = useForm<GalleryImageFormValues>({
    resolver: zodResolver(galleryImageSchema),
    defaultValues: {
      outletId: 0,
      imagePath: "",
      caption: "",
      sortOrder: 0,
    }
  });

  const onOpenChangeCreate = (open: boolean) => {
    setIsCreateOpen(open);
    if (open) {
      form.reset({
        outletId: filterOutlet || 0,
        imagePath: "",
        caption: "",
        sortOrder: (images?.length || 0) * 10,
      });
    }
  };

  const onOpenChangeEdit = (open: boolean, image?: any) => {
    if (open && image) {
      setEditingImage(image);
      form.reset({
        outletId: image.outletId || 0,
        imagePath: image.imagePath,
        caption: image.caption || "",
        sortOrder: image.sortOrder,
      });
    } else {
      setEditingImage(null);
    }
  };

  const onSubmit = (data: GalleryImageFormValues) => {
    if (editingImage) {
      updateMutation.mutate({ id: editingImage.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
          <p className="text-muted-foreground mt-1">Manage public photos for the main gallery and specific outlets.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={onOpenChangeCreate}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-gallery-image">
              <Plus className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Photo</DialogTitle>
              <DialogDescription>
                Upload a new photo to the gallery.
              </DialogDescription>
            </DialogHeader>
            <GalleryForm 
              form={form} 
              onSubmit={onSubmit} 
              isPending={createMutation.isPending} 
              onCancel={() => setIsCreateOpen(false)}
              outlets={outlets || []}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Label>Filter by outlet:</Label>
        <Select 
          value={filterOutlet ? filterOutlet.toString() : "all"} 
          onValueChange={(val) => setFilterOutlet(val === "all" ? undefined : parseInt(val))}
        >
          <SelectTrigger className="w-[200px]" data-testid="select-filter-outlet">
            <SelectValue placeholder="All Outlets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Photos</SelectItem>
            <SelectSeparator />
            {outlets?.map(outlet => (
              <SelectItem key={outlet.id} value={outlet.id.toString()}>
                {outlet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={!!editingImage} onOpenChange={(open) => onOpenChangeEdit(open, editingImage)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          <GalleryForm 
            form={form} 
            onSubmit={onSubmit} 
            isPending={updateMutation.isPending} 
            onCancel={() => setEditingImage(null)}
            outlets={outlets || []}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingImage} onOpenChange={(open) => !open && setDeletingImage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the photo. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate({ id: deletingImage.id })}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full rounded-none" />
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !images?.length ? (
        <div className="text-center py-16 px-4 bg-card border border-dashed rounded-lg">
          <Images className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No photos found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {filterOutlet ? "This outlet doesn't have any photos yet." : "Your gallery is currently empty."}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden transition-all duration-200 hover:shadow-md group">
              <div className="relative aspect-square w-full">
                <img 
                  src={getImageUrl(image.imagePath)} 
                  alt={image.caption || "Gallery image"} 
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/50 text-white hover:bg-black/70 border-none backdrop-blur-sm" data-testid={`button-image-menu-${image.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onOpenChangeEdit(true, image)} data-testid={`action-edit-image-${image.id}`}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingImage(image)} 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        data-testid={`action-delete-image-${image.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {image.outletId && outlets && (
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    {outlets.find(o => o.id === image.outletId)?.name || "Unknown Outlet"}
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate flex-1">{image.caption || "No caption"}</p>
                  <div className="flex items-center text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                    <GripVertical className="w-3 h-3 mr-0.5 opacity-50" />
                    {image.sortOrder}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const SelectSeparator = () => <div className="-mx-1 my-1 h-px bg-muted" />;

function GalleryForm({ 
  form, 
  onSubmit, 
  isPending, 
  onCancel,
  outlets
}: { 
  form: any, 
  onSubmit: (data: GalleryImageFormValues) => void, 
  isPending: boolean, 
  onCancel: () => void,
  outlets: any[]
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="imagePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo</FormLabel>
              <FormControl>
                <ImageUpload value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="outletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outlet (Optional)</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(val === "0" ? null : parseInt(val))} 
                  value={field.value ? field.value.toString() : "0"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="General Gallery" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">General Gallery</SelectItem>
                    <SelectSeparator />
                    {outlets.map(outlet => (
                      <SelectItem key={outlet.id} value={outlet.id.toString()}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Assign to a specific location</FormDescription>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caption (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Photo description..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-image">
            {isPending ? "Saving..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
