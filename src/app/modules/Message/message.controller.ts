// controllers/message.controller.ts
import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import { MessageService } from "./message.service";

export const getAllMessages = async (req: Request, res: Response) => {
  const { user1Id, user2Id } = req.params; // ✅ Proper destructuring from URL parameters

  try {
    const messages = await MessageService.AllMessage(user1Id, user2Id);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages", error });
  }
};
