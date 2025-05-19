import { Request, Response } from "express";
import { NotificationService } from "./notification.service";

export const NotificationController = {
  async getMyNotifications(req: Request, res: Response) {
    const userId = req.params.userId;
    const notifications = await NotificationService.getUserNotifications(userId);
    res.json(notifications);
  },

  async markNotificationAsRead(req: Request, res: Response) {
    const notificationId = req.params.notificationId;
    const notification = await NotificationService.markAsRead(notificationId);
    res.json(notification);
  },
};
