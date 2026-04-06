import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';

function buildSystemPrompt() {
  return `You are an intelligent AI assistant.

Keep responses concise (2-3 sentences max). Natural, conversational language only.`;
}

async function generateResponse(text, history = []) {
  const start = Date.now();

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
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
    logger.debug(`[LLMService] LLM done in ${Date.now() - start}ms`);
    return { reply };

  } catch (err) {
    logger.error('[LLMService] Full error', {
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
}

export { generateResponse };