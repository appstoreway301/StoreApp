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
      // ✅ Asegurar que la imagen de la variante se use si existe
      const itemsWithImages = data.items.map(item => ({
        ...item,
        image_url: item.variant_image_url || item.product_image_url || null
      }));
      console.log('📦 Carrito desde backend:', itemsWithImages);
      setItems(itemsWithImages);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem('guestCart');
      if (stored) {
        const guestItems = JSON.parse(stored);
        if (guestItems.length > 0) {
          Promise.all(
            guestItems.map(item =>
              api.post('/cart', {
                productId: item.product_id,
                quantity: item.quantity,
                variantId: item.variantId
              }).catch(() => {})
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
    console.log('💾 Guardando guest cart:', newItems);
    localStorage.setItem('guestCart', JSON.stringify(newItems));
    setItems(newItems);
  }

  async function addItem(product, quantity = 1) {
    console.log('🛒 Agregando al carrito - PRODUCTO:', product);
    console.log('🛒 variantId:', product.variantId);
    console.log('🛒 size:', product.size);
    console.log('🛒 color:', product.color);

    const imageToUse = product.variantImage || product.image_url || product.image || null;

    // 🔧 IMPORTANTE: Asegurar que variantId sea un número o null
    const variantId = product.variantId ? Number(product.variantId) : null;

    if (!isAuthenticated) {
      const existing = items.find(i => i.product_id === product.id && i.variantId === variantId);
      let newItems;
      if (existing) {
        newItems = items.map(i =>
          i.product_id === product.id && i.variantId === variantId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        newItems = [...items, {
          id: Date.now(),
          product_id: product.id,
          variantId: variantId,
          name: product.name,
          price_cents: product.price_cents,
          image_url: imageToUse,
          size: product.size || null,
          color: product.color || null,
          quantity,
        }];
      }
      saveGuestCart(newItems);
      return;
    }

    try {
      // 🔧 Asegurar que el cuerpo de la petición tenga los campos correctos
      const payload = {
        productId: Number(product.id),
        quantity: Number(quantity),
        variantId: variantId // 👈 Enviar variantId correctamente
      };
      console.log('📤 Enviando al backend:', payload);

      const { data } = await api.post('/cart', payload);
      // ✅ Asegurar que la imagen de la variante se use si existe
      const itemsWithImages = data.items.map(item => ({
        ...item,
        image_url: item.variant_image_url || item.product_image_url || null
      }));
      console.log('✅ Carrito actualizado:', itemsWithImages);
      setItems(itemsWithImages);
    } catch (error) {
      console.error('❌ Error al agregar al carrito:', error);
    }
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
    const itemsWithImages = data.items.map(item => ({
      ...item,
      image_url: item.variant_image_url || item.product_image_url || null
    }));
    setItems(itemsWithImages);
  }

  async function removeItem(itemId) {
    if (!isAuthenticated) {
      const newItems = items.filter(i => i.id !== itemId);
      saveGuestCart(newItems);
      return;
    }
    const { data } = await api.delete(`/cart/${itemId}`);
    const itemsWithImages = data.items.map(item => ({
      ...item,
      image_url: item.variant_image_url || item.product_image_url || null
    }));
    setItems(itemsWithImages);
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