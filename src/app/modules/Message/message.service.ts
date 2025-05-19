import prisma from "../../utils/prisma";

export const MessageService = {
  sendMessage: async (data: { senderId: string; reciverId: string; content: string }) => {
    const message = await prisma.message.create({
      data: {
        content: data.content,
        senderId: data.senderId,
        reciverId: data.reciverId,
      },
    });
    return message;
  },

  // __________________

   AllMessage: async (user1Id: string, user2Id: string) => {


    const messages =  prisma.message.findMany({
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
