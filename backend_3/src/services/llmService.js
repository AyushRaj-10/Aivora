import config from '../config/index.js';
import logger from '../utils/logger.js';

const SYSTEM_PROMPT = `You are a cartoon dialogue emotional enhancer.

Your ONLY job is to rewrite the given dialogue to be more emotionally expressive and engaging for animation, and then analyze your own enhanced dialogue for emotional vectors.

STRICT RULES for the enhanced text:
- Do NOT reply to the dialogue or respond as a character
- Do NOT add new plot content or change the meaning
- Do NOT add dialogue that wasn't there
- ONLY rewrite existing lines to be more emotionally rich
- Add stage directions in [brackets] for animators: [whispers], [voice breaking], [excited], [pause]
- Match the detected emotion: {emotion}

OUTPUT FORMAT: You MUST return ONLY a valid JSON object matching this schema exactly. No explanations, no markdown code blocks outside of the absolute JSON object.

{
  "enhanced_text": "I... I don't want to go. [voice trembling, eyes downcast]",
  "vad": [0.1, -0.6, -0.8], 
  "segments": [
    {
      "text": "I... I don't want to go.",
      "emotion": "sad",
      "intensity": 0.8
    }
  ]
}

Note: VAD is an array of 3 numbers representing Valence, Arousal, Dominance ranging from -1.0 to 1.0. 
Segment intensity should be 0.0 to 1.0. Use your best aesthetic judgement for the new VAD scores of your generated text.`;

async function generateResponse(text, vad, emotion, history = [], segments = []) {
  const start = Date.now();

  const userContent = `Original Emotion: ${emotion} (valence: ${vad[0]}, arousal: ${vad[1]})
Original Segments:
${segments.map(s => `"${s.text}" → ${s.emotion} (intensity: ${s.intensity})`).join("\n")}

Original dialogue to enhance:
${text}`;

  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPT.replace('{emotion}', emotion),
    },
    { role: 'user', content: userContent },
  ];

  logger.debug('[LLMService] Calling for dialogue enhancement', {
    url: config.groq.chatUrl,
    model: config.groq.llmModel,
  });

  try {
    const response = await fetch(config.groq.chatUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.groq.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.groq.llmModel,
        messages,
        max_tokens: 1500,
        temperature: 0.6,
        response_format: { type: "json_object" }
      }),
    });

    const rawText = await response.text(); 
    const llmResponse = JSON.parse(rawText);
    const content = llmResponse?.choices?.[0]?.message?.content || "{}";

    let parsedResult = { enhanced_text: text, vad: vad, segments: [] };
    try {
      parsedResult = JSON.parse(content);
    } catch (e) {
      logger.error("[LLMService] Failed to parse generated JSON", content);
    }
    
    logger.debug(`[LLMService] LLM enhancement done in ${Date.now() - start}ms`);
    return { 
      reply: parsedResult.enhanced_text || text, 
      enhancedDialogue: parsedResult.enhanced_text || text,
      enhanced_vad: parsedResult.vad || vad,
      enhanced_segments: parsedResult.segments || []
    };

  } catch (err) {
    logger.error('[LLMService] Full error', typeof err === 'object' ? err.message : err);
    throw err;
  }
}


export { generateResponse };