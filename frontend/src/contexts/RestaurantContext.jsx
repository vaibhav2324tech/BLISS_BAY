import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const RestaurantContext = createContext();

export const useRestaurant = () => useContext(RestaurantContext);

export const RestaurantProvider = ({ children }) => {
  const [currentTable, setCurrentTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load menu items from backend
  const loadMenuItems = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/menu');
      if (res.data.success) {
        setMenuItems(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load menu items:', error);
      // Fallback demo data
      setMenuItems([
        { _id: '1', name: 'Caesar Salad', price: 450, category: 'Starters', isVeg: true, emoji: '🥗' },
        { _id: '2', name: 'Margherita Pizza', price: 650, category: 'Mains', isVeg: true, emoji: '🍕' },
        { _id: '3', name: 'Grilled Chicken', price: 750, category: 'Mains', isVeg: false, emoji: '🍗' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tables
  const loadTables = async () => {
    try {
      const res = await axios.get('/tables');
      if (res.data.success) {
        setTables(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  useEffect(() => {
    loadMenuItems();
    loadTables();
  }, []);

  const getOrderDetails = async (orderId) => {
    try {
      const res = await axios.get(`/orders/${orderId}`);
      return res.data;
    } catch (error) {
      console.error('Failed to get order details:', error);
      return null;
    }
  };

  return (
    <RestaurantContext.Provider value={{
      currentTable,
      setCurrentTable,
      menuItems,
      orders,
      tables,
      isLoading,
      loadMenuItems,
      getOrderDetails
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};
