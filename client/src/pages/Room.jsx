// File: ./frontend/src/Room.jsx

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../providers/SocketProvider";
import { useParams } from "react-router-dom";

const Room = () => {
  const socket = useSocket();
  const { roomId } = useParams();

  // Refs for video elements and the peer connection
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();

  // State to manage remote stream and connection status
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState("Connecting...");

  // WebRTC STUN server configuration
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    // ---- WebRTC and Socket Event Handlers ----

    // Handles the 'user-joined' event from another user
    const handleUserJoined = async () => {
      console.log("A new user has joined. Creating offer...");
      setStatus("Connecting...");
      await createOffer();
    };

    // Creates a WebRTC offer
    const createOffer = async () => {
      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit("offer", roomId, offer);
      } catch (err) {
        console.error("Failed to create offer:", err);
      }
    };

    // Handles an incoming offer from another peer
    const handleOffer = async (offer) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(offer);
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", roomId, answer);
      } catch (err) {
        console.error("Failed to handle offer:", err);
      }
    };

    // Handles an incoming answer from another peer
    const handleAnswer = async (answer) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(answer);
      } catch (err) {
        console.error("Failed to handle answer:", err);
      }
    };

    // Handles incoming ICE candidates
    const handleIceCandidate = async (candidate) => {
      try {
        if (candidate) {
          await peerConnectionRef.current.addIceCandidate(candidate);
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    // ---- Initialization Logic ----

    const init = async () => {
      // 1. Get user's camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setStatus("Waiting for another user to join...");

      // 2. Create RTCPeerConnection
      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // 3. Add local tracks to the connection
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // 4. Set up event listeners for the peer connection
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", roomId, event.candidate);
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setStatus("Connected");
      };

      // 5. Set up socket event listeners
      socket.on("user-joined", handleUserJoined);
      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("ice-candidate", handleIceCandidate);

      // 6. Join the room
      socket.emit("join-room", roomId);
    };

    init();

    // ---- Cleanup Logic ----
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      // Remove all socket listeners to prevent memory leaks. [16, 17, 18]
      socket.off("user-joined", handleUserJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [roomId, socket]);

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>
      <p className="mb-4">{status}</p>
      <div className="flex justify-center gap-4 w-full">
        {/* Local Video */}
        <div className="bg-black rounded-lg overflow-hidden w-1/2">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
        </div>

        {/* Remote Video */}
        <div className="bg-black rounded-lg overflow-hidden w-1/2">
          {remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
              onLoadedData={() => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteStream;
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;