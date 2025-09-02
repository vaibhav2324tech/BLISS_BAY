import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socket;

export const useSocket = (events = {}, room = null) => {
  const socketRef = useRef();

  useEffect(() => {
    if (!socket) {
      socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
        withCredentials: true,
      });
    }
    socketRef.current = socket;

    if (room) socket.emit("join-room", room);

    // Register event listeners
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [room]);

  return socketRef.current;
};
