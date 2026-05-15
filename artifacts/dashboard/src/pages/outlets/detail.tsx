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
  useListBeverages,
  useCreateBeverage,
  useUpdateBeverage,
  useDeleteBeverage,
  useListPromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  getGetOutletQueryKey,
  getListMenuItemsQueryKey,
  getListBeveragesQueryKey,
  getListPromotionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getImageUrl } from "@/lib/assets";
import { ArrowLeft, MapPin, Phone, Clock, Utensils, Plus, Pencil, Trash2, GripVertical, Store, Megaphone, Image as ImageIcon, GlassWater } from "lucide-react";
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

const beverageSchema = z.object({
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
});

type BeverageFormValues = z.infer<typeof beverageSchema>;

const promotionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaHref: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

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

  const { data: beverages, isLoading: isBevLoading } = useListBeverages(id, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: getListBeveragesQueryKey(id)
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

  // Beverages state
  const beveragesQueryKey = getListBeveragesQueryKey(id);
  const [isCreateBevOpen, setIsCreateBevOpen] = useState(false);
  const [editingBev, setEditingBev] = useState<any>(null);
  const [deletingBev, setDeletingBev] = useState<any>(null);

  const createBevMutation = useCreateBeverage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: beveragesQueryKey });
        toast({ title: "Beverage added successfully" });
        setIsCreateBevOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to add beverage", variant: "destructive" });
      }
    }
  });

  const updateBevMutation = useUpdateBeverage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: beveragesQueryKey });
        toast({ title: "Beverage updated successfully" });
        setEditingBev(null);
      },
      onError: () => {
        toast({ title: "Failed to update beverage", variant: "destructive" });
      }
    }
  });

  const deleteBevMutation = useDeleteBeverage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: beveragesQueryKey });
        toast({ title: "Beverage deleted successfully" });
        setDeletingBev(null);
      },
      onError: () => {
        toast({ title: "Failed to delete beverage", variant: "destructive" });
      }
    }
  });

  const bevForm = useForm<BeverageFormValues>({
    resolver: zodResolver(beverageSchema),
    defaultValues: { category: "", name: "", description: "", price: "", sortOrder: 0, featured: false }
  });

  const onOpenChangeCreateBev = (open: boolean) => {
    setIsCreateBevOpen(open);
    if (open) {
      bevForm.reset({ category: "", name: "", description: "", price: "", sortOrder: (beverages?.length || 0) * 10, featured: false });
    }
  };

  const onOpenChangeEditBev = (open: boolean, item?: any) => {
    if (open && item) {
      setEditingBev(item);
      bevForm.reset({ category: item.category, name: item.name, description: item.description || "", price: item.price || "", sortOrder: item.sortOrder, featured: item.featured });
    } else {
      setEditingBev(null);
    }
  };

  const onBevSubmit = (data: BeverageFormValues) => {
    if (editingBev) {
      updateBevMutation.mutate({ id: editingBev.id, data });
    } else {
      createBevMutation.mutate({ outletId: id, data });
    }
  };

  // Promotions state
  const promotionsQueryKey = getListPromotionsQueryKey(id);
  const { data: promotions, isLoading: isPromosLoading } = useListPromotions(id, undefined, {
    query: {
      enabled: !!id && !isNaN(id),
      queryKey: promotionsQueryKey,
    },
  });

  const [isCreatePromoOpen, setIsCreatePromoOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [deletingPromo, setDeletingPromo] = useState<any>(null);

  const createPromoMutation = useCreatePromotion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: promotionsQueryKey });
        toast({ title: "Promotion added successfully" });
        setIsCreatePromoOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to add promotion", variant: "destructive" });
      },
    },
  });

  const updatePromoMutation = useUpdatePromotion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: promotionsQueryKey });
        toast({ title: "Promotion updated successfully" });
        setEditingPromo(null);
      },
      onError: () => {
        toast({ title: "Failed to update promotion", variant: "destructive" });
      },
    },
  });

  const deletePromoMutation = useDeletePromotion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: promotionsQueryKey });
        toast({ title: "Promotion deleted successfully" });
        setDeletingPromo(null);
      },
      onError: () => {
        toast({ title: "Failed to delete promotion", variant: "destructive" });
      },
    },
  });

  const promoForm = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      title: "",
      description: "",
      imagePath: "",
      ctaLabel: "",
      ctaHref: "",
      badge: "",
      sortOrder: 0,
      active: true,
    },
  });

  const onOpenChangeCreatePromo = (open: boolean) => {
    setIsCreatePromoOpen(open);
    if (open) {
      promoForm.reset({
        title: "",
        description: "",
        imagePath: "",
        ctaLabel: "",
        ctaHref: "",
        badge: "",
        sortOrder: (promotions?.length || 0) * 10,
        active: true,
      });
    }
  };

  const onOpenChangeEditPromo = (open: boolean, promo?: any) => {
    if (open && promo) {
      setEditingPromo(promo);
      promoForm.reset({
        title: promo.title,
        description: promo.description || "",
        imagePath: promo.imagePath || "",
        ctaLabel: promo.ctaLabel || "",
        ctaHref: promo.ctaHref || "",
        badge: promo.badge || "",
        sortOrder: promo.sortOrder,
        active: promo.active,
      });
    } else {
      setEditingPromo(null);
    }
  };

  const onPromoSubmit = (data: PromotionFormValues) => {
    if (editingPromo) {
      updatePromoMutation.mutate({ id: editingPromo.id, data });
    } else {
      createPromoMutation.mutate({ outletId: id, data });
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
          <TabsTrigger value="beverages" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Beverages</TabsTrigger>
          <TabsTrigger value="promotions" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Promotions</TabsTrigger>
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
                              <img src={getImageUrl(item.imagePath)} alt={item.name} className="w-full h-full object-cover" />
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

        <TabsContent value="beverages" className="space-y-6 outline-none">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Beverages</h2>
              <p className="text-sm text-muted-foreground">Manage the beverage menu for this outlet.</p>
            </div>
            <Dialog open={isCreateBevOpen} onOpenChange={onOpenChangeCreateBev}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-beverage">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Beverage
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Beverage</DialogTitle>
                  <DialogDescription>Add a new beverage to {outlet?.name}'s menu.</DialogDescription>
                </DialogHeader>
                <BeverageForm form={bevForm} onSubmit={onBevSubmit} isPending={createBevMutation.isPending} onCancel={() => setIsCreateBevOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={!!editingBev} onOpenChange={(open) => onOpenChangeEditBev(open, editingBev)}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Edit Beverage</DialogTitle></DialogHeader>
              <BeverageForm form={bevForm} onSubmit={onBevSubmit} isPending={updateBevMutation.isPending} onCancel={() => setEditingBev(null)} />
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deletingBev} onOpenChange={(open) => !open && setDeletingBev(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the beverage. This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteBevMutation.mutate({ id: deletingBev.id })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isBevLoading ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y border-t border-border">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 flex gap-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : !beverages?.length ? (
            <div className="text-center py-16 px-4 bg-card border border-dashed rounded-lg">
              <GlassWater className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No beverages</h3>
              <p className="text-muted-foreground mt-1 mb-4">This outlet's beverage menu is currently empty.</p>
              <Button onClick={() => setIsCreateBevOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Beverage
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(
                beverages.reduce((acc: Record<string, typeof beverages>, item) => {
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
                          <div className="h-12 w-12 shrink-0 rounded bg-muted flex items-center justify-center border border-border">
                            <GlassWater className="w-5 h-5 text-muted-foreground/40" />
                          </div>
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
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => onOpenChangeEditBev(true, item)} data-testid={`action-edit-bev-${item.id}`}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setDeletingBev(item)} data-testid={`action-delete-bev-${item.id}`}>
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

        <TabsContent value="promotions" className="space-y-6 outline-none">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Promotions</h2>
              <p className="text-sm text-muted-foreground">
                Limited-time offers, events, and featured experiences for this outlet.
              </p>
            </div>

            <Dialog open={isCreatePromoOpen} onOpenChange={onOpenChangeCreatePromo}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add new promotion</DialogTitle>
                  <DialogDescription>
                    Promotions appear on this outlet's public page under "Current Promotions".
                  </DialogDescription>
                </DialogHeader>
                <PromotionForm
                  form={promoForm}
                  onSubmit={onPromoSubmit}
                  isPending={createPromoMutation.isPending}
                  onCancel={() => setIsCreatePromoOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {isPromosLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-32 w-full rounded-none" />
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : !promotions || promotions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No promotions yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Create promos like happy hour, set menus, or special events to highlight on this outlet's page.
                </p>
                <Button onClick={() => onOpenChangeCreatePromo(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add your first promotion
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {promotions.map((promo: any) => (
                <Card key={promo.id} className="overflow-hidden flex flex-col">
                  {promo.imagePath ? (
                    <div className="relative aspect-[9/16] bg-muted">
                      <img
                        src={getImageUrl(promo.imagePath)}
                        alt={promo.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      {promo.badge && (
                        <Badge className="absolute top-2 left-2">{promo.badge}</Badge>
                      )}
                      {!promo.active && (
                        <Badge variant="secondary" className="absolute top-2 right-2">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[9/16] bg-muted flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground opacity-30" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug line-clamp-2">
                        {promo.title}
                      </CardTitle>
                      {!promo.imagePath && !promo.active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {promo.description && (
                      <CardDescription className="line-clamp-2">
                        {promo.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 mt-auto">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <GripVertical className="h-3 w-3" /> Order {promo.sortOrder}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onOpenChangeEditPromo(true, promo)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingPromo(promo)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog
            open={!!editingPromo}
            onOpenChange={(open) => onOpenChangeEditPromo(open, editingPromo)}
          >
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit promotion</DialogTitle>
                <DialogDescription>Update this promotion's details.</DialogDescription>
              </DialogHeader>
              <PromotionForm
                form={promoForm}
                onSubmit={onPromoSubmit}
                isPending={updatePromoMutation.isPending}
                onCancel={() => setEditingPromo(null)}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={!!deletingPromo}
            onOpenChange={(open) => !open && setDeletingPromo(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete promotion?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{deletingPromo?.title}" from this outlet. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deletingPromo && deletePromoMutation.mutate({ id: deletingPromo.id })
                  }
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PromotionForm({
  form,
  onSubmit,
  isPending,
  onCancel,
}: {
  form: any;
  onSubmit: (data: PromotionFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="imagePath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image (Optional)</FormLabel>
              <FormControl>
                <ImageUpload value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Sunset Happy Hour" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the offer, event, or experience..."
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="badge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Badge (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. New, Limited" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>Small label shown over the card.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort order</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Lower numbers display first.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="ctaLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTA Label (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Reserve" {...field} value={field.value || ""} />
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
                <FormLabel>CTA Link (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>Show this promotion on the public site.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save promotion"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function BeverageForm({
  form,
  onSubmit,
  isPending,
  onCancel,
}: {
  form: any;
  onSubmit: (data: BeverageFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mango Lassi" {...field} />
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
                  <Input placeholder="e.g. Cold Drinks" {...field} />
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
                  <Input placeholder="e.g. $6" {...field} value={field.value || ""} />
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
                <Textarea placeholder="Beverage description..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Featured Item</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Cancel</Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-beverage">
            {isPending ? "Saving..." : "Save Beverage"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
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
