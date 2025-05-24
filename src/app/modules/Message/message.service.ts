import prisma from "../../utils/prisma";

interface SendMessageData {
  senderId: string;
  reciverId: string;
  content?: string; // Content is now optional
  fileUrl?: string; // Add fileUrl
  fileType?: string; // Add fileType
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
      },
    });
    return message;
  },

  AllMessage: async (user1Id: string, user2Id: string) => {
    const messages = prisma.message.findMany({
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
};