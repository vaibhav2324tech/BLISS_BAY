// store.js
import { create } from "zustand";

export const useOrderStore = create((set) => ({
  orderId: null,
  setOrderId: (id) => set({ orderId: id }),
}));
