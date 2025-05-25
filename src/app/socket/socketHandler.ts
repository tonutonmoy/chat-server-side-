// handler.ts
import { Socket, Server } from "socket.io";
import { NotificationService } from "../modules/Notification/notification.service";
import { MessageService } from "../modules/Message/message.service"; // Ensure MessageService is imported
import { UserServices } from "../modules/User/user.service";
import { createPost, getPosts, getPostById } from "../modules/Post/post.service";
import { likePost, unlikePost, getLikeCount } from "../modules/Like/like.service";
import { addComment, deleteComment } from "../modules/Comment/comment.service";

interface CallData {
  calleeId: string;
  offer: any;
  caller: { id: string; [key: string]: any };
  isVideo: boolean;
}

interface MessageData {
  id?: string; // Optional: for client-generated temporary IDs
  senderId: string;
  reciverId: string;
  content: string;
  createdAt: string; // Add createdAt to data for consistency
  type: "text" | "image" | "file" | "audio";
  fileName?: string;
  duration?: number;
  isSeen?: boolean; // Add isSeen for backend processing
}

interface PostData {
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  authorId: string;
}

interface LikeData {
  postId: string;
  userId: string;
}

interface CommentData {
  content: string;
  authorId: string;
  postId: string;
}

// Map to store online users: userId -> socketId
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const handleSocketConnection = (socket: Socket, io: Server) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    console.warn(`❌ Socket ${socket.id}: No userId provided on socket connection. Disconnecting.`);
    socket.disconnect(true);
    return;
  }

  console.log(`✅ User connected: ${socket.id}, UserID: ${userId}`);

  // Store online user and their socket ID
  onlineUsers.set(userId, socket.id);
  // 👇 Join user's private room
  socket.join(userId);

  // Notify all clients that this user is now online
  io.emit("user_status", { userId, status: "online" });

  // 🔹 Join a chat room between 2 users
  socket.on("join_chat_room", async ({ user1Id, user2Id }: { user1Id: string; user2Id: string }) => {
    if (!user1Id || !user2Id) {
      console.warn(`❌ Invalid room join request from ${userId} - missing user IDs.`);
      return socket.emit("error", { message: "Invalid room join request." });
    }

    const roomId = [user1Id, user2Id].sort().join("_");
    socket.join(roomId);
    console.log(`👥 User ${userId} joined chat room ${roomId}`);

    // Send the online status of the partner to the user who just joined the room
    const partnerId = user1Id === userId ? user2Id : user1Id;
    const partnerSocketId = onlineUsers.get(partnerId);
    if (partnerSocketId) {
      io.to(userId).emit("user_status", { userId: partnerId, status: "online" });
    } else {
      io.to(userId).emit("user_status", { userId: partnerId, status: "offline" });
    }
  });

  // 🔹 Handle sending a message
  socket.on("send_message", async (data: MessageData) => {
    const { senderId, reciverId, content, type, fileName, duration } = data;

    if (!senderId || !reciverId || (!content && !fileName)) { // Content or fileName must exist
      return socket.emit("error", { message: "❌ Invalid message data: senderId, reciverId, and content/fileName are required." });
    }

    if (senderId !== userId) {
      return socket.emit("error", { message: "❌ Authentication failed: You can only send messages as yourself." });
    }

    try {
      // Save message to DB
      const message = await MessageService.sendMessage({
        senderId,
        reciverId,
        content,
        type: type || "text",
        fileName,
        duration,
        createdAt: new Date().toISOString(), // Ensure createdAt is set by backend
      });

      const roomId = [senderId, reciverId].sort().join("_");

      // Emit message to the room (both sender and receiver will get it)
      io.to(roomId).emit("receive_message", message);
      console.log(`✉️ Message sent from ${senderId} to ${reciverId}. Type: ${type || 'text'}`);

      // Send a notification if receiver is not in the same room or not actively chatting
      // This logic can be more sophisticated (e.g., check if receiver's socket is in the room)
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
        console.log(`🔔 Notification sent to ${reciverId} for new message.`);
      }
    } catch (err) {
      console.error(`❌ Message error for ${senderId}:`, err);
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
      return socket.emit("call_error", { message: "❌ Invalid call data: calleeId, offer, and caller.id are required." });
    }

    try {
      console.log(`📞 Call from ${caller.id} to ${calleeId} (${isVideo ? "Video" : "Audio"})`);
      io.to(calleeId).emit("receive_call", { offer, caller, isVideo });
    } catch (err) {
      console.error("❌ Call initiation error:", err);
      socket.emit("call_error", {
        message: "Failed to initiate call.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 🔹 WebRTC - Answer Call
  socket.on("answer_call", ({ callerId, answer }: { callerId: string; answer: any }) => {
    if (!callerId || !answer) {
      return socket.emit("call_error", { message: "❌ Invalid answer data: callerId and answer are required." });
    }

    console.log(`✅ Call answered by ${userId}, notifying ${callerId}`);
    io.to(callerId).emit("call_answered", { answer });
  });

  // 🔹 WebRTC - Reject Call
  socket.on("reject_call", ({ callerId }: { callerId: string }) => {
    if (!callerId) {
      return socket.emit("call_error", { message: "❌ Invalid reject data: callerId is required." });
    }

    console.log(`❌ Call rejected by ${userId}, notifying ${callerId}`);
    io.to(callerId).emit("call_rejected", { userId });
  });

  // 🔹 WebRTC - End Call
  socket.on("end_call", ({ partnerId }: { partnerId: string }) => {
    if (!partnerId) {
      return socket.emit("call_error", { message: "❌ Invalid end call data: partnerId is required." });
    }

    console.log(`📴 Call ended by ${userId}, notifying ${partnerId}`);
    io.to(partnerId).emit("call_ended", { userId });
  });

  // 🔹 WebRTC - ICE Candidate exchange
  socket.on("ice_candidate", ({ targetUserId, candidate }: { targetUserId: string; candidate: any }) => {
    if (!targetUserId || !candidate) {
      return socket.emit("call_error", { message: "❌ Invalid ICE candidate data: targetUserId and candidate are required." });
    }

    io.to(targetUserId).emit("ice_candidate", { candidate, senderId: userId });
  });

  // -------------------------------------------------------------
  // New Socket.IO Event Handlers for Facebook-like features
  // -------------------------------------------------------------

  // 🔹 Create a new post
  socket.on("create_post", async (data: PostData) => {
    const { content, mediaUrl, mediaType, authorId } = data;

    if (!content.trim() && !mediaUrl) {
      return socket.emit("error", { message: "❌ Invalid post data: Content or media is required for a post." });
    }
    if (!authorId) {
      return socket.emit("error", { message: "❌ Invalid post data: Author ID is required." });
    }
    if (authorId !== userId) {
      return socket.emit("error", { message: "❌ Authentication failed: You can only create posts as yourself." });
    }

    try {
      const post = await createPost({ content, mediaUrl, mediaType, authorId });
      io.emit("new_post", post);
      console.log(`📝 User ${userId} created a new post (ID: ${post.id}).`);
    } catch (err) {
      console.error("❌ Post creation error:", err);
      socket.emit("error", {
        message: "Failed to create post.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 🔹 Get posts (e.g., for a feed)
  socket.on("get_posts", async ({ lastPostId, limit }: { lastPostId?: string; limit?: number }) => {
    try {
      const posts = await getPosts(lastPostId, limit);
      socket.emit("posts_feed", posts);
      console.log(`🔄 User ${userId} fetched posts (limit: ${limit || 'default'}).`);
    }
    catch (err) {
      console.error("❌ Fetch posts error:", err);
      socket.emit("error", {
        message: "Failed to fetch posts.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 🔹 Like a post
  socket.on("like_post", async (data: LikeData) => {
    const { postId, userId: likerId } = data;

    if (!postId || !likerId) {
      return socket.emit("error", { message: "❌ Invalid like data: postId and userId are required." });
    }
    if (likerId !== userId) {
      return socket.emit("error", { message: "❌ Authentication failed: You can only like posts as yourself." });
    }

    try {
      await likePost(postId, likerId);
      const updatedLikeCount = await getLikeCount(postId);
      io.emit("post_liked", { postId, likerId: userId, likeCount: updatedLikeCount });
      console.log(`👍 User ${userId} liked post ${postId}. New like count: ${updatedLikeCount}`);

      const post = await getPostById(postId);
      if (post && post.authorId !== userId) {
        const likerDetails = await UserServices.getUserDetailsFromDB(userId);
        if (likerDetails) {
          await NotificationService.createNotification({
            senderId: userId,
            reciverId: post.authorId,
            message: `${likerDetails.firstName || 'Someone'} liked your post.`,
          });
          io.to(post.authorId).emit("new_notification", {
            sender: { id: likerDetails.id, firstName: likerDetails.firstName, lastName: likerDetails.lastName, profileImage: likerDetails.profileImage },
            message: `${likerDetails.firstName || 'Someone'} liked your post.`,
            type: "like",
          });
          console.log(`🔔 Notification sent to ${post.authorId} about a like.`);
        }
      }
    } catch (err: any) {
      if (err.code === 'P2002') {
        return socket.emit("error", { message: "You have already liked this post." });
      }
      console.error(`❌ Like post error for user ${userId} on post ${postId}:`, err);
      socket.emit("error", {
        message: "Failed to like post.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 🔹 Unlike a post
  socket.on("unlike_post", async (data: LikeData) => {
    const { postId, userId: unlikerId } = data;

    if (!postId || !unlikerId) {
      return socket.emit("error", { message: "❌ Invalid unlike data: postId and userId are required." });
    }
    if (unlikerId !== userId) {
      return socket.emit("error", { message: "❌ Authentication failed: You can only unlike posts as yourself." });
    }

    try {
      await unlikePost(postId, unlikerId);
      const updatedLikeCount = await getLikeCount(postId);
      io.emit("post_unliked", { postId, unlikerId: userId, likeCount: updatedLikeCount });
      console.log(`👎 User ${userId} unliked post ${postId}. New like count: ${updatedLikeCount}`);
    } catch (err) {
      console.error(`❌ Unlike post error for user ${userId} on post ${postId}:`, err);
      socket.emit("error", {
        message: "Failed to unlike post.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 🔹 Add a comment to a post
  socket.on("add_comment", async (data: CommentData) => {
    const { content, authorId, postId } = data;

    if (!content.trim() || !authorId || !postId) {
      return socket.emit("error", { message: "❌ Invalid comment data: Content, authorId, and postId are required." });
    }
    if (authorId !== userId) {
      return socket.emit("error", { message: "❌ Authentication failed: You can only add comments as yourself." });
    }

    try {
      const comment = await addComment(postId, authorId, content);
      io.emit("new_comment", { postId, comment });
      console.log(`💬 User ${userId} commented on post ${postId}. Comment ID: ${comment.id}`);

      const post = await getPostById(postId);
      if (post && post.authorId !== userId) {
        const commenterDetails = await UserServices.getUserDetailsFromDB(userId);
        if (commenterDetails) {
          await NotificationService.createNotification({
            senderId: userId,
            reciverId: post.authorId,
            message: `${commenterDetails.firstName || 'Someone'} commented on your post: "${content.substring(0, 50)}..."`,
          });
          io.to(post.authorId).emit("new_notification", {
            sender: { id: commenterDetails.id, firstName: commenterDetails.firstName, lastName: commenterDetails.lastName, profileImage: commenterDetails.profileImage },
            message: `${commenterDetails.firstName || 'Someone'} commented on your post.`,
            type: "comment",
          });
          console.log(`🔔 Notification sent to ${post.authorId} about a new comment.`);
        }
      }
    } catch (err) {
      console.error(`❌ Add comment error for user ${userId} on post ${postId}:`, err);
      socket.emit("error", {
        message: "Failed to add comment.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 🔹 Delete a comment
  socket.on("delete_comment", async ({ commentId, postId, authorId }: { commentId: string; postId: string; authorId: string; }) => {
    if (!commentId || !postId || !authorId) {
      return socket.emit("error", { message: "❌ Invalid data for deleting comment: commentId, postId, and authorId are required." });
    }
    if (authorId !== userId) {
      return socket.emit("error", { message: "❌ Unauthorized: You can only delete your own comments." });
    }
    try {
      await deleteComment(commentId, authorId);
      io.emit("comment_deleted", { postId, commentId });
      console.log(`🗑️ User ${userId} deleted comment ${commentId} from post ${postId}.`);
    } catch (err) {
      console.error(`❌ Delete comment error for user ${userId} on comment ${commentId}:`, err);
      socket.emit("error", {
        message: "Failed to delete comment.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // -------------------------------------------------------------
  // New Socket.IO Event Handlers for Chat Features
  // -------------------------------------------------------------

  // 🔹 Handle typing status
  socket.on("typing_start", ({ receiverId }: { receiverId: string }) => {
    // Broadcast to the receiver's room that the sender is typing
    io.to(receiverId).emit("partner_typing", { senderId: userId, isTyping: true });
    console.log(`✍️ User ${userId} started typing to ${receiverId}.`);
  });

  socket.on("typing_stop", ({ receiverId }: { receiverId: string }) => {
    // Broadcast to the receiver's room that the sender stopped typing
    io.to(receiverId).emit("partner_typing", { senderId: userId, isTyping: false });
    console.log(`🛑 User ${userId} stopped typing to ${receiverId}.`);
  });

  // 🔹 Handle message seen status
  socket.on("message_seen", async ({ messageId, senderId }: { messageId: string; senderId: string }) => {
    if (!messageId || !senderId) {
      return socket.emit("error", { message: "❌ Invalid data for message_seen: messageId and senderId are required." });
    }
    // Ensure the message being marked as seen was actually sent by the other user
    if (senderId === userId) {
      console.warn(`Attempted to mark own message ${messageId} as seen by ${userId}. Skipping.`);
      return;
    }

    try {
      await MessageService.markMessageAsSeen(messageId); // Update DB
      // Emit a receipt back to the original sender of the message
      io.to(senderId).emit("message_seen_receipt", { messageId, seenBy: userId });
      console.log(`👀 Message ${messageId} seen by ${userId}. Receipt sent to ${senderId}.`);
    } catch (err) {
      console.error(`❌ Error marking message ${messageId} as seen by ${userId}:`, err);
      socket.emit("error", {
        message: "Failed to mark message as seen.",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  });


  // ❌ Disconnection
  socket.on("disconnect", (reason) => {
    console.log(`🔌 User disconnected: ${socket.id}, UserID: ${userId}. Reason: ${reason}`);
    onlineUsers.delete(userId); // Remove user from online map
    io.emit("user_status", { userId, status: "offline" }); // Notify all clients
  });

  // ❗ Generic error listener (for any unhandled errors on the socket)
  socket.on("error", (err: Error) => {
    console.error("❗ Unhandled socket error:", err);
  });
};
