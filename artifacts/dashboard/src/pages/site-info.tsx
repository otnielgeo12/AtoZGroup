import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useGetSiteInfo, 
  useUpdateSiteInfo,
  getGetSiteInfoQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Globe, Mail, Phone, Instagram } from "lucide-react";
import { useEffect } from "react";

const siteInfoSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  tagline: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  contactEmail: z.string().email("Invalid email format").nullable().optional().or(z.literal("")),
  contactPhone: z.string().nullable().optional(),
  instagramUrl: z.string().url("Invalid URL format").nullable().optional().or(z.literal("")),
});

type SiteInfoFormValues = z.infer<typeof siteInfoSchema>;

export default function SiteInfoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: siteInfo, isLoading } = useGetSiteInfo({
    query: { queryKey: getGetSiteInfoQueryKey() }
  });

  const updateMutation = useUpdateSiteInfo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSiteInfoQueryKey() });
        toast({ title: "Site info updated successfully" });
      },
      onError: () => {
        toast({ title: "Failed to update site info", variant: "destructive" });
      }
    }
  });

  const form = useForm<SiteInfoFormValues>({
    resolver: zodResolver(siteInfoSchema),
    defaultValues: {
      brandName: "",
      tagline: "",
      about: "",
      contactEmail: "",
      contactPhone: "",
      instagramUrl: "",
    }
  });

  useEffect(() => {
    if (siteInfo) {
      form.reset({
        brandName: siteInfo.brandName,
        tagline: siteInfo.tagline || "",
        about: siteInfo.about || "",
        contactEmail: siteInfo.contactEmail || "",
        contactPhone: siteInfo.contactPhone || "",
        instagramUrl: siteInfo.instagramUrl || "",
      });
    }
  }, [siteInfo, form]);

  const onSubmit = (data: SiteInfoFormValues) => {
    updateMutation.mutate({ data });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Info</h1>
        <p className="text-muted-foreground mt-1">Manage global brand settings and contact information.</p>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Brand Identity
                </CardTitle>
                <CardDescription>
                  These details appear in the footer and meta tags of the public site.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="brandName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="AtoZ Group Semarang" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                     <FormItem>
                      <FormLabel>Tagline</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. A journey through South Asian flavors" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Short description of the restaurant group..." 
                          className="min-h-[120px]" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormDescription>Used in the footer "About Us" section.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Contact & Social
                </CardTitle>
                <CardDescription>
                  Global contact details for corporate inquiries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corporate Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="info@atozgroupsemarang.com" className="pl-9" {...field} value={field.value || ""} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corporate Phone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="+1 (555) 123-4567" className="pl-9" {...field} value={field.value || ""} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="instagramUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="https://instagram.com/atozgroupsemarang" className="pl-9" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="bg-muted/20 border-t border-border pt-6 flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-site-info">
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
}
