import logger from '../utils/logger.js';

export async function synthesizeSpeech(text, emotion = 'neutral') {
  const emotionMap = {
    happy:      { speed: 'normal', emotion: ['positivity:high'] },
    sad:        { speed: 'slow',   emotion: ['sadness:high'] },
    angry:      { speed: 'fast',   emotion: ['anger:high'] },
    excited:    { speed: 'fast',   emotion: ['positivity:high', 'surprise:high'] },
    fearful:    { speed: 'fast',   emotion: ['fear:high'] },
    neutral:    { speed: 'normal', emotion: [] },
  };

  const controls = emotionMap[emotion] || emotionMap.neutral;

  const response = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.CARTESIA_API_KEY}`,
      "Cartesia-Version": "2024-06-10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-english",
      transcript: text,
      voice: {
        mode: "id",
        id: "a0e99841-438c-4a64-b679-ae501e7d6091", // default voice
        __experimental_controls: {
          speed: controls.speed,
          emotion: controls.emotion,
        },
      },
      output_format: {
        container: "mp3",
        encoding: "mp3",
        sample_rate: 44100,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Cartesia TTS failed: ${response.status} ${await response.text()}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  logger.debug('[TTSService] Cartesia direct HTTP done');
  return buffer.toString('base64');
}