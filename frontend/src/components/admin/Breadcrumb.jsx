import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** Usage:
 *  <Breadcrumb items={[
 *    { label: 'Dashboard', to: '/admin/dashboard' },
 *    { label: 'Products' },   // no `to` = current page (not linked)
 *  ]} />
 */
export const Breadcrumb = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav className="flex items-center gap-1.5 mb-6 text-xs text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="hover:text-foreground transition-colors duration-150 uppercase tracking-widest"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-foreground font-medium uppercase tracking-widest' : 'uppercase tracking-widest'}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
};
