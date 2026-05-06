import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AdminLayout } from "@/components/layout";
import { 
  useCreateProduct, 
  useUpdateProduct, 
  useGetProduct,
  getListProductsQueryKey,
  getGetProductQueryKey,
  getGetProductStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  material: z.string().min(1, "Material is required"),
  category: z.string().min(1, "Category is required"),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  images: z.array(
    z.object({
      url: z.string().url("Must be a valid URL")
    })
  ).min(1, "At least one image is required")
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminProductForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = params.id && params.id !== "new";
  const productId = isEditing ? Number(params.id) : undefined;

  const { data: product, isLoading: isLoadingProduct } = useGetProduct(productId ?? 0, {
    query: {
      enabled: !!isEditing && productId !== undefined,
      queryKey: getGetProductQueryKey(productId ?? 0)
    }
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      material: "",
      category: "",
      inStock: true,
      featured: false,
      images: [{ url: "" }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  useEffect(() => {
    if (product && isEditing) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        material: product.material,
        category: product.category,
        inStock: product.inStock,
        featured: product.featured,
        images: product.images.length > 0 
          ? product.images.map(url => ({ url })) 
          : [{ url: "" }]
      });
    }
  }, [product, isEditing, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      images: values.images.map(img => img.url).filter(Boolean)
    };

    if (isEditing && productId) {
      updateProduct.mutate(
        { id: productId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product updated", description: "Changes saved successfully." });
            setLocation("/admin");
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
          }
        }
      );
    } else {
      createProduct.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
            toast({ title: "Product created", description: "New product added to catalog." });
            setLocation("/admin");
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to create product.", variant: "destructive" });
          }
        }
      );
    }
  };

  if (isEditing && isLoadingProduct) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-muted-foreground font-serif">Loading product details...</div>
      </AdminLayout>
    );
  }

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-none">
            <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-serif tracking-wide">{isEditing ? "Edit Product" : "New Product"}</h1>
            <p className="text-muted-foreground text-sm">{isEditing ? "Update product details." : "Add a new piece to your catalog."}</p>
          </div>
        </div>

        <div className="bg-card p-8 border border-border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase tracking-widest text-xs">Name</FormLabel>
                      <FormControl>
                        <Input className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground" {...field} />
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
                      <FormLabel className="uppercase tracking-widest text-xs">Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase tracking-widest text-xs">Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rings, Necklaces" className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase tracking-widest text-xs">Material</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 18k Gold, Sterling Silver" className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground" {...field} />
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
                    <FormLabel className="uppercase tracking-widest text-xs">Description</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[120px] rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <p className="uppercase tracking-widest text-xs font-medium">Images</p>
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`images.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="https://..." className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground" {...field} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            className="rounded-none shrink-0 border-border text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none uppercase tracking-widest text-xs border-border"
                  onClick={() => append({ url: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Image URL
                </Button>
              </div>

              <div className="flex gap-8 border-t border-border pt-8">
                <FormField
                  control={form.control}
                  name="inStock"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-none border border-border p-4 flex-1">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-serif">In Stock</FormLabel>
                        <FormDescription>
                          Available for purchase
                        </FormDescription>
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

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-none border border-border p-4 flex-1">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-serif">Featured</FormLabel>
                        <FormDescription>
                          Display on homepage
                        </FormDescription>
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

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button type="button" variant="outline" asChild className="rounded-none uppercase tracking-widest text-xs h-12 px-8">
                  <Link href="/admin">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending} className="rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs h-12 px-8">
                  {isPending ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}
