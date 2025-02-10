import React from "react";
import { io } from "socket.io-client";
import { createContext, useContext } from "react";

const SocketContext = createContext(null);

const useSocket = () => {
  return useContext(SocketContext);
};

const SocketProvider = ({ children }) => {
  const socket = io("http://64.227.175.71:4000");

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export { useSocket, SocketProvider };
