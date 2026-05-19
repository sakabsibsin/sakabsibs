import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ArrowLeft, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/features/categories/hooks";
import { useProductStats, productKeys } from "@/features/products/hooks";
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
import { cn, getApiError } from "@/lib/utils";

const inputCls =
  "flex h-10 w-full border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground";

export const CategoriesPage = () => {
  const qc = useQueryClient();
  const [name, setName]               = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId]     = useState(null);
  const [editName, setEditName]       = useState("");

  const { data: categories = [], isLoading } = useCategories();
  const { data: stats }                       = useProductStats();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const autoPrefix  = name.trim().substring(0, 2).toUpperCase();
  const countMap    = Object.fromEntries(
    (stats?.categories ?? []).map((c) => [c.category, c.count])
  );

  const handleCreate = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      { name: trimmed, codePrefix: trimmed.substring(0, 2).toUpperCase() },
      {
        onSuccess: () => { toast.success(`"${trimmed}" added.`); setName(""); },
        onError: (err) => toast.error(getApiError(err, 'Failed to create category.')),
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
          toast.success(`Renamed to "${trimmed}".`);
          setEditingId(null);
          // Swap old category name in stats cache immediately — no refetch needed,
          // prevents the brief flash to 0 while waiting for a fresh response.
          qc.setQueryData(productKeys.stats(), (old) => {
            if (!old) return old;
            return {
              ...old,
              categories: old.categories.map((c) =>
                c.category === cat.name ? { ...c, category: trimmed } : c
              ),
            };
          });
        },
        onError: (err) => toast.error(getApiError(err, 'Failed to rename category.')),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success(`"${deleteTarget.name}" removed.`); setDeleteTarget(null); },
      onError: (err) => {
        toast.error(getApiError(err, 'Failed to delete category.'));
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="max-w-5xl pb-12">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/dashboard"
          className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-2xl font-serif tracking-wide">Categories</h1>
          {!isLoading && (
            <span className="text-xs text-muted-foreground/50 tabular-nums">
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </span>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5 items-start">

        {/* ── Left: Add form ─────────────────────── */}
        <div className="bg-card border border-border p-5 space-y-4 md:sticky md:top-[70px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-0.5">New Category</p>
            <p className="text-xs text-muted-foreground/45">
              A 2-letter code prefix is auto-generated from the name.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rings, Earrings, Bangles"
                className={inputCls}
              />
              {name.trim() && (
                <p className="text-[11px] text-muted-foreground/55 mt-1.5">
                  Code prefix:{" "}
                  <span className="font-mono font-semibold text-foreground">{autoPrefix}</span>
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={create.isPending || !name.trim()}
              className="w-full h-10 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Category
            </button>
          </form>

          {/* Mini stat */}
          {!isLoading && categories.length > 0 && (
            <div className="border-t border-border/40 pt-3 flex items-center gap-2 text-xs text-muted-foreground/50">
              <Tag className="h-3 w-3" />
              {stats?.total ?? 0} total products across all categories
            </div>
          )}
        </div>

        {/* ── Right: Category list ────────────────── */}
        <div className="bg-card border border-border">

          {/* List header */}
          <div className="grid grid-cols-[1fr_60px_80px_72px] items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/45 font-semibold">Name</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/45 font-semibold text-center">Prefix</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/45 font-semibold text-center">Products</span>
            <div />
          </div>

          {isLoading ? (
            <div className="divide-y divide-border/30">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_72px] items-center gap-2 px-4 py-3.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-5 w-10 mx-auto" />
                  <Skeleton className="h-3 w-8 mx-auto" />
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-7 w-7" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-center">
              <Tag className="h-7 w-7 text-muted-foreground/20" />
              <p className="font-serif text-lg font-light text-muted-foreground/50">No categories yet</p>
              <p className="text-xs text-muted-foreground/35">Add your first category using the form.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/30">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <div className="grid grid-cols-[1fr_60px_80px_72px] items-center gap-2 px-4 py-3.5 hover:bg-muted/20 transition-colors">
                    <span className="text-sm font-medium truncate">{cat.name}</span>

                    <div className="flex justify-center">
                      <span className="text-[10px] font-mono font-semibold text-foreground/70 bg-muted px-2 py-0.5 tracking-wider">
                        {cat.codePrefix}
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <span className={cn(
                        "text-sm tabular-nums",
                        (countMap[cat.name] ?? 0) > 0
                          ? "text-foreground font-medium"
                          : "text-muted-foreground/30"
                      )}>
                        {countMap[cat.name] ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                        className="h-7 w-7 flex items-center justify-center text-primary/40 hover:text-primary transition-colors"
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="h-7 w-7 flex items-center justify-center text-red-400/50 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            key="edit-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingId(null)} />
            <motion.div
              key="edit-modal-card"
              className="relative z-10 w-full max-w-sm bg-background border border-border shadow-xl p-6 space-y-5"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.7 }}
            >
              <div>
                <h2 className="font-serif text-xl font-light">Rename Category</h2>
                <p className="text-xs text-muted-foreground/55 mt-1">
                  Renaming will update all products in this category.
                </p>
              </div>
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(categories.find((c) => c.id === editingId));
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="flex h-10 w-full border border-border bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 h-10 border border-border text-xs uppercase tracking-widest font-light hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdate(categories.find((c) => c.id === editingId))}
                  disabled={update.isPending || !editName.trim()}
                  className="flex-1 h-10 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  {update.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete category?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{deleteTarget?.name}</span> will be permanently removed.
            {(countMap[deleteTarget?.name] ?? 0) > 0 && (
              <span className="block mt-1 text-destructive">
                This category has {countMap[deleteTarget?.name]} product{countMap[deleteTarget?.name] !== 1 ? "s" : ""} — reassign them first.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  );
};
