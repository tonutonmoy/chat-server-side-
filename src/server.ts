import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import config from "./config";
import { handleSocketConnection } from "./app/socket/socketHandler";

const port = config.port || 5000;

async function main() {
  const httpServer = new HTTPServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    handleSocketConnection(socket, io);
  });

  httpServer.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
  });

  const exitHandler = () => {
    httpServer.close(() => {
      console.info("💤 Server closed");
    });
    process.exit(1);
  };

  process.on("uncaughtException", exitHandler);
  process.on("unhandledRejection", exitHandler);
}

main();
