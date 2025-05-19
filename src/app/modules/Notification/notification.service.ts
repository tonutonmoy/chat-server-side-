import prisma from "../../utils/prisma";


export const NotificationService = {
  async createNotification(data: {
    senderId: string;
    reciverId: string;
    message: string;
  }) {
    return await prisma.notification.create({ data });
  },

async getUserNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: { reciverId: userId },
    include: {
      sender: {
        select: {
          firstName: true,
          email: true,
          id: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
},

async markAsRead(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
},}
