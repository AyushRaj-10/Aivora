# AI Voice Assistant Backend

This project serves as a real-time, low-latency streaming Voice Assistant pipeline. It handles incoming raw speech audio, transcribes it, processes the text using a Large Language Model (LLM), and returns a textual response to the client which native browsers synthesize on-the-spot using the Web Speech API.

## Project Evolution
Previously, this project leveraged an external Python Machine Learning engine (`python_ml`) for emotion/VAD (Voice Activity Detection), and third-party services like OpenRouter and ElevenLabs for text generation and Text-to-Speech (TTS), respectively.

In its **current state**, the pipeline has been aggressively streamlined for minimal latency and maximum cost-efficiency:
1. **Removed `python_ml`**: Avoids complex background polling and multi-service orchestration overhead.
2. **Removed ElevenLabs TTS**: Handled directly in the frontend via the Web Speech API (`SpeechSynthesisUtterance`), eliminating generation wait-times completely.
3. **Optimized for Groq**: All inferences (STT and LLM generation) operate entirely on ultra-fast Groq endpoints.

## Folder Structure

```text
├── public/
│   └── index.html               # Web UI that records audio, communicates via WebSockets, and plays back TTS.
├── src/
│   ├── config/                  # Server configuration, Groq API keys, constants, and WS payload definitions.
│   ├── controllers/             # WebSocket payload tracking and routing.
│   │   └── audioController.js   # Handles binary streams, ping loops, and triggers the orchestrator.
│   ├── middleware/              # Express middlewares (e.g., error handlers).
│   ├── orchestrator/            # Where the magic happens.
│   │   └── pipeline.js          # The STT -> LLM synchronous flow. 
│   ├── services/                # External API integrators.
│   │   ├── llmService.js        # Groq LLaMA 3 implementation.
│   │   └── whisperService.js    # Groq Whisper large-v3 STT engine.
│   ├── utils/                   # Helpers.
│   │   ├── audioUtils.js        # Audio binary assertions.
│   │   └── logger.js            # Logging integration.
│   └── server.js                # Core Express app and WebSocket Server entrypoint.
├── .env                         # Secrets configuration mapping.
└── package.json                 # Node dependencies.
```

## API & Endpoints

### 1. **WebSocket (`ws://localhost:8080`)**

The primary interface for this real-time app operates purely on WebSockets.

#### **Incoming Payloads (Client → Server)**
- **Binary Data (`Buffer/ArrayBuffer`)**: When the server receives a binary blob, it considers it a raw audio file or chunk. The server evaluates the buffer size and runs it strictly through the pipeline (`audioController`).
- **Ping Event (JSON object)**: To keep modern browsers from dropping connections due to navigation-idling, the front-end sends a `"type": "ping"` ping JSON over the connection every 5 seconds. The server catches this JSON payload safely and bails out before trying to transcode it.

#### **Outgoing Payloads (Server → Client)**
- **Transcript (`transcript`)**: An initial ping when Whisper successfully translates the user's audio.
- **Audio Response (`audio_response`)**: The finalized text response composed by the LLM. *Note: this payload used to carry a `base64` audio byte stream from ElevenLabs, but now only provides the `"text"` field for the frontend to synthesize natively.*

---

### 2. **Express HTTP Interfaces**

The HTTP configuration operates natively alongside WebSockets.

- **`GET /`** (Static Route)
  - **Description**: Exposes all static assets residing in the `/public` folder. Navigating to `/` or `/index.html` serves up the frontend. Doing so via the HTTP port natively matches the domain origin for the Websocket connection, preventing sudden closures from security or CORS navigation blocks.
- **`GET /health`**
  - **Description**: Barebones uptime tracker. 
  - **Response**: `{"status": "ok", "timestamp": "2026-..."}`

## Installation & Running

1. Perform standard installations via `npm install`.
2. Populate the `.env` variables with a valid Groq API Key:
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key...
   ```
3. Run the development sequence via `node src/server.js`.
4. Open the browser testing interface at `http://localhost:8080`.
