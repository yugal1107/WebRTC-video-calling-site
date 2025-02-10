import { Server } from "socket.io";

const io = new Server({
  cors: true,
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit("joined-room", roomId);

    socket.emit("joined-room", roomId);

    console.log("A user joined room", roomId);
  });

  socket.on("offer", (roomId, offer) => {
    console.log("Received offer from peer:", offer);
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", (roomId, answer) => {
    console.log("Received answer from peer:", answer);
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", (roomId, candidate) => {
    console.log("Received ICE candidate from peer:");
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

io.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
