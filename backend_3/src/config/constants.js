export const WS_EVENTS = {
    // Incoming from frontend
    AUDIO_CHUNK: 'audio_chunk',
    AUDIO_END: 'audio_end',
    PING: 'ping',

    // Outgoing to frontend
    TRANSCRIPT: 'transcript',       // STT result
    LLM_RESPONSE: 'llm_response',  // AI text reply
    AUDIO_RESPONSE: 'audio_response', // TTS audio (base64)
    ERROR: 'error',
    PONG: 'pong',
    PROCESSING: 'processing',       // status updates
  };

export const LATENCY = {
    STT_TARGET: 300,
    LLM_TARGET: 800,
    TTS_TARGET: 400,
    TOTAL_TARGET: 2000,
};