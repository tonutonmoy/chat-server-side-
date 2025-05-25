import prisma from "../../utils/prisma";

interface SendMessageData {
  senderId: string;
  reciverId: string;
  content?: string; // Content is now optional
  fileUrl?: string; // Add fileUrl
  fileType?: string; // Add fileType
  duration?: number; // Add duration
}

export const MessageService = {
  sendMessage: async (data: SendMessageData) => {
    // Ensure that at least content or fileUrl is provided
    if (!data.content && !data.fileUrl) {
      throw new Error("Message must have content or a file URL.");
    }

    const message = await prisma.message.create({
      data: {
        content: data.content,
        fileUrl: data.fileUrl,   // Store file URL
        fileType: data.fileType, // Store file type

        senderId: data.senderId,
        reciverId: data.reciverId,
        isSeen: false, // New messages are initially not seen
        type: data.fileType || (data.content ? "text" : "file"), // Determine type based on content/file
      },
    });
    return message;
  },

  AllMessage: async (user1Id: string, user2Id: string) => {
    console.log(user1Id, user2Id);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, reciverId: user2Id },
          { senderId: user2Id, reciverId: user1Id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    return messages;
  },

  /**
   * Marks a specific message as seen.
   * @param messageId The ID of the message to mark as seen.
   * @returns The updated message object.
   */
  markMessageAsSeen: async (messageId: string) => {
    try {
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { isSeen: true },
      });
      return updatedMessage;
    } catch (error) {
      console.error(`Error marking message ${messageId} as seen:`, error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },

  /**
   * Gets the count of unseen messages from a specific partner for a given user.
   * @param userId The ID of the user receiving the messages.
   * @param partnerId The ID of the user who sent the messages.
   * @returns The count of unseen messages.
   */
  getUnseenMessageCount: async (userId: string, partnerId: string) => {
    try {
      const count = await prisma.message.count({
        where: {
          senderId: partnerId,   // Messages sent by the partner
          reciverId: userId,     // Received by the current user
          isSeen: false,         // That are not yet seen
        },
      });
      return count;
    } catch (error) {
      console.error(`Error getting unseen message count for ${userId} from ${partnerId}:`, error);
      throw error;
    }
  },

  /**
   * Gets the latest message between two users.
   * @param user1Id ID of the first user.
   * @param user2Id ID of the second user.
   * @returns The latest message or null if no messages exist.
   */
  getLatestMessageForChat: async (user1Id: string, user2Id: string) => {
    try {
      const latestMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: user1Id, reciverId: user2Id },
            { senderId: user2Id, reciverId: user1Id },
          ],
        },
        orderBy: { createdAt: "desc" }, // Order by latest message
      });
      return latestMessage;
    } catch (error) {
      console.error(`Error getting latest message for chat between ${user1Id} and ${user2Id}:`, error);
      throw error;
    }
  },
};
