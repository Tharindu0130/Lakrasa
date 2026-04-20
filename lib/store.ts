import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from './supabaseClient';
import { CartItem } from './cart-storage';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface AppState {
  // Auth & Profile
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  setSession: (session: { user: { id: string; email?: string } } | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;

  // Cart (Persisted)
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth & Profile
      user: null,
      profile: null,
      isInitialized: false,
      setSession: (session) => {
        set({ user: session?.user ?? null, isInitialized: true });
        if (session?.user) {
          get().fetchProfile(session.user.id);
        } else {
          set({ profile: null });
        }
      },
      fetchProfile: async (userId) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (!error && data) {
          set({ profile: data });
        }
      },
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return { error: new Error('No user') };

        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (!error && data) {
          set({ profile: data });
        }
        return { error: error ? new Error(error.message) : null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
      },

      // Cart
      cart: [],
      addToCart: (input, quantity = 1) => {
        const { cart } = get();
        const safeQty = Math.max(1, quantity);
        const existing = cart.find((item) => item.id === input.id);

        const nextCart = existing
          ? cart.map((item) =>
              item.id === input.id ? { ...item, quantity: item.quantity + safeQty } : item
            )
          : [...cart, { ...input, quantity: safeQty }];
        
        set({ cart: nextCart });
      },
      removeFromCart: (id) => {
        const { cart } = get();
        set({ cart: cart.filter((item) => item.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        const { cart } = get();
        const nextCart = cart
          .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
          .filter((item) => item.quantity > 0);
        set({ cart: nextCart });
      },
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'lakrasa-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: state.cart }), // Only persist cart for now
    }
  )
);
