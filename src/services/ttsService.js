import logger from '../utils/logger.js';

export async function synthesizeSpeech(text, emotion = 'neutral', onChunk) {
  // Strip stage directions like [whispers], [pauses], [excited]
  const cleanText = text
    .replace(/\[.*?\]/g, '')        // remove [stage directions]
    .replace(/\s+/g, ' ')           // collapse extra spaces
    .trim();

  console.debug(`[TTSService] Input text length: ${cleanText?.length ?? 0}`);
  // console.debug(`[TTSService] Input text: ${cleanText}`);

  const emotionMap = {
    happy:     { speed: 0.9,  emotion: ["positivity:high"] },
    sad:       { speed: 0.75, emotion: ["sadness:high"] },
    angry:     { speed: 0.95, emotion: ["anger:high"] },
    hopeful:   { speed: 0.8,  emotion: ["positivity:low"] },
    confused:  { speed: 0.75, emotion: [] },
    confident: { speed: 0.85, emotion: ["positivity:low"] },
    anxious:   { speed: 0.9,  emotion: ["sadness:low"] },
    excited:   { speed: 0.95, emotion: ["positivity:high", "surprise:high"] },
    fearful:   { speed: 0.8,  emotion: ["sadness:high"] },
    neutral:   { speed: 0.8,  emotion: [] },
  };

  const controls = emotionMap[emotion] || emotionMap.neutral;

  const response = await fetch("https://api.cartesia.ai/tts/sse", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.CARTESIA_API_KEY}`,
      "Cartesia-Version": "2024-06-10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-english",
      transcript: cleanText,
      voice: {
        mode: "id",
        id: "faf0731e-dfb9-4cfc-8119-259a79b27e12", // default voice
        __experimental_controls: {
          speed: controls.speed,
          emotion: controls.emotion,
        },
      },
      output_format: {
        container: "raw",
        encoding: "pcm_s16le",
        sample_rate: 44100,
      },
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[TTSService] API Error: HTTP ${response.status} - ${errorText}`);
    throw new Error(`Cartesia API failed: ${response.status} ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    // Keep the last incomplete line in the buffer
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      
      const dataStr = line.slice(6).trim();
      if (!dataStr || dataStr === '[DONE]') continue;

      try {
        const json = JSON.parse(dataStr);
        if (json.data && onChunk) {
          onChunk(json.data);
        }
      } catch (err) {
        logger.error('[TTSService] Failed parsing chunk', { err: err.message });
      }
    }
  }
}