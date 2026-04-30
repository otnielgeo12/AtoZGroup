import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useParams, Link } from "wouter";
import { 
  useGetOutlet, 
  useUpdateOutlet, 
  useListMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  getGetOutletQueryKey,
  getListMenuItemsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Phone, Clock, Utensils, Plus, Pencil, Trash2, GripVertical, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Badge } from "@/components/ui/badge";

const outletSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  hours: z.string().nullable().optional(),
  cuisine: z.string().nullable().optional(),
  accentColor: z.string().nullable().optional(),
  coverImagePath: z.string().nullable().optional(),
  cardImagePath: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

type OutletFormValues = z.infer<typeof outletSchema>;

const menuItemSchema = z.object({
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

export default function OutletDetailPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: outlet, isLoading: isOutletLoading } = useGetOutlet(id, { 
    query: { 
      enabled: !!id && !isNaN(id), 
      queryKey: getGetOutletQueryKey(id) 
    } 
  });

  const { data: menuItems, isLoading: isMenuLoading } = useListMenuItems(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getListMenuItemsQueryKey(id)
    }
  });

  const updateOutletMutation = useUpdateOutlet({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOutletQueryKey(id) });
        toast({ title: "Outlet updated successfully" });
      },
      onError: () => {
        toast({ title: "Failed to update outlet", variant: "destructive" });
      }
    }
  });

  const outletForm = useForm<OutletFormValues>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: "",
      slug: "",
      tagline: "",
      description: "",
      address: "",
      phone: "",
      hours: "",
      cuisine: "",
      accentColor: "",
      coverImagePath: "",
      cardImagePath: "",
      sortOrder: 0,
    }
  });

  // Effect to populate form when outlet data loads
  useEffect(() => {
    if (outlet) {
      outletForm.reset({
        name: outlet.name,
        slug: outlet.slug,
        tagline: outlet.tagline || "",
        description: outlet.description || "",
        address: outlet.address || "",
        phone: outlet.phone || "",
        hours: outlet.hours || "",
        cuisine: outlet.cuisine || "",
        accentColor: outlet.accentColor || "",
        coverImagePath: outlet.coverImagePath || "",
        cardImagePath: outlet.cardImagePath || "",
        sortOrder: outlet.sortOrder,
      });
    }
  }, [outlet, outletForm]);

  const onOutletSubmit = (data: OutletFormValues) => {
    updateOutletMutation.mutate({ id, data });
  };

  // Menu items state
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [deletingMenu, setDeletingMenu] = useState<any>(null);

  const createMenuMutation = useCreateMenuItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey(id) });
        toast({ title: "Menu item added successfully" });
        setIsCreateMenuOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to add menu item", variant: "destructive" });
      }
    }
  });

  const updateMenuMutation = useUpdateMenuItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey(id) });
        toast({ title: "Menu item updated successfully" });
        setEditingMenu(null);
      },
      onError: () => {
        toast({ title: "Failed to update menu item", variant: "destructive" });
      }
    }
  });

  const deleteMenuMutation = useDeleteMenuItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey(id) });
        toast({ title: "Menu item deleted successfully" });
        setDeletingMenu(null);
      },
      onError: () => {
        toast({ title: "Failed to delete menu item", variant: "destructive" });
      }
    }
  });

  const menuForm = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      category: "",
      name: "",
      description: "",
      price: "",
      imagePath: "",
      tags: "",
      sortOrder: 0,
      featured: false,
    }
  });

  const onOpenChangeCreateMenu = (open: boolean) => {
    setIsCreateMenuOpen(open);
    if (open) {
      menuForm.reset({
        category: "",
        name: "",
        description: "",
        price: "",
        imagePath: "",
        tags: "",
        sortOrder: (menuItems?.length || 0) * 10,
        featured: false,
      });
    }
  };

  const onOpenChangeEditMenu = (open: boolean, item?: any) => {
    if (open && item) {
      setEditingMenu(item);
      menuForm.reset({
        category: item.category,
        name: item.name,
        description: item.description || "",
        price: item.price || "",
        imagePath: item.imagePath || "",
        tags: item.tags || "",
        sortOrder: item.sortOrder,
        featured: item.featured,
      });
    } else {
      setEditingMenu(null);
    }
  };

  const onMenuSubmit = (data: MenuItemFormValues) => {
    if (editingMenu) {
      updateMenuMutation.mutate({ id: editingMenu.id, data });
    } else {
      createMenuMutation.mutate({ outletId: id, data });
    }
  };

  if (isNaN(id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Store className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
        <h2 className="text-xl font-medium">Invalid Outlet ID</h2>
        <Button variant="link" onClick={() => setLocation("/outlets")} className="mt-2">
          Back to outlets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/outlets")} className="-ml-2 shrink-0">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1">
          {isOutletLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight truncate">{outlet?.name}</h1>
          )}
          {isOutletLoading ? (
            <Skeleton className="h-4 w-48 mt-2" />
          ) : (
            <p className="text-muted-foreground mt-1 flex items-center text-sm gap-4">
              <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {outlet?.address || "No address"}</span>
              <span className="flex items-center"><Utensils className="w-3.5 h-3.5 mr-1" /> {outlet?.cuisine || "No cuisine"}</span>
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 w-full sm:w-auto overflow-x-auto justify-start border border-border">
          <TabsTrigger value="details" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Outlet Details</TabsTrigger>
          <TabsTrigger value="menu" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Menu Items</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 outline-none">
          {isOutletLoading ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update the public details for this location.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...outletForm}>
                  <form onSubmit={outletForm.handleSubmit(onOutletSubmit)} className="space-y-8">
                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="space-y-6">
                        <FormField
                          control={outletForm.control}
                          name="coverImagePath"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cover Image</FormLabel>
                              <FormControl>
                                <ImageUpload value={field.value} onChange={field.onChange} />
                              </FormControl>
                              <FormDescription>Used as the header background on the outlet page.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={outletForm.control}
                          name="cardImagePath"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Image</FormLabel>
                              <FormControl>
                                <ImageUpload value={field.value} onChange={field.onChange} />
                              </FormControl>
                              <FormDescription>Used on the homepage and outlet listing grid.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={outletForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outletForm.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slug</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>URL friendly identifier (e.g., spice-downtown)</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outletForm.control}
                          name="tagline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tagline</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outletForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea className="min-h-[100px]" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={outletForm.control}
                            name="cuisine"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cuisine</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="e.g. North Indian" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={outletForm.control}
                            name="accentColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Accent Color</FormLabel>
                                <FormControl>
                                  <div className="flex gap-2">
                                    <Input type="color" {...field} value={field.value || "#80303b"} className="w-12 p-1" />
                                    <Input {...field} value={field.value || ""} placeholder="e.g. #80303b" className="flex-1" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <h3 className="text-lg font-medium mb-4">Contact & Location</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={outletForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outletForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outletForm.control}
                          name="hours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hours</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} placeholder="e.g. Mon-Sun: 11am - 10pm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outletForm.control}
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
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateOutletMutation.isPending} data-testid="button-save-outlet">
                        {updateOutletMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="menu" className="space-y-6 outline-none">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Menu Items</h2>
              <p className="text-sm text-muted-foreground">Manage the specific menu for this outlet.</p>
            </div>
            
            <Dialog open={isCreateMenuOpen} onOpenChange={onOpenChangeCreateMenu}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-menu-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to {outlet?.name}'s menu.
                  </DialogDescription>
                </DialogHeader>
                <MenuForm 
                  form={menuForm} 
                  onSubmit={onMenuSubmit} 
                  isPending={createMenuMutation.isPending} 
                  onCancel={() => setIsCreateMenuOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={!!editingMenu} onOpenChange={(open) => onOpenChangeEditMenu(open, editingMenu)}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Menu Item</DialogTitle>
              </DialogHeader>
              <MenuForm 
                form={menuForm} 
                onSubmit={onMenuSubmit} 
                isPending={updateMenuMutation.isPending} 
                onCancel={() => setEditingMenu(null)} 
              />
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deletingMenu} onOpenChange={(open) => !open && setDeletingMenu(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the menu item. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteMenuMutation.mutate({ id: deletingMenu.id })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isMenuLoading ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y border-t border-border">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 flex gap-4">
                      <Skeleton className="h-16 w-16 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : !menuItems?.length ? (
            <div className="text-center py-16 px-4 bg-card border border-dashed rounded-lg">
              <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No menu items</h3>
              <p className="text-muted-foreground mt-1 mb-4">This outlet's menu is currently empty.</p>
              <Button onClick={() => setIsCreateMenuOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Group menu items by category */}
              {Object.entries(
                menuItems.reduce((acc: Record<string, typeof menuItems>, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {})
              ).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-serif text-xl border-b border-border pb-2 text-primary">{category}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <Card key={item.id} className="overflow-hidden hover:border-primary/30 transition-colors flex flex-col h-full">
                        <div className="flex p-3 gap-3">
                          {item.imagePath ? (
                            <div className="h-16 w-16 shrink-0 rounded bg-muted overflow-hidden">
                              <img src={`/api/storage${item.imagePath}`} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-16 w-16 shrink-0 rounded bg-muted flex items-center justify-center border border-border">
                              <Utensils className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-sm truncate pr-2">{item.name}</h4>
                              <span className="font-medium text-sm text-primary shrink-0">{item.price}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                          </div>
                        </div>
                        <div className="mt-auto bg-muted/20 border-t border-border p-2 px-3 flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {item.featured && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Featured</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={() => onOpenChangeEditMenu(true, item)}
                              data-testid={`action-edit-menu-${item.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeletingMenu(item)}
                              data-testid={`action-delete-menu-${item.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MenuForm({ 
  form, 
  onSubmit, 
  isPending, 
  onCancel 
}: { 
  form: any, 
  onSubmit: (data: MenuItemFormValues) => void, 
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
              <FormLabel>Item Image (Optional)</FormLabel>
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Butter Chicken" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mains" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. $18" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. V, GF, Spicy" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Dish description..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
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

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-10 mt-auto">
                <div className="space-y-0.5">
                  <FormLabel>Featured Item</FormLabel>
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
          <Button type="submit" disabled={isPending} data-testid="button-save-menu">
            {isPending ? "Saving..." : "Save Item"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
