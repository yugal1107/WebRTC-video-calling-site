// File: ./frontend/src/Room.jsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../providers/SocketProvider";
import { useParams } from "react-router-dom";

const Room = () => {
  const socket = useSocket();
  const { roomId } = useParams();

  // Refs for video elements and the peer connection
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();

  // State to provide UI feedback to the user
  const [status, setStatus] = useState("Initializing...");
  const [isCallButtonVisible, setCallButtonVisible] = useState(false);

  // WebRTC STUN server configuration
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.l.google.com:5349" },
      { urls: "stun:stun1.l.google.com:3478" },
      { urls: "stun:stun1.l.google.com:5349" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:5349" },
      { urls: "stun:stun3.l.google.com:3478" },
      { urls: "stun:stun3.l.google.com:5349" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:5349" },
    ],
  };

  // ----- WebRTC and Socket Event Handlers -----

  // Use useCallback to memoize handlers, preventing re-creations on each render
  const handleOffer = useCallback(
    async (offer) => {
      if (peerConnectionRef.current) {
        console.log("Received offer, creating answer...");
        setStatus("Incoming call...");
        await peerConnectionRef.current.setRemoteDescription(offer);
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", roomId, answer);
        setStatus("Connected");
      }
    },
    [roomId, socket]
  );

  const handleAnswer = useCallback(async (answer) => {
    if (peerConnectionRef.current) {
      console.log("Received answer.");
      await peerConnectionRef.current.setRemoteDescription(answer);
      setStatus("Connected");
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(candidate);
    }
  }, []);

  // ----- Initialization Effect -----

  useEffect(() => {
    // This function sets up local media and the peer connection object
    const init = async () => {
      try {
        // 1. Get user media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Create the RTCPeerConnection object
        const pc = new RTCPeerConnection(configuration);
        peerConnectionRef.current = pc;

        // 3. Add local media tracks to the connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // 4. Set up event handlers for the peer connection
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", roomId, event.candidate);
          }
        };

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        setStatus("Ready. Click 'Call' when the other user has joined.");
        setCallButtonVisible(true);
      } catch (err) {
        console.error("Initialization failed:", err);
        setStatus("Error: Could not access camera or microphone.");
      }
    };

    init();

    // 5. Set up socket event listeners
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    // Let the server know this client has joined the room
    socket.emit("join-room", roomId);

    // Cleanup function runs on component unmount
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      // Stop camera tracks
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket, roomId, handleOffer, handleAnswer, handleIceCandidate]);

  // ----- Button Click Handler -----

  // This function is called when the user clicks the "Create Offer" button
  const handleCreateOffer = async () => {
    if (peerConnectionRef.current) {
      console.log("Creating offer...");
      setStatus("Calling...");
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit("offer", roomId, offer);
      } catch (err) {
        console.error("Offer creation failed:", err);
        setStatus("Failed to create call offer.");
      }
    } else {
      console.error("Peer connection is not initialized.");
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-2">Room: {roomId}</h1>
      <p className="mb-4 text-gray-400">{status}</p>

      <div className="flex flex-col md:flex-row justify-center gap-4 w-full max-w-5xl mb-4">
        {/* Local Video */}
        <div className="relative bg-black rounded-lg overflow-hidden w-full md:w-1/2">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
            You
          </p>
        </div>

        {/* Remote Video */}
        <div className="relative bg-black rounded-lg overflow-hidden w-full md:w-1/2">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-auto"
          />
          <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
            Remote User
          </p>
        </div>
      </div>

      {isCallButtonVisible && (
        <button
          onClick={handleCreateOffer}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Call / Create Offer
        </button>
      )}
    </div>
  );
};

export default Room;
