import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const execPromise = util.promisify(exec);

/**
 * Convert audio buffer → text using Groq's high-speed Whisper Large v3
 * @param {Buffer} audioBuffer - Raw audio bytes
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(audioBuffer) {
  const start = Date.now();
  
  const uniqueId = uuidv4();
  const inputPath = path.join(process.cwd(), `temp_audio_${uniqueId}.tmp`);
  const outputPath = path.join(process.cwd(), `temp_audio_${uniqueId}.wav`);

  let finalBuffer;

  try {
    // 1. Write the raw blob data to a file
    await fs.writeFile(inputPath, audioBuffer);

    // 2. Transcode to precisely 16kHz mono WAV 
    await execPromise(`ffmpeg -y -i ${inputPath} -ar 16000 -ac 1 ${outputPath}`);

    // 3. Read it back
    finalBuffer = await fs.readFile(outputPath);

  } catch (err) {
    logger.error('FFmpeg Conversion Error', { message: err.message, stderr: err.stderr });
    throw new Error('Failed to convert raw audio into parseable WAV format.');
  } finally {
    // 4. Purge temp files
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }

  const form = new FormData();
  form.append('file', finalBuffer, {
    filename: 'audio.wav',
    contentType: 'audio/wav',
  });
  form.append('model', config.groq.whisperModel);
  form.append('language', 'en'); 

  const response = await axios.post(
    config.groq.audioUrl,
    form,
    {
      headers: {
        Authorization: `Bearer ${config.groq.apiKey}`,
        ...form.getHeaders(),
      },
      timeout: 30000,
    }
  );

  const text = response.data.text?.trim() || '';
  logger.debug(`[WhisperService-Groq] STT done in ${Date.now() - start}ms`, { text });

  return text;
}

export { transcribeAudio };