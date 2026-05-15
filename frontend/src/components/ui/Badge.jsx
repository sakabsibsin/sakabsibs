import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-background/80 text-primary border border-border backdrop-blur-sm',
  outline: 'border border-primary/20 text-primary/70',
};

export const Badge = ({ className, variant = 'default', children }) => (
  <span className={cn(
    'inline-flex items-center px-2.5 py-0.5 text-2xs tracking-[0.15em] uppercase font-light',
    variants[variant],
    className
  )}>
    {children}
  </span>
);
