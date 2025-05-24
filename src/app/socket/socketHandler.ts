import { Socket, Server } from "socket.io";
import { NotificationService } from "../modules/Notification/notification.service";
import { MessageService } from "../modules/Message/message.service";
import { UserServices } from "../modules/User/user.service";

interface CallData {
  calleeId: string;
  offer: any;
  caller: { id: string; [key: string]: any };
  isVideo: boolean;
}

interface MessageData {
  senderId: string;
  reciverId: string;
  content: string;
  [key: string]: any;
}

export const handleSocketConnection = (socket: Socket, io: Server) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    console.warn("❌ No userId provided on socket connection");
    socket.disconnect(true);
    return;
  }

  console.log("✅ User connected:", socket.id, "UserID:", userId);

  // 👇 Join user's private room
  socket.join(userId);

  // Notify others user is online
  io.emit("user_status", { userId, status: "online" });

  // 🔹 Join a chat room between 2 users
  socket.on("join_chat_room", ({ user1Id, user2Id }: { user1Id: string; user2Id: string }) => {
    if (!user1Id || !user2Id) {
      return console.warn("❌ Invalid room join request - missing user IDs");
    }

    const roomId = [user1Id, user2Id].sort().join("_");
    socket.join(roomId);
    console.log(`👥 User ${userId} joined chat room ${roomId}`);
  });

  // 🔹 Handle sending a message
  socket.on("send_message", async (data: MessageData) => {
    const { senderId, reciverId, content } = data;

    if (!senderId || !reciverId || !content) {
      return socket.emit("error", { message: "❌ Invalid message data." });
    }

    if (senderId !== userId) {
      return socket.emit("error", { message: "❌ Authentication failed." });
    }

    try {
      const message = await MessageService.sendMessage(data);
      const roomId = [senderId, reciverId].sort().join("_");

      // 👇 Emit message to the room
      io.to(roomId).emit("receive_message", message);

      // 👇 Send a notification
      const notification = await NotificationService.createNotification({
        senderId,
        reciverId,
        message: content,
      });

      if (notification?.senderId) {
        const senderData = await UserServices.getUserDetailsFromDB(senderId);
        io.to(reciverId).emit("new_notification", {
          ...notification,
          sender: senderData,
        });
      }
    } catch (err) {
      console.error("❌ Message Error:", err);
      socket.emit("error", {
        message: "Failed to send message.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 🔹 WebRTC - Call Initiation
  socket.on("call_user", async (data: CallData) => {
    const { calleeId, offer, caller, isVideo } = data;

    if (!calleeId || !offer || !caller?.id) {
      return socket.emit("call_error", { message: "❌ Invalid call data" });
    }

    try {
      console.log(`📞 Call from ${caller.id} to ${calleeId} (${isVideo ? "Video" : "Audio"})`);
      io.to(calleeId).emit("receive_call", { offer, caller, isVideo });
    } catch (err) {
      console.error("❌ Call error:", err);
      socket.emit("call_error", {
        message: "Failed to initiate call",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 🔹 WebRTC - Answer Call
  socket.on("answer_call", ({ callerId, answer }: { callerId: string; answer: any }) => {
    if (!callerId || !answer) return;

    console.log(`✅ Call answered by ${userId}, notifying ${callerId}`);
    io.to(callerId).emit("call_answered", { answer });
  });

  // 🔹 WebRTC - Reject Call
  socket.on("reject_call", ({ callerId }: { callerId: string }) => {
    if (!callerId) return;

    console.log(`❌ Call rejected by ${userId}, notifying ${callerId}`);
    io.to(callerId).emit("call_rejected", { userId });
  });

  // 🔹 WebRTC - End Call
  socket.on("end_call", ({ partnerId }: { partnerId: string }) => {
    if (!partnerId) return;

    console.log(`📴 Call ended by ${userId}, notifying ${partnerId}`);
    io.to(partnerId).emit("call_ended", { userId });
  });

  // 🔹 WebRTC - ICE Candidate exchange
  socket.on("ice_candidate", ({ targetUserId, candidate }: { targetUserId: string; candidate: any }) => {
    if (!targetUserId || !candidate) return;

    io.to(targetUserId).emit("ice_candidate", { candidate, senderId: userId });
  });

  // ❌ Disconnection
  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id, "UserID:", userId);
    io.emit("user_status", { userId, status: "offline" });
  });

  // ❗ Generic error listener
  socket.on("error", (err: Error) => {
    console.error("❗ Socket error:", err);
  });
};
