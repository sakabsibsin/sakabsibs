import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

const variants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs tracking-[0.12em] font-light uppercase transition-all duration-200 ease-luxury focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/85 active:scale-[0.98]',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/85',
        outline: 'border border-foreground/20 bg-transparent hover:border-foreground hover:bg-foreground hover:text-background active:scale-[0.98]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 px-4 text-2xs',
        lg: 'h-12 px-10',
        icon: 'h-9 w-9 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export const Button = ({ className, variant, size, children, ...props }) => (
  <button className={cn(variants({ variant, size, className }))} {...props}>
    {children}
  </button>
);
