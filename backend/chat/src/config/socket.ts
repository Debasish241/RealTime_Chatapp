import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap: Record<string, string> = {};

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);
  const userId = socket.handshake.query.userId as string | undefined;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ID ${userId} is connected with socket ID ${socket.id}`);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  if (userId) {
    socket.join(userId);
  }

  socket.on("typing", (data) => {
    console.log(`User ${data.userId} is typing in chat ${data.chatId}`);
    // Broadcast to all users in the chat room except the sender
    socket.to(data.chatId).emit("userTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("stopTyping", (data) => {
    console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`);
    // Broadcast to all users in the chat room except the sender
    socket.to(data.chatId).emit("userStopTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  // Fixed: Changed to lowercase to match frontend
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${userId} joined chat ${chatId}`);
  });

  // Fixed: Changed to lowercase to match frontend
  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${userId} left chat ${chatId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected with socket ID ${socket.id}`);

    if (userId) {
      delete userSocketMap[userId];
      console.log(`User ID ${userId} disconnected`);
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  socket.on("connect_error", (error) => {
    console.log("Socket Connection Error", error);
  });
});

export { app, io, server };