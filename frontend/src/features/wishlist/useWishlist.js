import { useSyncExternalStore, useCallback } from 'react';

// localStorage-backed wishlist for unauthenticated customers. Module-level
// store + useSyncExternalStore so every consumer reads from the same source
// of truth without prop drilling or Context. Cross-tab sync via the native
// `storage` event; same-tab sync via local listeners.

const KEY = 'sakabsibs_wishlist';

const readStorage = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

let cache = readStorage();
const listeners = new Set();
const emit = () => listeners.forEach((cb) => cb());

const write = (next) => {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage can throw in private-mode Safari or when quota is exceeded.
    // Silently ignore — the in-memory cache still works for this session.
  }
  emit();
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    cache = readStorage();
    emit();
  });
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const getSnapshot = () => cache;

export const useWishlist = () => {
  const wishlist = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const has = useCallback((id) => cache.includes(id), []);
  const add = useCallback((id) => {
    if (!id || cache.includes(id)) return;
    write([...cache, id]);
  }, []);
  const remove = useCallback((id) => {
    if (!id || !cache.includes(id)) return;
    write(cache.filter((x) => x !== id));
  }, []);
  const toggle = useCallback((id) => {
    if (!id) return false;
    if (cache.includes(id)) {
      write(cache.filter((x) => x !== id));
      return false;
    }
    write([...cache, id]);
    return true;
  }, []);
  const clear = useCallback(() => write([]), []);

  return {
    wishlist,
    count: wishlist.length,
    has,
    add,
    remove,
    toggle,
    clear,
  };
};
