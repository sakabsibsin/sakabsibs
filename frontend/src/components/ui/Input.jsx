import { cn } from '@/lib/utils';

export const Input = ({ className, ...props }) => (
  <input
    className={cn(
      'flex h-11 w-full border border-input bg-transparent px-4 py-2 text-sm font-light transition-all duration-200 ease-luxury',
      'placeholder:text-muted-foreground/60',
      'hover:border-foreground/30',
      'focus-visible:outline-none focus-visible:border-foreground focus-visible:ring-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
    {...props}
  />
);
