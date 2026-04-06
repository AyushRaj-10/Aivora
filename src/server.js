import 'dotenv/config';

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initTTS } from './services/ttsService.js';

import config from './config/index.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import {
  createSession,
  destroySession,
  handleMessage,
} from './controllers/audioController.js';

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log("GROQ API KEY:", process.env.GROQ_API_KEY ? "Loaded" : "Missing");

app.use(errorHandler);



// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── WebSocket Server ─────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  logger.info(`[WS] New connection from ${ip}`);

  const sessionId = createSession(ws);

  // ── Keepalive ping ──────────────────────────────────────
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) { // WebSocket.OPEN is 1
      ws.ping();
    }
  }, config.websocket.pingInterval);

  // ── Message handler ─────────────────────────────────────
  ws.on('message', async (rawMessage) => {
    try {
      await handleMessage(sessionId, rawMessage);
    } catch (err) {
      logger.error('[WS] Unhandled error in message handler', { error: err.message });
    }
  });

  // ── Cleanup on disconnect ───────────────────────────────
  ws.on('close', (code, reason) => {
    clearInterval(pingInterval);
    destroySession(sessionId);
    logger.info(`[WS] Connection closed: ${sessionId}`, { code, reason: reason.toString() });
  });

  ws.on('error', (err) => {
    logger.error(`[WS] Socket error: ${sessionId}`, { error: err.message });
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
await initTTS(); // load Kokoro model into memory

server.listen(config.server.port, () => {
  logger.info(`🚀 Server running on port ${config.server.port}`);
  logger.info(`📡 WebSocket ready at ws://localhost:${config.server.port}`);
  logger.info(`🏥 Health check at http://localhost:${config.server.port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down');
  server.close(() => process.exit(0));
});