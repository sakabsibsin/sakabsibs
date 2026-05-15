import { cn } from '@/lib/utils';

export const Table = ({ className, ...props }) => (
  <div className="relative w-full overflow-auto">
    <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr
    className={cn('border-b border-border transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted', className)}
    {...props}
  />
);

export const TableHead = ({ className, ...props }) => (
  <th
    className={cn('h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-widest [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
);
