const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("signal", (data) => {
    socket.to(data.roomId).emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const path = require("path");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// // Serve static files
// app.use(express.static(path.join(__dirname, "public")));

// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   socket.on("join-room", (roomId) => {
//     socket.join(roomId);
//     socket.to(roomId).emit("user-connected", socket.id);

//     socket.on("offer", (data) => {
//       socket.to(roomId).emit("offer", data);
//     });

//     socket.on("answer", (data) => {
//       socket.to(roomId).emit("answer", data);
//     });

//     socket.on("ice-candidate", (data) => {
//       socket.to(roomId).emit("ice-candidate", data);
//     });

//     socket.on("disconnect", () => {
//       socket.to(roomId).emit("user-disconnected", socket.id);
//     });
//   });
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
