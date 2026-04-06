import dotenv from 'dotenv';
dotenv.config();

export default {
  server: {
    port: process.env.PORT || 8080,
    env: process.env.NODE_ENV || 'development',
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    whisperModel: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3',
    llmModel: process.env.LLM_MODEL || 'llama-3.1-8b-instant',
    audioUrl: 'https://api.groq.com/openai/v1/audio/transcriptions',
    chatUrl: 'https://api.groq.com/openai/v1/chat/completions',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 300,
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
  },

  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || "sk_79fed7495c8c50143f197d706a00178d6c07a5cefe3fba5a",
    voiceId: process.env.ELEVENLABS_VOICE_ID || '1Z7Y8o9cvUeWq8oLKgMY',
    model: 'eleven_turbo_v2_5',
  },



  websocket: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 30000,
  },
};