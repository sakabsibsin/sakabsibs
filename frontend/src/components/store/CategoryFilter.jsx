import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const CategoryFilter = ({ categories = [], selected, onChange }) => {
  const scrollRef = useRef(null);
  const items = ['', ...categories.map((c) => c.name)];

  const handleClick = (cat, el) => {
    onChange(cat);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  // When the selection is reset externally — typically the "Clear" button on
  // CatalogPage — the chip strip's internal scroll position doesn't change on
  // its own. If the user was scrolled deep into the category list, the new
  // "All" selection would be off-screen. Snap back to the start so the active
  // chip is always visible.
  useEffect(() => {
    if (selected === '' && scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [selected]);

  // Mouse drag-to-scroll
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = (e) => {
    dragState.current = { dragging: true, startX: e.pageX - scrollRef.current.offsetLeft, scrollLeft: scrollRef.current.scrollLeft };
    scrollRef.current.style.cursor = 'grabbing';
  };
  const onMouseUp = () => { dragState.current.dragging = false; scrollRef.current.style.cursor = ''; };
  const onMouseMove = (e) => {
    if (!dragState.current.dragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.2;
    scrollRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseMove={onMouseMove}
      className="flex gap-2 overflow-x-auto select-none"
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      {items.map((cat) => {
        const isActive = selected === cat;
        return (
          <button
            key={cat || 'all'}
            onClick={(e) => handleClick(cat, e.currentTarget)}
            className={cn(
              'relative shrink-0 text-2xs tracking-[0.18em] uppercase font-light px-4 py-2 border whitespace-nowrap overflow-hidden transition-colors duration-200',
              isActive
                ? 'border-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
            )}
          >
            {/* Sliding background pill */}
            {isActive && (
              <motion.span
                layoutId="cat-active-bg"
                className="absolute inset-0 bg-foreground"
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            )}
            {/* Label sits above the background */}
            <span className="relative z-10">{cat || 'All'}</span>
          </button>
        );
      })}
    </div>
  );
};
