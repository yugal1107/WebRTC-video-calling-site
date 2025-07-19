// File: ./backend/index.js

import http from "http";
import { Server } from "socket.io";

// Create an HTTP server
const server = http.createServer();

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity
    methods: ["GET", "POST"],
  },
});

// Listen for new connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle a user joining a room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    // Notify other users in the room that a new user has joined. [1, 2]
    socket.to(roomId).emit("user-joined", socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Relay the WebRTC offer to the other user in the room
  socket.on("offer", (roomId, offer) => {
    socket.to(roomId).emit("offer", offer);
  });

  // Relay the WebRTC answer to the other user in the room
  socket.on("answer", (roomId, answer) => {
    socket.to(roomId).emit("answer", answer);
  });

  // Relay ICE candidates to the other user in the room
  socket.on("ice-candidate", (roomId, candidate) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // This broadcast will notify all other clients that this user has left.
    socket.broadcast.emit("user-disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});