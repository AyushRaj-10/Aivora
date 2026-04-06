import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';

function buildSystemPrompt(vad, emotion, segments) {
  const segmentSummary = segments
    .map(s => `"${s.text}" → ${s.emotion} (intensity: ${s.intensity})`)
    .join('\n');

  return `You are an emotionally intelligent AI assistant.

Overall emotion: ${emotion}
VAD: valence=${vad[0]}, arousal=${vad[1]}, dominance=${vad[2]}

Emotional breakdown of what the user said:
${segmentSummary}

Respond naturally reflecting these emotional shifts. Mirror their emotional journey in your reply.
Use [pause], [softly], [firmly], [warmly] tags in your response to indicate how each part should be spoken.
Keep response to 3-4 sentences max.`;
}

async function generateResponse(text, vad, emotion, history = [], segments = []) {
  const start = Date.now();

  const messages = [
    { role: 'system', content: buildSystemPrompt(vad, emotion, segments) },
    ...history,
    { role: 'user', content: text },
  ];

  logger.debug('[LLMService] Calling', {
    url: config.groq.chatUrl,
    model: config.groq.llmModel,
    keyLoaded: !!config.groq.apiKey,
  });

  try {
    const response = await axios.post(
      config.groq.chatUrl,
      {
        model: config.groq.llmModel,
        messages,
        max_tokens: config.groq.maxTokens,
        temperature: config.groq.temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices[0].message.content.trim();
    const enhancedDialogue = `[${emotion}] ${text}`;
    logger.debug(`[LLMService] LLM done in ${Date.now() - start}ms`);
    return { reply, enhancedDialogue };

  } catch (err) {
    logger.error('[LLMService] Full error', {
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
}

export { generateResponse };