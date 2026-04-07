import logger from '../utils/logger.js';

export async function synthesizeSpeech(text, emotion = 'neutral', speakerPath, useVoiceClone, onChunk) {
  const cleanText = text
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    if (useVoiceClone) {
      console.debug(`[TTSService] Passing text to XTTS Voice Clone server: ${cleanText.substring(0, 50)}`);
      
      // XTTS on CPU can take 60-120+ seconds. Give it 3 full minutes before timing out.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      
      logger.info(`[TTSService] Sending to XTTS server — speaker: ${speakerPath}`);
      const response = await fetch("http://localhost:5000/clone", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          speaker_path: speakerPath
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TTSService] Local XTTS Error: HTTP ${response.status} - ${errorText}`);
        throw new Error(`XTTS failed: ${response.status} ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Chunk size simulating the exact SSE payload size we used to get from Cartesia (approx 4096 bytes)
      const chunkSize = 4096;
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.subarray(i, i + chunkSize);
        // Emit strictly as base64 string because that's exactly what App.jsx extracts from `json.data`
        if (onChunk) {
          onChunk(chunk.toString('base64'));
        }
      }
      
      logger.info(`[TTSService] Successfully streamed ${buffer.length} bytes to frontend client.`);
      
    } else {
      console.debug(`[TTSService] Passing text to Cartesia AI: ${cleanText.substring(0, 50)}`);
  
      const emotionMap = {
        happy: { speed: "slow", emotion: ["positivity:high", "curiosity:low"] },
        sad: { speed: "slowest", emotion: ["sadness:high", "positivity:lowest"] },
        angry: { speed: "normal", emotion: ["anger:highest", "positivity:lowest"] },
        hopeful: { speed: "slow", emotion: ["positivity:low", "curiosity:low"] },
        confused: { speed: "slowest", emotion: ["curiosity:high", "sadness:low"] },
        confident: { speed: "slow", emotion: ["positivity:low", "anger:lowest"] },
        anxious: { speed: "normal", emotion: ["sadness:high", "anger:low", "curiosity:lowest"] },
        excited: { speed: "fast", emotion: ["positivity:highest", "curiosity:high"] },
        fearful: { speed: "slowest", emotion: ["sadness:high", "anger:lowest"] },
        neutral: { speed: "slow", emotion: ["positivity:lowest"] }
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
            id: "faf0731e-dfb9-4cfc-8119-259a79b27e12",
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
      let bufferStr = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bufferStr += decoder.decode(value, { stream: true });
        const lines = bufferStr.split('\n');
        bufferStr = lines.pop();

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
  } catch (err) {
    logger.error('[TTSService] Error calling TTS service', { err: err.message });
  }
}