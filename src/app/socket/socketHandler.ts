import { Socket, Server } from "socket.io";
import { NotificationService } from "../modules/Notification/notification.service";
import { MessageService } from "../modules/Message/message.service";
import { UserServices } from "../modules/User/user.service";

export const handleSocketConnection = (socket: Socket, io: Server) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    console.warn("❌ No userId provided on socket connection");
    return;
  }

  console.log("✅ User connected:", socket.id, "UserID:", userId);

  // Join user's personal room
  socket.join(userId);

  // Chat room joining
  socket.on("join_chat_room", ({ user1Id, user2Id }) => {
    const roomId = [user1Id, user2Id].sort().join("_");
    socket.join(roomId);
    console.log(`User ${userId} joined chat room ${roomId}`);
  });

  // Message handling
  socket.on("send_message", async (data) => {
    const { senderId, reciverId, content } = data;
    if (!senderId || !reciverId || !content) {
      return socket.emit("error", { message: "Invalid message data." });
    }

    try {
      const message = await MessageService.sendMessage(data);
      const roomId = [senderId, reciverId].sort().join("_");
      io.to(roomId).emit("receive_message", message);

      const notification: any = await NotificationService.createNotification({
        senderId,
        reciverId,
        message: content,
      });

      if (notification.senderId) {
        const userData = await UserServices.getUserDetailsFromDB(senderId);
        notification.sender = userData;
        io.to(reciverId).emit("new_notification", notification);
      }
    } catch (err) {
      console.error("❌ Message Error:", err);
      socket.emit("error", { message: "Failed to send message." });
    }
  });

  // WebRTC Signaling Events
  socket.on("call_user", async ({ calleeId, offer, caller, isVideo }) => {
    try {
      console.log(`📞 Call initiated from ${caller.id} to ${calleeId} (${isVideo ? 'Video' : 'Audio'})`);
      
      // Check if callee is online
      const sockets = await io.in(calleeId).fetchSockets();
      if (sockets.length === 0) {
        return socket.emit("call_error", { message: "User is offline" });
      }

      io.to(calleeId).emit("receive_call", { offer, caller, isVideo });
    } catch (err) {
      console.error("Call error:", err);
      socket.emit("call_error", { message: "Failed to initiate call" });
    }
  });

  socket.on("answer_call", ({ callerId, answer }) => {
    console.log(`📞 Call answered by ${userId}, notifying ${callerId}`);
    io.to(callerId).emit("call_answered", { answer });
  });

  socket.on("reject_call", ({ callerId }) => {
    console.log(`❌ Call rejected by ${userId}, notifying ${callerId}`);
    io.to(callerId).emit("call_rejected");
  });

  socket.on("end_call", ({ partnerId }) => {
    console.log(`📞 Call ended by ${userId}, notifying ${partnerId}`);
    io.to(partnerId).emit("call_ended");
  });

  socket.on("ice_candidate", ({ targetUserId, candidate }) => {
    // console.log(`🧊 ICE candidate from ${userId} to ${targetUserId}`);
    io.to(targetUserId).emit("ice_candidate", { candidate });
  });

  // Disconnection handling
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    // Notify all peers in ongoing calls that this user disconnected
    // You might want to implement more sophisticated tracking of ongoing calls
  });

  // Error handling
  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
};