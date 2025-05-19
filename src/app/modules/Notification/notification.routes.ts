import express from "express";
import { NotificationController } from "./notification.controller";

const router = express.Router();

router.get("/:userId", NotificationController.getMyNotifications);
router.patch("/read/:notificationId", NotificationController.markNotificationAsRead);

export const notificationRoute = router;
