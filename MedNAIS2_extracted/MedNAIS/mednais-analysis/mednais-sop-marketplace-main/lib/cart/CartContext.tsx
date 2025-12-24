'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartContextType {
  itemCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const refreshCart = async () => {
    try {
      const response = await fetch('/api/cart', { 
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setItemCount(data.itemCount || 0);
      } else {
        setItemCount(0);
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      setItemCount(0);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider value={{ itemCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
