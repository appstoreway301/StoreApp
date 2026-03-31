import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem('guestCart');
      setItems(stored ? JSON.parse(stored) : []);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Sync guest cart to server on login
  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem('guestCart');
      if (stored) {
        const guestItems = JSON.parse(stored);
        if (guestItems.length > 0) {
          Promise.all(
            guestItems.map(item =>
              api.post('/cart', { productId: item.product_id, quantity: item.quantity }).catch(() => {})
            )
          ).then(() => {
            localStorage.removeItem('guestCart');
            fetchCart();
          });
        } else {
          localStorage.removeItem('guestCart');
        }
      }
    }
  }, [isAuthenticated]);

  function saveGuestCart(newItems) {
    localStorage.setItem('guestCart', JSON.stringify(newItems));
    setItems(newItems);
  }

  async function addItem(product, quantity = 1) {
    if (!isAuthenticated) {
      const existing = items.find(i => i.product_id === product.id);
      let newItems;
      if (existing) {
        newItems = items.map(i =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        newItems = [...items, {
          id: Date.now(),
          product_id: product.id,
          name: product.name,
          price_cents: product.price_cents,
          image_url: product.image_url,
          quantity,
        }];
      }
      saveGuestCart(newItems);
      return;
    }
    const { data } = await api.post('/cart', { productId: product.id, quantity });
    setItems(data.items);
  }

  async function updateQuantity(itemId, quantity) {
    if (!isAuthenticated) {
      const newItems = items.map(i =>
        i.id === itemId ? { ...i, quantity } : i
      );
      saveGuestCart(newItems);
      return;
    }
    const { data } = await api.put(`/cart/${itemId}`, { quantity });
    setItems(data.items);
  }

  async function removeItem(itemId) {
    if (!isAuthenticated) {
      const newItems = items.filter(i => i.id !== itemId);
      saveGuestCart(newItems);
      return;
    }
    const { data } = await api.delete(`/cart/${itemId}`);
    setItems(data.items);
  }

  async function clearCart() {
    if (!isAuthenticated) {
      saveGuestCart([]);
      return;
    }
    await api.delete('/cart');
    setItems([]);
  }

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading, cartCount, cartTotal,
      addItem, updateQuantity, removeItem, clearCart, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
