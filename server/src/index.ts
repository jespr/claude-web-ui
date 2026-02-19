import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { ClaudeSession } from "./session.js";
import type { ClientMessage } from "./protocol.js";

const PORT = Number(process.env.PORT ?? 3001);
const CWD = process.env.CWD ?? process.cwd();

const app = express();
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const server = createServer(app);
const wss = new WebSocketServer({ server });

const sessions = new Map<string, ClaudeSession>();
let nextId = 1;

wss.on("connection", (ws: WebSocket) => {
  const id = String(nextId++);
  console.log(`[${id}] Client connected`);

  const send = (msg: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const session = new ClaudeSession(send, CWD);
  sessions.set(id, session);

  // Start the agent session (runs in background)
  session.start().catch((err) => {
    console.error(`[${id}] Session error:`, err);
    send({ type: "error", message: "Session crashed" });
  });

  ws.on("message", (raw: Buffer) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      send({ type: "error", message: "Invalid JSON" });
      return;
    }

    switch (msg.type) {
      case "prompt":
        session.pushPrompt(msg.text);
        break;
      case "interrupt":
        session.interrupt().catch((err) => {
          console.error(`[${id}] Interrupt error:`, err);
        });
        break;
      default:
        send({ type: "error", message: `Unknown message type` });
    }
  });

  ws.on("close", () => {
    console.log(`[${id}] Client disconnected`);
    session.close();
    sessions.delete(id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
  console.log(`Working directory: ${CWD}`);
});
