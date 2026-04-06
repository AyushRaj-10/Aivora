import config from '../config/index.js';
import logger from '../utils/logger.js';

const SYSTEM_PROMPT = `You are a cartoon dialogue emotional enhancer.

Your ONLY job is to rewrite the given dialogue to be more emotionally expressive and engaging for animation.

STRICT RULES:
- Do NOT reply to the dialogue or respond as a character
- Do NOT add new plot content or change the meaning
- Do NOT add dialogue that wasn't there
- ONLY rewrite existing lines to be more emotionally rich
- Add stage directions in [brackets] for animators: [whispers], [voice breaking], [excited], [pause]
- Use emphasis with CAPS sparingly for emotional peaks
- Match the detected emotion: {emotion}
- Keep it suitable for the cartoon's tone

OUTPUT FORMAT — return only the enhanced dialogue, nothing else. No explanations.

EXAMPLE:
Input emotion: sad
Input: "I don't want to go."
Output: "I... I don't want to go." [voice trembling, eyes downcast]

Input emotion: excited  
Input: "We won!"
Output: "We WON! [leaps into the air, laughing] Can you believe it?!"
`;

async function generateResponse(text, vad, emotion, history = [], segments = []) {
  const start = Date.now();

  const userContent = `Detected emotion: ${emotion} (valence: ${vad[0]}, arousal: ${vad[1]})

Emotion segments:
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
    console.debug("[LLMService] About to fetch...");
    const response = await fetch(config.groq.chatUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.groq.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.groq.llmModel,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    console.debug(`[LLMService] HTTP status: ${response.status}`);
    console.debug(`[LLMService] Response ok: ${response.ok}`);

    const rawText = await response.text(); 
    console.debug(`[LLMService] Raw text:\n${rawText}`);

    const llmResponse = JSON.parse(rawText);
    console.debug(`[LLMService] Parsed:\n${JSON.stringify(llmResponse, null, 2)}`);

    const enhancedText = llmResponse?.choices?.[0]?.message?.content || "";
    
    console.debug(`[LLMService] Enhanced text: ${enhancedText}`);
    console.debug(`[LLMService] Text length: ${enhancedText.length}`);
    
    logger.debug(`[LLMService] LLM enhancement done in ${Date.now() - start}ms`);
    return { reply: enhancedText, enhancedDialogue: enhancedText };

  } catch (err) {
    logger.error('[LLMService] Full error', typeof err === 'object' ? err.message : err);
    throw err;
  }
}

export { generateResponse };