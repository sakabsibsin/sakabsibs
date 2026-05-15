import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export const AlertDialog = ({ open, onOpenChange, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div ref={ref} className="relative z-10 w-full max-w-md bg-background border border-border p-6 shadow-lg">
        {children}
      </div>
    </div>
  );
};

export const AlertDialogHeader = ({ className, ...props }) => (
  <div className={cn('mb-4 space-y-2', className)} {...props} />
);

export const AlertDialogTitle = ({ className, ...props }) => (
  <h2 className={cn('font-serif text-xl tracking-wide', className)} {...props} />
);

export const AlertDialogDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export const AlertDialogFooter = ({ className, ...props }) => (
  <div className={cn('mt-6 flex justify-end gap-3', className)} {...props} />
);

export const AlertDialogCancel = ({ className, onClick, children, ...props }) => (
  <button
    onClick={onClick}
    className={cn(
      'h-10 px-6 border border-border text-xs uppercase tracking-widest font-light hover:bg-muted transition-colors',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export const AlertDialogAction = ({ className, children, ...props }) => (
  <button
    className={cn(
      'h-10 px-6 bg-destructive text-destructive-foreground text-xs uppercase tracking-widest font-light hover:bg-destructive/90 transition-colors',
      className
    )}
    {...props}
  >
    {children}
  </button>
);
