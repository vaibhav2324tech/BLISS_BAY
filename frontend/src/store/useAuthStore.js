import { create } from "zustand";
import axios from "../api/axios";

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("qr-restaurant-user")) || null,
  token: localStorage.getItem("token") || null,

  // Login
  login: async (username, password) => {
    try {
      const res = await axios.post("/auth/login", { username, password });

      if (res.data.success) {
        const { user, token } = res.data;

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);

        set({ user, token });
      }

      return res.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  // Get current user
  getUser: () => {
    return JSON.parse(localStorage.getItem("user"));
  },

  // Refresh token (optional if backend supports it)
  refreshToken: async () => {
    try {
      const res = await axios.post("/auth/refresh", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        set({ token: res.data.token });
      }
    } catch (err) {
      console.error("Token refresh failed", err);
    }
  }
}));
