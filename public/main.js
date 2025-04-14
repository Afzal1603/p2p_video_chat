// Socket.io connection
const socket = io();
let localStream;
let remoteStream;
let peerConnection;
let videoMuted = false;
let audioMuted = false;
let roomId;

// STUN server configuration
const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Join Room
function joinRoom() {
  roomId = document.getElementById("room-id").value;
  if (!roomId) return alert("Please enter a room ID");

  socket.emit("join-room", roomId);

  document.getElementById("join-room-container").style.display = "none";
  document.getElementById("video-container").style.display = "flex";

  init();
}

// Initialize WebRTC connection and local stream
async function init() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  document.getElementById("user-1").srcObject = localStream;

  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle incoming remote streams
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  peerConnection.ontrack = (event) => {
    event.streams[0]
      .getTracks()
      .forEach((track) => remoteStream.addTrack(track));
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", {
        type: "candidate",
        candidate: event.candidate,
        roomId,
      });
    }
  };

  // Create and send offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("signal", {
    type: "offer",
    offer,
    roomId,
  });
}

// Handle signaling messages
socket.on("signal", async (data) => {
  if (data.type === "offer") {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signal", {
      type: "answer",
      answer,
      roomId,
    });
  } else if (data.type === "answer") {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  } else if (data.type === "candidate") {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

// Mute Video
function toggleVideoMute() {
  videoMuted = !videoMuted;
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoMuted;
  }
  document.getElementById("mute-video").textContent = videoMuted
    ? "Unmute Video"
    : "Mute Video";
}

// Mute Audio
function toggleAudioMute() {
  audioMuted = !audioMuted;
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioMuted;
  }
  document.getElementById("mute-audio").textContent = audioMuted
    ? "Unmute Audio"
    : "Mute Audio";
}

// End Call
function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    localStream.getTracks().forEach((track) => track.stop());
    document.getElementById("user-1").srcObject = null;
    document.getElementById("user-2").srcObject = null;
    document.getElementById("join-room-container").style.display = "flex";
    document.getElementById("video-container").style.display = "none";
  }
}

document
  .getElementById("mute-video")
  .addEventListener("click", toggleVideoMute);
document
  .getElementById("mute-audio")
  .addEventListener("click", toggleAudioMute);
document.getElementById("end-call").addEventListener("click", endCall);
