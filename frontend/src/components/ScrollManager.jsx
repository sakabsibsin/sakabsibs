import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Persists across renders and route changes
const scrollPositions = new Map();

export const ScrollManager = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const key = location.pathname + location.search;

  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.set(key, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      // Capture the final position at the exact moment of leaving this route,
      // before the incoming page renders and anything resets
      scrollPositions.set(key, window.scrollY);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [key]);

  useEffect(() => {
    if (navType === 'POP') {
      const saved = scrollPositions.get(key);
      if (saved !== undefined && saved > 0) {
        // Double rAF ensures the page has fully painted before restoring,
        // which matters for async-rendered lists like the product catalog
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: saved, behavior: 'instant' });
          });
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [key, navType]);

  return null;
};
