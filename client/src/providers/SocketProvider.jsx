// File: ./frontend/src/providers/SocketProvider.jsx

import React from "react";
import { io } from "socket.io-client";
import { createContext, useContext, useEffect, useState } from "react";

const SocketContext = createContext(null);

// Custom hook to use the socket context
export const useSocket = () => {
  return useContext(SocketContext);
};

// Provider component
export const SocketProvider = ({ children }) => {
  // Use useState with a function to ensure io() is called only once
  const [socket] = useState(() => io("http://localhost:5000"));

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};