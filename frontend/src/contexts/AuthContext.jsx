import React, { createContext, useContext, useState } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('qr-restaurant-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password, role) => {
    setLoading(true);
    
    try {
      const res = await axios.post('/auth/login', {
        username,
        password,
        role
      });

      if (res.data.success) {
        const userData = { username, role, token: res.data.token };
        setUser(userData);
        localStorage.setItem('qr-restaurant-user', JSON.stringify(userData));
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        
        return { success: true };
      } else {
        return { success: false, message: res.data.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      // Demo credentials for development
      const demoCredentials = {
        'admin-admin123': 'admin',
        'kitchen-kitchen123': 'kitchen', 
        'cashier-cashier123': 'cashier',
        'manager-manager123': 'manager',
        'waiter-waiter123': 'waiter'
      };

      const credKey = `${username}-${password}`;
      if (demoCredentials[credKey] === role) {
        const userData = { username, role };
        setUser(userData);
        localStorage.setItem('qr-restaurant-user', JSON.stringify(userData));
        return { success: true };
      }

      return { success: false, message: 'Invalid credentials' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('qr-restaurant-user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    return Array.isArray(requiredRoles) 
      ? requiredRoles.includes(user.role)
      : user.role === requiredRoles;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      hasRole,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
