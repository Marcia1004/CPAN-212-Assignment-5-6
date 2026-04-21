import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

async function startServer() {
  await connectDatabase();

  const httpServer = http.createServer(app);

  httpServer.listen(env.port, () => {
    console.log(`Backend API running on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});