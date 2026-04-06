import { transcribeAudio } from '../services/whisperService.js';
import { detectEmotion } from '../services/emotionService.js';
import { generateResponse } from '../services/llmService.js';
import { synthesize } from '../services/ttsService.js';
import { isAudioValid } from '../utils/audioUtils.js';
import { LATENCY } from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * ─────────────────────────────────────────────────────────
 *  MAIN PIPELINE
 *
 *  STT → LLM → TTS
 * ─────────────────────────────────────────────────────────
 *
 * @param {Buffer} audioBuffer - Raw audio from user mic
 * @param {Array}  history     - Prior conversation turns
 * @param {Function} onPartial - Callback for streaming intermediate results to WS
 *
 * @returns {Promise<PipelineResult>}
 */
async function processAudio(audioBuffer, history = [], onPartial = () => {}) {
  const pipelineStart = Date.now();

  // ─── Validate audio ────────────────────────────────────
  if (!isAudioValid(audioBuffer)) {
    throw new Error('Audio buffer too short or invalid');
  }

  logger.info('[Pipeline] Starting — audio bytes:', audioBuffer.length);

  // ─── STEP 1: STT ────────────────────
  const step1Start = Date.now();

  let text;
  try {
    text = await transcribeAudio(audioBuffer);
  } catch (error) {
    logger.error('[Pipeline] STT failed', { error: error.message || 'Unknown error' });
    text = '';
  }

  logger.debug(`[Pipeline] Step 1 (STT) done in ${Date.now() - step1Start}ms`);

  // ─── Emit partial result to frontend immediately ────────
  onPartial({ type: 'transcript', text });

  const { emotion, vad, segments } = await detectEmotion(text);
  onPartial({ type: 'emotion', emotion, vad, segments });

  if (!text) {
    logger.warn('[Pipeline] STT fallback: empty transcript');
  }

  // ─── STEP 2: LLM ───────────────────────────────────────
  const step2Start = Date.now();
  const { reply, enhancedDialogue } = await generateResponse(text, vad, emotion, history, segments);
  logger.debug(`[Pipeline] Step 2 (LLM) done in ${Date.now() - step2Start}ms`);

  onPartial({ type: 'llm_response', reply });

  // ─── STEP 3: TTS ───────────────────────────────────────
  const step3Start = Date.now();
  
  // Pull intensity from the first segment (highest confidence one)
  const intensity = segments?.[0]?.intensity ?? 0.5;
  const wavBuffer = await synthesize(reply, emotion, intensity);
  
  logger.debug(`[Pipeline] Step 3 (TTS) done in ${Date.now() - step3Start}ms`);

  // ─── Latency report ────────────────────────────────────
  const total = Date.now() - pipelineStart;
  const latencyOk = total <= LATENCY.TOTAL_TARGET;

  logger.info(`[Pipeline] ✅ Complete in ${total}ms`, {
    latencyOk,
    target: LATENCY.TOTAL_TARGET,
  });

  if (!latencyOk) {
    logger.warn(`[Pipeline] ⚠️ Over latency target by ${total - LATENCY.TOTAL_TARGET}ms`);
  }

  // ─── Final structured result ────────────────────────────
  return {
    text,               // original transcript
    vad,                // [valence, arousal, dominance]
    emotion,            // emotion label
    enhancedDialogue,   // "[emotion] original text" — for UI display
    reply,              // LLM text response
    wavBuffer,          // TTS binary payload
    latencyMs: total,
  };
}

export { processAudio };