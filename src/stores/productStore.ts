// src/stores/productStore.ts
// Active-product scope for the shared HUD shell. The product switcher in the
// topbar writes here; the active product id is persisted to localStorage so it
// survives reloads. NOTE: this is DISPLAY-ONLY scoping for now — the active
// product id is NOT yet threaded into other queries (sparks/pipelines/etc.).
//
// Products themselves come from the existing useProducts() React Query hook
// (GET /v1/products). Call useHydrateProductStore() once near the app root to
// push that query's data into this store; components then read the cached list
// + active selection from here without re-fetching.
import { useEffect } from 'react';
import { create } from 'zustand';
import type { Product } from '../api/types';
import { useProducts } from '../hooks/useProducts';

const ACTIVE_PRODUCT_KEY = 'tacticl.activeProductId';

function readStoredActiveId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_PRODUCT_KEY);
  } catch {
    return null;
  }
}

function writeStoredActiveId(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(ACTIVE_PRODUCT_KEY, id);
    else window.localStorage.removeItem(ACTIVE_PRODUCT_KEY);
  } catch {
    /* storage unavailable — keep in-memory state only */
  }
}

interface ProductState {
  products: Product[];
  activeProductId: string | null;
  /** Select the active product (persisted). Ignores unknown ids. */
  setActiveProduct: (id: string) => void;
  /**
   * Replace the product list (called from the useProducts() hook). Reconciles
   * the active selection: keeps a still-valid stored/active id, otherwise falls
   * back to the first product. Persists the resolved id.
   */
  setProducts: (products: Product[]) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  activeProductId: readStoredActiveId(),

  setActiveProduct: (id) => {
    const { products } = get();
    if (!products.some((p) => p.id === id)) return;
    writeStoredActiveId(id);
    set({ activeProductId: id });
  },

  setProducts: (products) => {
    const current = get().activeProductId ?? readStoredActiveId();
    const stillValid = current && products.some((p) => p.id === current);
    const resolved = stillValid ? current : (products[0]?.id ?? null);
    if (resolved !== get().activeProductId) writeStoredActiveId(resolved);
    set({ products, activeProductId: resolved });
  },
}));

/**
 * Hydrates the product store from the useProducts() query. Mount once high in
 * the tree (e.g. the shell/layout). Keeps the store in sync as the query
 * refetches. Returns the query's loading/error flags for callers that care.
 */
export function useHydrateProductStore() {
  const { data, isLoading, isError } = useProducts();
  const setProducts = useProductStore((s) => s.setProducts);

  useEffect(() => {
    if (data) setProducts(data);
  }, [data, setProducts]);

  return { isLoading, isError };
}

/** Convenience selector: the currently active Product object (or null). */
export function useActiveProduct(): Product | null {
  return useProductStore((s) => s.products.find((p) => p.id === s.activeProductId) ?? null);
}
