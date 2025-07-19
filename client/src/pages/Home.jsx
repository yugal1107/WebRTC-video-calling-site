// File: ./frontend/src/Home.jsx

import { React, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  // Handle form submission to join a room
  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim() !== "") {
      // Navigate to the room URL
      navigate(`/room/${roomId}`);
    } else {
      alert("Please enter a Room ID.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Video Chat</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <form onSubmit={handleJoin} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;