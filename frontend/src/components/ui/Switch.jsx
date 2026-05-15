import { cn } from '@/lib/utils';

/*
  Track: w-12 (48px), border-2 each side → inner = 44px
  Thumb: 20px wide
  OFF translate: 2px (1px margin from left)
  ON  translate: 44 - 20 - 2 = 22px → use 22px for full travel
*/
export const Switch = ({ checked, onCheckedChange, className, id, disabled }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onCheckedChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
      'transition-colors duration-300 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-40',
      checked
        ? 'bg-foreground shadow-[inset_0_1px_3px_rgba(0,0,0,0.25)]'
        : 'bg-input shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]',
      className
    )}
  >
    <span
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-white',
        'shadow-[0_1px_4px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(0,0,0,0.08)]',
        'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        checked ? 'translate-x-[24px]' : 'translate-x-[1px]'
      )}
    />
  </button>
);
