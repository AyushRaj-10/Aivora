import { v4 as uuidv4 } from 'uuid';
import { processAudio } from '../orchestrator/pipeline.js';
import logger from '../utils/logger.js';
import { WS_EVENTS } from '../config/constants.js';
import { writeFileSync } from 'fs';

const sessions = new Map();

export function createSession(ws) {
  const sessionId = uuidv4();
  sessions.set(sessionId, { ws, history: [] });
  return sessionId;
}

export function destroySession(sessionId) {
  sessions.delete(sessionId);
}

// audioController.js — handleMessage
export async function handleMessage(sessionId, rawMessage) {
  const session = sessions.get(sessionId);
  if (!session) return;

  // Ignore ping messages
  try {
    const parsed = JSON.parse(rawMessage.toString());
    if (parsed.type === 'ping') return;
  } catch {
    // not JSON, treat as audio — continue
  }

  // Helper to check session is still alive before each async step
  const isAlive = () => sessions.has(sessionId) && 
                        session.ws.readyState === 1;

  try {
    const audioBuffer = Buffer.isBuffer(rawMessage)
      ? rawMessage
      : Buffer.from(rawMessage);

    if (audioBuffer.length < 1000) {
      logger.warn(`[AudioController] Audio too small: ${audioBuffer.length} bytes`);
      return;
    }

    writeFileSync('debug_audio.bin', audioBuffer);

    const result = await processAudio(
      audioBuffer,
      session.history,
      (partial) => {
        // Guard every partial send
        if (isAlive()) {
          session.ws.send(JSON.stringify(partial));
        }
      }
    );

    // Abort final send if client left
    if (!isAlive()) {
      logger.warn(`[AudioController] Session ${sessionId} gone before final response`);
      return;
    }

    session.history.push({ role: 'user', content: result.text });
    session.history.push({ role: 'assistant', content: result.reply });

    session.ws.send(
      JSON.stringify({
        type: "audio_response",
        text: result.reply,
        audio: result.audioBase64,
      })
    );
  } catch (err) {
    logger.error('Pipeline error', { error: err.message });
    if (isAlive()) {
      session.ws.send(JSON.stringify({ type: WS_EVENTS.ERROR, error: err.message }));
    }
  }
}
