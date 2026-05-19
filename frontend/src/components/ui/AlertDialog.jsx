import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const AlertDialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="alert-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            key="alert-card"
            className="relative z-10 w-full max-w-md bg-background border border-border p-6 shadow-lg"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.7 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
      'h-10 px-6 bg-primary text-primary-foreground text-xs uppercase tracking-widest font-light hover:bg-primary/90 transition-colors',
      className
    )}
    {...props}
  >
    {children}
  </button>
);
