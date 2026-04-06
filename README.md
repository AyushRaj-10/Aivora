# AI Emotionally Intelligent Voice Assistant

## Overview

This project provides a real-time, low-latency conversational Voice Assistant capable of transcribing speech, detecting emotional nuances over time, and speaking back dynamically using realistic emotional tags. 

### The Problem
Traditional voice assistants suffer from three main issues:
1. **High Latency**: Using sluggish third-party Text-to-Speech (TTS) and deep-learning ML services orchestrating locally in Python often incurs heavy generation wait times.
2. **Robotic Tones**: Standard Voice AI outputs are monotonous and fail to adapt their inflection to the context of the user's emotional state.
3. **Complex Infrastructure**: Local orchestration of Python ML workers usually requires large amounts of system resources, custom polling handlers, and disjointed API services.

### The Solution
We circumvent all these architectural flaws by leveraging **Groq** for ultra-fast intelligence and the **Web Speech API** for instantaneous native speech:
1. **Lightweight Edge Performance**: Completely stripped away bulky local Python inference servers, relegating all high-density transcription and processing directly to Groq's high-performance hardware.
2. **Dynamic Segmented Emotion**: Instead of simply returning a single flat emotion, the pipeline slices transcripts into independent phrases, scoring the `intensity` and `emotion` of every segment.
3. **Zero-Latency TTS**: By pushing speech responsibilities strictly to the browser's native API (`SpeechSynthesisUtterance`), we eliminate generation wait time and inject dynamic modifiers like `[pause]`, `[softly]`, and `[firmly]` to dynamically shift playback speeds and pitches in real-time.

---

## Architecture

```text
[ Browser / Frontend ] 
   │   (Microphone Stream via WebSocket)
   ▼
[ Node.js Express Server ]
   │   (Binary validation)
   ▼
[ STT via Groq Whisper ] --> Output: "I can't believe this is happening..."
   │
[ Emotion Engine via Groq Llama 3 ] --> Output: {"overall": "angry", "segments": [...]}
   │
[ LLM Response Engine via Groq Llama 3 ] --> Output: "I hear you. [pause] Let's take a breath."
   │
   ▼
[ Browser Web Speech API ]
   │   - Extracts runtime tags -> `[pause]` triggers 600ms delays
   │   - Restructures pitch and rate dynamically per phrase loop.
   ▼
🔊 Audio Output
```

---

## Folder Structure

```text
├── public/                 
│   └── index.html               # The core frontend. Captures mic arrays, holds WS connection, and dictates native Speech playback parameters.
├── src/
│   ├── config/                  # Envrionment bounds and latency constants.
│   ├── controllers/             
│   │   └── audioController.js   # Orchestrates WS events, pings, and guards session loops.
│   ├── orchestrator/            
│   │   └── pipeline.js          # Sequences STT -> Emotion Array extraction -> LLM. 
│   ├── services/                
│   │   ├── whisperService.js    # Direct integration to `whisper-large-v3`.
│   │   ├── emotionService.js    # Utilizes `llama-3.3-70b-versatile` to extract VAD and dynamic segments via formatted JSON.
│   │   └── llmService.js        # Modifies system prompts using the extracted vocal context array logic.
│   └── server.js                # Core app, hosting Node Express + WebSocket server.
├── .env                     
└── package.json            
```

---

## APIs & Endpoints

### 1. **WebSocket (`ws://localhost:8080`)**

The primary communication gateway is purely full-duplex WebSockets.

#### **Incoming Events (Client → Server)**
- **Binary ArrayBuffer**: Standard `.wav` or `.webm` blobs. Automatically treated as audio payloads and piped straight into the pipeline sequence.
- **Keep-Alive Ping (`{"type": "ping"}`)**: Injected every 5 seconds from the HTML endpoint to guarantee the browser does not throttle the connection into a navigational drop code (e.g. `1001`). 

#### **Outgoing Events (Server → Client)**
- **`transcript`**: Dispatched instantaneously right after STT returns the text phrase.
- **`emotion`**: Contains the timeline array:
  ```json
  {
      "type": "emotion", 
      "emotion": "sad", 
      "vad": [ ... ],
      "segments": [
          { "text": "...", "emotion": "sad", "intensity": 0.8 },
          { "text": "...", "emotion": "frustrated", "intensity": 0.3 }
      ]
  }
  ```
- **`audio_response`**: Returns the `text` string populated with emotional timeline tags (e.g., `[firmly]`, `[softly]`) for frontend audio synthesis.

### 2. **HTTP Interfaces (`http://localhost:8080`)**

- **`GET /`**
  - Statically serves the `public/` directory so the WebSocket and HTML layer share the exact same `localhost` origin port (eliminating file:// security navigation closures). 
- **`GET /health`**
  - **Response**: `{"status": "ok", "timestamp": "2026-..."}` 

## Quick Start
1. Ensure `.env` is updated with `GROQ_API_KEY`.
2. Run `npm install`, followed by `node src/server.js`.
3. Open `http://localhost:8080` in your web browser.
