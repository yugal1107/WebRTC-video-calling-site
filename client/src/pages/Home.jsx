import { React, useState } from "react";
import { useSocket } from "../providers/SocketProvider";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const socket = useSocket();

  const handleJoin = (e) => {
    e.preventDefault();

    socket.emit("join-room", roomId);

    navigate(`/room/${roomId}`);
  };

  return (
    <div className="container flex flex-col items-center justify-center h-screen">
      <div className="bg-amber-50 p-4 rounded shadow-md">
        <form onSubmit={handleJoin} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border rounded"
          />
          <button type="submit" className="p-2 bg-blue-500 text-white rounded">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
