import { transcribeAudio } from '../services/whisperService.js';
import { detectEmotion } from '../services/emotionService.js';
import { generateResponse } from '../services/llmService.js';
import { synthesizeSpeech } from '../services/ttsService.js';
import { isAudioValid } from '../utils/audioUtils.js';
import { LATENCY } from '../config/constants.js';
import logger from '../utils/logger.js';

// ... other imports

// ... lines 8 to 59 remain, just keeping processAudio logic

// the function content replacement:
async function processAudio(audioBuffer, history = [], onPartial = () => {}) {
  const pipelineStart = Date.now();

  if (!isAudioValid(audioBuffer)) {
    throw new Error('Audio buffer too short or invalid');
  }

  logger.info('[Pipeline] Starting — audio bytes:', audioBuffer.length);

  const step1Start = Date.now();
  let text = '';
  try {
    text = await transcribeAudio(audioBuffer);
  } catch (error) {
    logger.error('[Pipeline] STT failed', { error: error.message || 'Unknown error' });
  }

  logger.debug(`[Pipeline] Step 1 (STT) done in ${Date.now() - step1Start}ms`);
  onPartial({ type: 'transcript', text });

  const { emotion, vad, segments } = await detectEmotion(text);
  onPartial({ type: 'emotion', emotion, vad, segments });

  if (!text) {
    logger.warn('[Pipeline] STT fallback: empty transcript');
  }

  const step2Start = Date.now();
  const { reply, enhancedDialogue } = await generateResponse(text, vad, emotion, history, segments);
  logger.debug(`[Pipeline] Step 2 (LLM) done in ${Date.now() - step2Start}ms`);
  
  onPartial({ type: 'llm_response', reply });

  const step3Start = Date.now();
  const audioBase64 = await synthesizeSpeech(reply, emotion);
  logger.debug(`[Pipeline] Step 3 (TTS) done in ${Date.now() - step3Start}ms`);

  const total = Date.now() - pipelineStart;
  const latencyOk = total <= LATENCY.TOTAL_TARGET;

  logger.info(`[Pipeline] ✅ Complete in ${total}ms`, { latencyOk, target: LATENCY.TOTAL_TARGET });
  if (!latencyOk) {
    logger.warn(`[Pipeline] ⚠️ Over latency target by ${total - LATENCY.TOTAL_TARGET}ms`);
  }

  return {
    text,
    vad,
    emotion,
    enhancedDialogue,
    reply,
    segments,
    audioBase64,
    latencyMs: total,
  };
}

export { processAudio };