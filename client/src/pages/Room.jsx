import React, { useEffect, useRef } from "react";
import { useSocket } from "../providers/SocketProvider";
import { useParams } from "react-router-dom";

const Room = () => {
  const socket = useSocket();
  const { roomId } = useParams();

  const localVideo = useRef();
  const remoteVideo = useRef();
  const peerConnection = useRef();

  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    const init = async () => {
      const stream = await getMediaStream();
      setupPeerConnection(stream);
      setupSocketListeners();
      socket.emit("join-room", roomId);
    };

    const setupPeerConnection = (stream) => {
      peerConnection.current = new RTCPeerConnection(configuration);

      // Add tracks instead of the deprecated addStream()
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      // ICE Candidate handling
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", roomId, event.candidate);
        }
      };

      // Remote stream handling
      peerConnection.current.ontrack = (event) => {
        remoteVideo.current.srcObject = event.streams[0];
      };
    };

    const setupSocketListeners = () => {
      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("ice-candidate", handleIceCandidate);
    };

    const handleOffer = async (offer) => {
      try {
        await peerConnection.current.setRemoteDescription(offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", roomId, answer);
      } catch (err) {
        console.error("Offer handling failed:", err);
      }
    };

    const handleAnswer = async (answer) => {
      try {
        await peerConnection.current.setRemoteDescription(answer);
      } catch (err) {
        console.error("Answer handling failed:", err);
      }
    };

    const handleIceCandidate = async (candidate) => {
      try {
        await peerConnection.current.addIceCandidate(candidate);
      } catch (err) {
        console.error("ICE candidate error:", err);
      }
    };

    const getMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideo.current.srcObject = stream;
        return stream;
      } catch (err) {
        console.error("Media access error:", err);
      }
    };

    init();

    return () => {
      // Cleanup on unmount
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [socket, roomId]);

  const createOffer = async () => {
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("offer", roomId, offer);
    } catch (err) {
      console.error("Offer creation failed:", err);
    }
  };

  return (
    <div>
      <h1>Room: {roomId}</h1>
      <video ref={localVideo} autoPlay playsInline muted />
      <video ref={remoteVideo} autoPlay playsInline />
      <button onClick={createOffer}>Create Offer</button>
    </div>
  );
};

export default Room;