import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on init
    const savedCart = localStorage.getItem('qr-restaurant-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('qr-restaurant-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(i => i.cartId === item.cartId);
      
      if (existingIndex > -1) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: (updated[existingIndex].qty || 1) + (item.qty || item.quantity || 1)
        };
        return updated;
      }
      
      // Add new item
      return [...prev, { 
        ...item, 
        qty: item.qty || item.quantity || 1,
        cartId: item.cartId || `${item._id}-${Date.now()}`
      }];
    });
  };

  const removeItem = (cartId) => {
    setCart((prev) => prev.filter(i => i.cartId !== cartId && i._id !== cartId));
  };

  const updateItemQuantity = (cartId, qty) => {
    if (qty <= 0) {
      removeItem(cartId);
      return;
    }
    
    setCart((prev) => prev.map(i => 
      (i.cartId === cartId || i._id === cartId) 
        ? { ...i, qty } 
        : i
    ));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('qr-restaurant-cart');
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + (item.qty || item.quantity || 0), 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.price || 0;
      const qty = item.qty || item.quantity || 0;
      return total + (price * qty);
    }, 0);
  };

  const getCartSubtotal = () => getCartTotal();

  const getServiceCharge = () => getCartTotal() * 0.1;

  const getGST = () => getCartTotal() * 0.18;

  const getGrandTotal = () => {
    const subtotal = getCartTotal();
    const serviceCharge = getServiceCharge();
    const gst = getGST();
    return subtotal + serviceCharge + gst;
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeItem,
      updateItemQuantity,
      clearCart,
      getCartItemCount,
      getCartTotal,
      getCartSubtotal,
      getServiceCharge,
      getGST,
      getGrandTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};
