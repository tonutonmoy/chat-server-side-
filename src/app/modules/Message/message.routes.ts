// routes/message.routes.ts
import express from "express";
import { getAllMessages } from "./message.controller";

const messageRouter = express.Router();

messageRouter.get("/:user1Id/:user2Id", getAllMessages);

export default messageRouter;
