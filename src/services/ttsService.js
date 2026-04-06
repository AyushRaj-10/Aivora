import { KokoroTTS } from "kokoro-js";
import logger from '../utils/logger.js';

let tts = null;

// Emotion is expressed through: speed + text-level cues injected before synthesis
const EMOTION_STYLE_MAP = {
  happy:     { voice: "af_heart",  speed: 1.15, prefix: ""                        },
  sad:       { voice: "af_heart",  speed: 0.82, prefix: "... "                    },
  angry:     { voice: "af_heart",  speed: 1.25, prefix: ""                        },
  fearful:   { voice: "af_heart",  speed: 0.88, prefix: "... um... "              },
  surprised: { voice: "af_heart",  speed: 1.1,  prefix: "Oh! "                    },
  disgusted: { voice: "af_heart",  speed: 0.9,  prefix: ""                        },
  neutral:   { voice: "af_heart",  speed: 1.0,  prefix: ""                        },
};

export async function initTTS() {
  logger.info("[TTS] Loading Kokoro model...");
  tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    dtype: "q8",
    device: "cpu",
  });
  logger.info("[TTS] Kokoro ready.");
}

export async function synthesize(text, emotion = "neutral", intensity = 0.5) {
  if (!tts) throw new Error("TTS not initialized");

  const style = EMOTION_STYLE_MAP[emotion] ?? EMOTION_STYLE_MAP.neutral;

  // Scale speed by intensity — more intense emotion = more exaggerated speed
  // intensity comes from your emotion segment: { emotion, intensity: 0.0-1.0 }
  const baseSpeed = style.speed;
  const neutralSpeed = 1.0;
  const scaledSpeed = neutralSpeed + (baseSpeed - neutralSpeed) * intensity;

  // Strip LLM tags first
  let cleanText = text.replace(/\[.*?\]/g, "").trim();

  // Inject emotional text cues that influence Kokoro's prosody
  cleanText = applyEmotionTextCues(cleanText, emotion, intensity);

  // Add prefix
  cleanText = style.prefix + cleanText;

  logger.info(`[TTS] Synthesizing | emotion=${emotion} intensity=${intensity.toFixed(2)} speed=${scaledSpeed.toFixed(2)}`);

  const audio = await tts.generate(cleanText, { voice: style.voice, speed: scaledSpeed });
  return audio.toWav();
}

// This is the key function — Kokoro responds to punctuation and pacing cues in text
function applyEmotionTextCues(text, emotion, intensity) {
  switch (emotion) {
    case "sad":
      // Add ellipses to create natural pausing and slower delivery
      return text
        .replace(/,/g, "...")
        .replace(/\. /g, "... ");

    case "angry":
      // Exclamation marks push Kokoro toward sharper, more clipped delivery
      return text
        .replace(/\. /g, "! ")
        .replace(/,$/, "!");

    case "fearful":
      // Broken rhythm with ellipses simulates hesitation
      return text
        .replace(/ /g, (_, offset) => offset % 20 === 0 ? "... " : " ");

    case "happy":
      // Kokoro reads exclamations with higher energy
      if (intensity > 0.6 && !text.endsWith("!")) {
        return text.replace(/\.$/, "!");
      }
      return text;

    case "surprised":
      return text.endsWith("?") || text.endsWith("!")
        ? text
        : text.replace(/\.$/, "?!");

    default:
      return text;
  }
}