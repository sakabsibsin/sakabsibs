import { useState } from "react";
import { AdminLayout } from "@/components/layout";
import {
  useListCategories,
  useCreateCategory,
  useDeleteCategory,
  getListCategoriesQueryKey,
} from "@/lib/api-hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");

  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    createCategory.mutate(
      { data: { name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setNewName("");
          toast({ title: "Category created", description: `"${name}" has been added.` });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Failed to create category.";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast({ title: "Category deleted", description: `"${name}" has been removed.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-serif tracking-wide mb-2">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Manage product categories. The product code prefix is auto-generated from the first two letters of the category name.
          </p>
        </div>

        {/* Add Category Form */}
        <div className="bg-card border border-border p-6">
          <h2 className="text-sm uppercase tracking-widest mb-4">Add Category</h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Rings, Necklaces, Earrings"
              className="rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground flex-1"
            />
            <Button
              type="submit"
              disabled={createCategory.isPending || !newName.trim()}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs h-10 px-6 shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </form>
          {newName.trim() && (
            <p className="text-xs text-muted-foreground mt-2">
              Code prefix will be: <span className="font-mono font-medium text-foreground">{newName.trim().substring(0, 2).toUpperCase()}</span>
            </p>
          )}
        </div>

        {/* Categories List */}
        <div className="bg-card border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm uppercase tracking-widest">Existing Categories</h2>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-none" />
              ))}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground font-serif italic">
              No categories yet. Add your first one above.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {categories.map((cat) => (
                <li key={cat.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="ml-3 text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 border border-border">
                      {cat.codePrefix}
                    </span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-none border-border text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-none border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif">Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{cat.name}"? Existing products in this category will not be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none uppercase tracking-widest text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="rounded-none uppercase tracking-widest text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
