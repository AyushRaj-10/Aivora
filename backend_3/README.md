# AI Emotionally Intelligent Voice Assistant

## Overview

This project provides a fully-fledged, real-time, low-latency conversational Voice Assistant. It is capable of transcribing user speech via WebSockets, detecting nuanced emotional shifts over time, and rendering a dynamic 3D avatar (via Three.js and TalkingHead) that speaks back to you with perfectly synced lip movements, facial blendshapes, and Cartesia's premium streaming voices.

### The Problem
Traditional voice assistants suffer from three main issues:
1. **High Latency**: Heavy Python orchestrations or sluggish TTS APIs cause noticeable wait times that break the illusion of real conversation.
2. **Robotic Tones**: Standard AI voices remain monotonous. They do not interpret how you are feeling or adapt their own tone in response.
3. **Static Interfaces**: Staring at a chat interface or a static image makes the process feel strictly like querying a search engine rather than engaging a persona.

### The Solution
We circumvent these architectural flaws by leveraging **Groq** for ultra-fast STT/LLM intelligence, **Cartesia** for high-quality streaming TTS, and a dynamic **Three.js 3D Avatar** frontend:
1. **Ultra-Fast Generation Pipeline**: Transcriptions and LLM inferences happen locally and instantaneously using Groq hardware. Cartesia streams raw TTS audio back instantly in continuous chunks via Server-Sent Events (SSE).
2. **Dynamic Segmented Emotion & Blendshapes**: The pipeline slices the user's transcript into independent phrases, scoring the `intensity` and `emotion` of every segment. These values dynamically drive Three.js facial blendshapes (`viseme`, `eyeBlinkLeft`, etc.) so the avatar actively reacts to the context of the dialogue!
3. **Stage Directions & Gestures**: The LLM parses out internal stage directions (e.g., `[looks away]`, `[sighs]`). The backend intercepts these text cues, passing them to the frontend to instantly trigger pre-baked Mixamo animations, completing the illusion of life.

---

## Architecture

```text
[ Browser / Frontend ] 
   │   (Microphone Audio Blob via WebSocket)
   ▼
[ Node.js Express Server ]
   │   (Buffer Assembly)
   ▼
[ Groq Whisper STT ] --> Output: "I can't believe this is happening..."
   │
[ Groq Llama-3 Emotion Analysis ] --> Output: {"overall": "frustrated", "segments": [...], "vad": [valence, arousal, dominance]}
   │   (Emotion & VAD immediately emitted to Client to morph the Avatar's expression)
   ▼
[ Groq Llama-3 Dialogue ] --> Output: "[sighs] I hear you. Let's take a breath together."
   │   
   ├─> [ Gesture Extractor ]  --> Triggers "Breathing Idle" animation via Websocket
   ├─> [ Text Sanitization ]  --> Output: "I hear you. Let's take a breath together."
   │
   ▼
[ TTS Engine via Cartesia API ]
   │   - Matches textual emotion against custom speaking speeds and Cartesia controls.
   │   - Receives raw chunked PCM Audio via HTTP SSE streams.
   │
[ WebSocket Bridge ]
   │   (Chunks piped as Base64 JSON directly to the Frontend)
   ▼
[ TalkingHead / Three.js Frontend ]
   │   (Decodes Base64 into Int16Array arrays. Once the stream ends, perfectly syncs audio playback with the Avatar's lip blendshapes!)
   ▼
🔊 Visual & Audio Output
```

---

## Folder Structure

```text
├── public/                 
│   ├── index.html               # The frontend UI. Initializes Three.js, the 3D .glb avatar, microphone loops, and WebSockets.
│   └── avatar.glb               # Your 3D Avatar file (Requires Oculus Visemes + ARKit shapes for lipsyncing).
├── src/
│   ├── config/                  # Constants, bounds, and API key environment loaders.
│   ├── controllers/             
│   │   └── audioController.js   # Master session controller. Ingests raw chunks, runs the pipeline, and safely maps WebSocket sends.
│   ├── orchestrator/            
│   │   └── pipeline.js          # The structural spine. Sequences STT -> Emotion Array -> LLM Dialogue -> TTS output.
│   ├── services/                
│   │   ├── whisperService.js    # Groq whisper-large-v3 transcription integration.
│   │   ├── emotionService.js    # Extracts Valence, Arousal, Dominance (VAD) and phrase-by-phrase sentiment mappings.
│   │   ├── llmService.js        # The persona engine. Generates stage directions and dialogue reacting to the user's emotion.
│   │   └── ttsService.js        # Cartesia integration. Manipulates speed coefficients and intercepts chunked Text-to-Speech streams.
│   └── server.js                # Core entry point. Boots up Express.js and the raw HTTP WS Server.
├── .env                     
└── package.json            
```

---

## APIs & WebSocket Protocol (`ws://localhost:8080`)

The primary communication gateway is full-duplex WebSockets to avoid HTTP overhead.

### Incoming Events (Client → Server)
- **Binary ArrayBuffer**: Standard `.webm` or `.wav` arrays. Piped directly into the processing sequence.
- **Keep-Alive Ping (`{"type": "ping"}`)**: Injected every 5 seconds to bypass browser/network timeout closures.

### Outgoing Events (Server → Client)
- **`transcript`**: Dispatched instantaneously right after STT transcription.
- **`emotion`**: Contains the timeline array and the mathematical VAD values. Directs the avatar face shapes.
- **`stage_direction`**: An array of animation cues like `["sighs"]` mapped against the internal TalkingHead gestures map.
- **`llm_response`**: The final unscrubbed textual response generated by the LLM for chat-log display.
- **`audio_chunk`**: An ongoing sequence of base64-encoded raw `Int16Array` audio chunks.
- **`audio_end`**: The trigger lock. Tells the frontend to flush the audio buffer arrays and commence `head.speakAudio()`.

## Quick Start
1. Ensure `.env` is updated with `GROQ_API_KEY` and `CARTESIA_API_KEY`.
2. Ensure you have a prepared `.glb` avatar loaded at `./public/avatar.glb` (*Note: The current index.html defaults to a remote Robot model to bypass local dependencies out of the box, you can swap it directly via the source file!*)
3. Run `npm install`
4. Run `npm run start` (or `node src/server.js`)
5. Open `http://localhost:8080` in your web browser. Grant microphone permissions, hold the Live Mic button, and speak!
