import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { bufferToBase64 } from '../utils/audioUtils.js';

/**
 * Convert text → speech audio using ElevenLabs
 * @param {string} text - Text to synthesize
 * @returns {Promise<string>} Base64-encoded MP3 audio
 */
async function synthesizeSpeech(text) {
  const start = Date.now();

  logger.debug('[TTSService] Calling', {
    voiceId: config.elevenlabs.voiceId,
    keyLoaded: !!config.elevenlabs.apiKey,
    textLength: text.length,
  });

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`,
      {
        text,
        model_id: config.elevenlabs.model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': config.elevenlabs.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );

    const audioBase64 = bufferToBase64(Buffer.from(response.data));
    logger.debug(`[TTSService] TTS done in ${Date.now() - start}ms`);
    return audioBase64;

  } catch (err) {
    logger.error('[TTSService] Full error', {
      status: err.response?.status,
      voiceId: config.elevenlabs.voiceId,
      keyLoaded: !!config.elevenlabs.apiKey,
      data: err.response?.data?.toString(),
    });
    throw err;
  }
}

export { synthesizeSpeech };