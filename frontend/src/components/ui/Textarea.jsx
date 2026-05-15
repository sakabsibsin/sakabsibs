import { cn } from '@/lib/utils';

export const Textarea = ({ className, ...props }) => (
  <textarea
    className={cn('flex min-h-[80px] w-full border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50', className)}
    {...props}
  />
);
