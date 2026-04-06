import Groq from 'groq-sdk';
import logger from '../utils/logger.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function detectEmotion(transcript) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `You are an expert in vocal emotion analysis. Break this transcript into emotional segments.

"${transcript}"

Respond with ONLY a JSON object, nothing else:
{
  "overall": "the dominant emotion",
  "vad": {"valence": 0.0, "arousal": 0.0, "dominance": 0.0},
  "segments": [
    {
      "text": "exact phrase from transcript",
      "emotion": "emotion label",
      "intensity": 0.0,
      "valence": 0.0,
      "arousal": 0.0
    }
  ]
}

Use these emotions: happy, sad, angry, fearful, neutral, excited, frustrated, melancholic, hopeful, anxious, confident, confused.
Intensity is 0 to 1. VAD values are -1 to 1.`
      }
    ],
    max_tokens: 800,
    temperature: 0.1,
  });

  try {
    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    logger.debug('[EmotionService] Detected', parsed);
    return {
      emotion: parsed.overall || 'neutral',
      vad: [parsed.vad?.valence || 0, parsed.vad?.arousal || 0, parsed.vad?.dominance || 0],
      segments: parsed.segments || []
    };
  } catch {
    return { emotion: 'neutral', vad: [0, 0, 0], segments: [] };
  }
}

export { detectEmotion };
