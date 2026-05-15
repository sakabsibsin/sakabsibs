import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/features/categories/hooks";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/AlertDialog";

export const CategoriesPage = () => {
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const { data: categories = [], isLoading } = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const autoPrefix = name.trim().substring(0, 2).toUpperCase();

  const handleCreate = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      { name: trimmed, codePrefix: trimmed.substring(0, 2).toUpperCase() },
      {
        onSuccess: () => {
          toast.success(`"${trimmed}" has been added.`);
          setName("");
        },
        onError: (err) => {
          const msg = err?.response?.data?.error ?? "Failed to create category.";
          toast.error(msg);
        },
      }
    );
  };

  const handleUpdate = (cat) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === cat.name) { setEditingId(null); return; }
    update.mutate(
      { id: cat.id, body: { name: trimmed } },
      {
        onSuccess: () => {
          toast.success(`Renamed to "${trimmed}". All products updated.`);
          setEditingId(null);
        },
        onError: (err) => {
          const msg = err?.response?.data?.message || "Failed to rename category.";
          toast.error(msg);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`"${deleteTarget.name}" removed.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete category.";
        toast.error(msg);
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", to: "/admin/dashboard" },
          { label: "Categories" },
        ]}
      />

      {/* Header */}
      <div className="border-b border-border/40 pb-6">
        <h1 className="text-3xl font-serif tracking-wide mb-2">Categories</h1>
        <p className="text-muted-foreground text-sm">
          Manage product categories. The code prefix is auto-generated from the first two letters of the name.
        </p>
      </div>

      {/* Add form */}
      <div className="bg-card border border-border p-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-3">New Category</p>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rings, Necklaces, Earrings"
            className="flex h-10 w-full border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground flex-1"
          />
          <button
            type="submit"
            disabled={create.isPending || !name.trim()}
            className="inline-flex items-center gap-2 h-10 px-6 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
        {name.trim() && (
          <p className="text-xs text-muted-foreground mt-2">
            Code prefix will be:{" "}
            <span className="font-mono font-medium text-foreground">
              {autoPrefix}
            </span>
          </p>
        )}
      </div>

      {/* List */}
      <div className="bg-card border border-border">
        <div className="p-4 border-b border-border">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">
            Existing Categories
          </p>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-muted-foreground/50 font-serif text-lg italic">No categories yet.</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Add your first one above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors gap-3">
                {editingId === cat.id ? (
                  <div className="flex flex-col gap-2 flex-1 pr-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(cat);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex h-9 w-full border border-foreground bg-transparent px-3 text-sm focus:outline-none"
                    />
                    <div className="flex items-center gap-2  justify-end">
                      
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-7 px-4 border border-border text-xs hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(cat)}
                        disabled={update.isPending}
                        className="h-7 px-4 bg-foreground text-background text-xs hover:bg-foreground/85 transition-colors disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{cat.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/60 px-2 py-0.5 tracking-wider shrink-0">
                      {cat.codePrefix}
                    </span>
                  </div>
                )}

                {editingId !== cat.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="h-8 w-8 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.
            Categories with existing products cannot be deleted — reassign those products first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  );
};
