import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Upload, AlertTriangle, Download, Activity, FileAudio, ArrowRight, PlayCircle, RotateCcw } from "lucide-react";
import CharacterFace from "./CharacterFace";
import CinemaAvatar from "./components/CinemaAvatar";
import LandingPage from "./components/LandingPage";
import ParticleBackground from "./components/ParticleBackground";
import Spline from "@splinetool/react-spline";
import "./App.css";

// ── Constants ──────────────────────────────────────────────────────────
const WS_URL = "ws://localhost:8080";

const MOOD_MAP = {
  happy: "happy",
  sad: "sad",
  angry: "angry",
  surprised: "surprised",
  fearful: "fear",
  disgusted: "disgust",
  confused: "sad",
  hopeful: "happy",
  excited: "happy",
  confident: "happy",
  anxious: "fear",
  neutral: "neutral",
};

const DIRECTION_ANIMATIONS = {
  "looks away": "Idle",
  "sighs": "Breathing Idle",
  "nods": "Head Nod",
  "shrugs": "Shrug",
  "leans in": "Talking",
};

// ── Audio Helper ────────────────────────────────────────────────────────
function float32ToWav(float32Array, sampleRate = 44100) {
  const buffer = new ArrayBuffer(44 + float32Array.length * 2);
  const view = new DataView(buffer);

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + float32Array.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 1 channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate 
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(view, 36, 'data');
  view.setUint32(40, float32Array.length * 2, true);

  let offset = 44;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// ── Components ──────────────────────────────────────────────────────────

// SVG Line Graph Component
function VADLineGraph({ originalVad, enhancedVad }) {
  // We'll normalize the [-1, 1] values to SVG coordinates
  // SVG Height: 100, Width: 300
  // Value 1 -> y=10
  // Value 0 -> y=50
  // Value -1 -> y=90
  
  const getY = (val) => {
    return 50 - (val * 40);
  };
  
  // Points: X-coordinates are 50 (Valence), 150 (Arousal), 250 (Dominance)
  const oPoints = `50,${getY(originalVad[0])} 150,${getY(originalVad[1])} 250,${getY(originalVad[2])}`;
  const ePoints = `50,${getY(enhancedVad[0])} 150,${getY(enhancedVad[1])} 250,${getY(enhancedVad[2])}`;
  
  return (
    <div className="relative w-full h-32 bg-black/40 rounded-xl border border-white/5 overflow-hidden flex flex-col p-2">
       <span className="text-[9px] uppercase tracking-widest text-gray-400 absolute top-2 left-3 z-10">Vector Comparison Plot</span>
       
       {/* Legend */}
       <div className="absolute top-2 right-3 flex gap-3 z-10">
         <div className="flex items-center gap-1">
           <div className="w-2 h-2 rounded-full bg-blue-500" />
           <span className="text-[8px] uppercase text-gray-500">Human</span>
         </div>
         <div className="flex items-center gap-1">
           <div className="w-2 h-2 rounded-full bg-purple-500" />
           <span className="text-[8px] uppercase text-gray-500">AI</span>
         </div>
       </div>

       <svg viewBox="0 0 300 100" className="w-full h-full mt-2">
          {/* Grid lines */}
          <line x1="0" y1="10" x2="300" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4" />
          <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="0" y1="90" x2="300" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4" />
          
          {/* Labels */}
          <text x="50" y="98" fill="gray" fontSize="8" textAnchor="middle">Valence</text>
          <text x="150" y="98" fill="gray" fontSize="8" textAnchor="middle">Arousal</text>
          <text x="250" y="98" fill="gray" fontSize="8" textAnchor="middle">Dominance</text>

          {/* Original Line (Human - Blueish) */}
          <polyline points={oPoints} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy={getY(originalVad[0])} r="3" fill="#3b82f6" />
          <circle cx="150" cy={getY(originalVad[1])} r="3" fill="#3b82f6" />
          <circle cx="250" cy={getY(originalVad[2])} r="3" fill="#3b82f6" />

          {/* Enhanced Line (AI - Purpleish) */}
          <polyline points={ePoints} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy={getY(enhancedVad[0])} r="3" fill="#a855f7" />
          <circle cx="150" cy={getY(enhancedVad[1])} r="3" fill="#a855f7" />
          <circle cx="250" cy={getY(enhancedVad[2])} r="3" fill="#a855f7" />
       </svg>
    </div>
  );
}

function SegmentList({ title, segments, colorClass }) {
  if (!segments || segments.length === 0) return <p className="text-gray-600 text-xs italic">No segments analyzed.</p>;
  return (
    <div className={`glass-panel-inner rounded-xl p-4 flex flex-col gap-3 h-full border-t-2 ${colorClass}`}>
      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{title}</h4>
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
         {segments.map((s, i) => (
           <div key={i} className="bg-black/30 p-3 rounded-lg border border-white/5 relative">
             <div className="flex justify-between items-start mb-2">
               <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${colorClass.replace('border-t-', 'bg-').replace('500', '500/20').replace('400', '400/20')} text-white`}>
                 {s.emotion}
               </span>
               <span className="text-gray-500 text-[8px] font-mono">Int: {Number(s.intensity).toFixed(2)}</span>
             </div>
             <p className="text-xs text-gray-300 italic">"{s.text}"</p>
           </div>
         ))}
      </div>
    </div>
  );
}

// ── App Container ───────────────────────────────────────────────────────
function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originalAudio, setOriginalAudio] = useState(null);
  const [enhancedAudioBlob, setEnhancedAudioBlob] = useState(null);
  const [loadingStage, setLoadingStage] = useState("Standby");
  const [isConnected, setIsConnected] = useState(false);
  const [useVoiceClone, setUseVoiceClone] = useState(true);

  const [hasEnteredApp, setHasEnteredApp] = useState(false);

  // Track the absolute newest result independently of closure staleness in handleWSMessage
  const resultRef = useRef(null);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const socketRef = useRef(null);
  const pcmChunksRef = useRef([]);
  const latestFloat32Ref = useRef(null);

  const avatarRef = useRef(null);

  const handleReplay = () => {
    if (!latestFloat32Ref.current || !avatarRef.current || !result) return;
    
    const audioCtx = avatarRef.current.getHead()?.audioCtx;
    if (!audioCtx) return;
    
    const audioBuffer = audioCtx.createBuffer(1, latestFloat32Ref.current.length, 44100);
    audioBuffer.copyToChannel(latestFloat32Ref.current, 0);
    
    const mood = MOOD_MAP[result.true_emotion] || "neutral";
    const script = result.llm_response || "";
    
    avatarRef.current.speakAudio(audioBuffer, script, mood);
  };

  // ─── WebSocket Initialization ──────────────────────────────────────
  useEffect(() => {
    const connectWS = () => {
      const socket = new WebSocket(WS_URL);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("🚀 WS Connected");
        setIsConnected(true);
        setInterval(() => socket.readyState === 1 && socket.send(JSON.stringify({ type: 'ping' })), 5000);
      };

      socket.onmessage = async (event) => {
        if (typeof event.data !== "string") return;
        try {
          const data = JSON.parse(event.data);
          handleWSMessage(data);
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      socket.onclose = () => {
        console.warn("🔌 WS Disconnected. Retrying...");
        setIsConnected(false);
        setTimeout(connectWS, 3000);
      };

      socket.onerror = (err) => {
        console.error("❌ WS Error", err);
        socket.close();
      };
    };

    connectWS();
    return () => socketRef.current?.close();
  }, []);

  // ─── Handle WebSocket Messages ─────────────────────────────────────
  const handleWSMessage = (data) => {
    switch (data.type) {
      case "transcript":
        setTranscript(data.text);
        setLoadingStage("Generating Response & Expressive Timeline...");
        break;

      case "emotion":
        setLoadingStage("AI Director composing logic...");
        const mood = MOOD_MAP[data.emotion] || "neutral";
        
        if (avatarRef.current) {
           avatarRef.current.setMood(mood);
        }

        setResult(prev => ({
          ...prev,
          vad: data.vad ? { valence: data.vad[0], arousal: data.vad[1], dominance: data.vad[2] } : null,
          true_emotion: data.emotion,
          segments: data.segments
        }));
        break;

      case "stage_direction":
        if (avatarRef.current) {
          data.directions.forEach((dir) => {
            const anim = DIRECTION_ANIMATIONS[dir.toLowerCase()];
            if (anim) avatarRef.current.playGesture(anim);
          });
        }
        setResult(prev => ({ ...prev, stage_directions: data.directions }));
        break;

      case "llm_response":
         setResult(prev => ({ 
           ...prev, 
           llm_response: data.reply,
           enhanced_vad: data.enhanced_vad,
           enhanced_segments: data.enhanced_segments 
         }));
         setLoadingStage("Voice Cloning engine initiated... Analysis in progress.");
         break;

      case "tts_progress":
        setLoadingStage(data.message || "Synthesizing cloned audio...");
        break;

      case "audio_chunk":
        setLoading(false);
        setLoadingStage("Receiving cloned audio...");
        if (data.audio) {
          const binaryString = window.atob(data.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          pcmChunksRef.current.push(new Int16Array(bytes.buffer));
        }
        break;

      case "audio_end":
        console.log("audio_end received, chunks:", pcmChunksRef.current.length);
        if (pcmChunksRef.current.length === 0) return;

        const totalLength = pcmChunksRef.current.reduce((sum, c) => sum + c.length, 0);
        const merged = new Int16Array(totalLength);
        let offset = 0;
        for (const chunk of pcmChunksRef.current) {
            merged.set(chunk, offset);
            offset += chunk.length;
        }

        const float32 = new Float32Array(merged.length);
        for (let i = 0; i < merged.length; i++) {
            float32[i] = merged[i] / 32768.0;
        }

        const wavBlob = float32ToWav(float32, 44100);
        latestFloat32Ref.current = float32;
        setEnhancedAudioBlob(URL.createObjectURL(wavBlob));

        if (avatarRef.current && avatarRef.current.getHead()) {
           const audioCtx = avatarRef.current.getHead().audioCtx;
           if (audioCtx) {
             const audioBuffer = audioCtx.createBuffer(1, float32.length, 44100);
             audioBuffer.copyToChannel(float32, 0);
             
             // Extract latest data natively from ref to bypass stale closures WITHOUT
             // triggering React StrictMode double-rendering side effects!
             const mood = MOOD_MAP[resultRef.current?.true_emotion] || "neutral";
             const script = resultRef.current?.llm_response || "";
             
             avatarRef.current.speakAudio(audioBuffer, script, mood);
           }
        }

        pcmChunksRef.current = [];
        setLoading(false);
        break;

      case "error":
        console.error("Server Error:", data.error);
        setLoading(false);
        break;

      default:
        console.log("Unhandled WS message:", data);
    }
  };

  // ─── Recording ────────────────────────────────────────────────────
  const startRecording = async () => {
    if (avatarRef.current) {
       await avatarRef.current.resumeAudioContext();
    }

    setResult({
       vad: { valence: 0, arousal: 0, dominance: 0 },
       true_emotion: "neutral",
       stage_directions: [],
       segments: [],
       enhanced_vad: null,
       enhanced_segments: []
    });
    setTranscript("");
    setEnhancedAudioBlob(null);
    pcmChunksRef.current = [];
    latestFloat32Ref.current = null;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setOriginalAudio(url);
      await sendToBackend(blob, "recording.webm");
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setLoading(true);
  };

  const handleRecord = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (avatarRef.current) {
        await avatarRef.current.resumeAudioContext();
    }

    setResult({
        vad: { valence: 0, arousal: 0, dominance: 0 },
        true_emotion: "neutral",
        stage_directions: [],
        segments: [],
        enhanced_vad: null,
        enhanced_segments: []
    });
    setTranscript("");
    setEnhancedAudioBlob(null);
    pcmChunksRef.current = [];
    latestFloat32Ref.current = null;

    setOriginalAudio(URL.createObjectURL(file));
    setLoading(true);
    await sendToBackend(file, file.name);
    event.target.value = null;
  };

  const sendToBackend = async (blobOrFile) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected. ReadyState:", socketRef.current?.readyState);
      alert("Backend not connected! Please start the server and wait for the green indicator.");
      setLoading(false);
      return;
    }

    setLoadingStage("Analyzing Acoustic Subtext...");

    try {
      // Send configuration first
      socketRef.current.send(JSON.stringify({ type: 'config', useVoiceClone }));
      // Then send the audio file
      const buffer = await blobOrFile.arrayBuffer();
      socketRef.current.send(buffer);
    } catch (err) {
      console.error("Failed to send audio via WS", err);
      setLoading(false);
    }
  };

  function downloadKeyframes(result) {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "animation_brief.json";
    a.click();
  }

  // ─── Animation Variants ───────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-16 px-6 font-sans relative">
      <div className={`ambient-glow ${isRecording ? "recording" : ""}`} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 z-10">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl glass-panel-inner shadow-inner shadow-white/5">
          <Activity className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-gray-100 to-gray-500 bg-clip-text text-transparent text-shadow-glow">
          Nexora
        </h1>
        <p className="text-gray-400 text-sm font-medium tracking-wide">
          Neural Emotion Animation & Real-Time 3D Engine
        </p>
      </motion.div>

      {/* Contradiction Badge */}
      <AnimatePresence>
        {result?.subtext_detected && !loading && (
          <motion.div
            key="contradiction-badge"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-8 bg-red-950/40 border border-red-500/30 text-red-200 
                       text-sm px-5 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.15)]"
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="font-semibold tracking-wide">
              Subtext detected — voice contradicts words
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <ParticleBackground />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <Spline scene="https://prod.spline.design/uLUS1iMnpMM5kmnq/scene.splinecode" />
      </div>

      <AnimatePresence mode="wait">
        {!hasEnteredApp ? (
          <LandingPage key="landing" onEnter={() => setHasEnteredApp(true)} />
        ) : (
          <motion.div key="app-console" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.5 } }} className="w-full max-w-[1400px] z-10 flex flex-col gap-8 relative mt-12 mb-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT — Original Data (Sidebar) */}
              <motion.div variants={itemVariants} className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col gap-6 bg-black/40 backdrop-blur-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <h2 className="text-gray-300 font-semibold tracking-widest text-[10px] uppercase">Acoustic Source</h2>
                </div>

                <div className="glass-panel-inner rounded-2xl h-48 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 to-transparent pointer-events-none" />
                  <CharacterFace vad={result?.vad} loading={loading} />
                </div>

                <div className="glass-panel-inner rounded-xl p-4 min-h-[6rem] relative border-l-2 border-l-gray-600 bg-black/20">
                  {loading && !transcript ? (
                    <div className="space-y-3">
                      <div className="skeleton-box h-3 w-full" />
                      <div className="skeleton-box h-3 w-3/4" />
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs leading-relaxed font-medium italic">
                      {transcript || "Standby for input..."}
                    </p>
                  )}
                </div>

                {originalAudio && (
                  <div className="glass-panel-inner rounded-xl px-3 py-2 flex items-center gap-3">
                    <FileAudio className="w-4 h-4 text-gray-400" />
                    <audio controls src={originalAudio} className="w-full h-8 opacity-60 mix-blend-screen custom-audio-mini" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Detected Tone</span>
                  <span className="glass-panel-inner border border-gray-600/30 text-gray-400 font-bold text-[9px] px-3 py-1 rounded-full">
                    {result?.true_emotion || "---"}
                  </span>
                </div>
              </motion.div>

              {/* RIGHT — Enhanced AI Animation (The Hero) */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-9 glass-panel border-purple-500/20 shadow-[0_0_60px_rgba(139,92,246,0.08),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl p-6 flex flex-col relative overflow-hidden min-h-[600px] bg-black/50 backdrop-blur-2xl"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex items-center justify-between mb-8 pb-4 border-b border-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                    <h2 className="text-purple-300 font-bold tracking-[0.2em] text-xs uppercase">
                      Real-Time 3D Cinema
                    </h2>
                  </div>
                  <div className="flex gap-4 items-center z-10">
                    <div 
                      className="flex items-center gap-2 cursor-pointer select-none" 
                      onClick={() => setUseVoiceClone(!useVoiceClone)}
                    >
                      <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${useVoiceClone ? 'text-purple-400' : 'text-gray-500'}`}>
                        Local Clone
                      </span>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors shadow-inner flex items-center ${useVoiceClone ? 'bg-purple-500/40 border border-purple-500/50' : 'bg-black/40 border border-gray-600/50'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform duration-300 ${useVoiceClone ? 'translate-x-4 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    {result && !loading && (
                      <button
                        onClick={() => downloadKeyframes(result)}
                        className="text-[9px] font-black text-gray-300 hover:text-white uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-md border border-white/10 hover:border-purple-500/30 transition-all flex items-center gap-2"
                      >
                        <Download className="w-3 h-3" /> Export Logs
                      </button>
                    )}
                  </div>
                </div>

                {/* ── 3D Avatar Area + Audio Controls ────────────────── */}
                <div className="flex-grow min-h-[450px] mb-8 relative rounded-2xl shadow-2xl border border-white/5 bg-gray-950/80 flex flex-col">
                  <div className="flex-grow relative h-[450px]">
                    <CinemaAvatar ref={avatarRef} />
                    
                    <AnimatePresence>
                      {loading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-10 glass-panel-inner flex flex-col items-center justify-center gap-10 bg-black/60 backdrop-blur-md rounded-2xl"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-32 h-32 flex items-center justify-center"
                          >
                            <div className="absolute inset-0 border-4 border-purple-500/10 rounded-full" />
                            <div className="absolute inset-0 border-[3px] border-t-purple-500 rounded-full animate-spin" style={{ animationDuration: "0.8s" }} />
                            <Activity className="w-10 h-10 text-purple-400" />
                          </motion.div>
                          <div className="text-center">
                            <p className="text-purple-300 font-black text-xs uppercase tracking-[0.3em] mb-2">{loadingStage}</p>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Streaming via WebSocket...</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Generated Audio Player Mount */}
                  {enhancedAudioBlob && (
                    <motion.div 
                       initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                       className="p-4 border-t border-white/5 bg-purple-900/10 flex items-center justify-between rounded-b-2xl"
                    >
                       <div className="flex items-center gap-3">
                         <PlayCircle className="w-5 h-5 text-purple-500" />
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Master Audio</span>
                       </div>
                       
                       <audio controls src={enhancedAudioBlob} className="h-8 max-w-[300px] opacity-80 mix-blend-screen custom-audio-mini" />
                       
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={handleReplay}
                           className="flex items-center gap-2 text-xs font-bold bg-indigo-500/20 shadow-[inset_0_1px_4px_rgba(255,255,255,0.2)] hover:bg-indigo-500/40 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg transition"
                         >
                           <RotateCcw className="w-4 h-4" /> Replay Avatar
                         </button>
                         <a 
                            href={enhancedAudioBlob} download="AIvora_Enhanced_Dialogue.wav"
                            className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg text-white transition decoration-none"
                         >
                           <Download className="w-4 h-4" /> Export .WAV
                         </a>
                       </div>
                    </motion.div>
                  )}
                </div>

              </motion.div>
            </div>

            {/* ── REPORT DASHBOARD (VAD Graph + Segment Text Comparison) ── */}
            <AnimatePresence>
              {result?.vad && !loading && (
                <motion.div
                  key="vad-vector-layer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel border-t border-l border-white/10 rounded-3xl p-8 flex flex-col gap-10"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <div className="flex items-center gap-3">
                       <Activity className="w-5 h-5 text-purple-400" />
                       <h3 className="text-gray-200 font-bold tracking-[0.2em] text-sm uppercase">Analytics Report Dashboard</h3>
                     </div>
                     {result.enhanced_vad && (
                       <span className="text-[10px] font-mono text-gray-500 uppercase">Delta Matrix Analyzed</span>
                     )}
                  </div>

                  {/* Top row: Graph + Matrix List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    {/* The 3 dynamic bars */}
                    <div className="flex flex-col gap-8">
                      {["valence", "arousal", "dominance"].map((key, i) => {
                        const val = result.vad?.[key] ?? 0.5;
                        const enhancedVal = result.enhanced_vad?.[i];
                        
                        return (
                          <motion.div key={key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="relative">
                            <div className="flex justify-between font-mono text-xs mb-3">
                              <span className="text-gray-400 capitalize tracking-widest bg-gray-800/50 px-2 py-0.5 rounded">{key}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-blue-300 font-bold bg-blue-900/30 px-2 py-0.5 rounded">H: {Number(val).toFixed(2)}</span>
                                {enhancedVal !== undefined && (
                                   <>
                                     <ArrowRight className="w-3 h-3 text-gray-600" />
                                     <span className="text-purple-300 font-bold bg-purple-900/30 px-2 py-0.5 rounded">AI: {Number(enhancedVal).toFixed(2)}</span>
                                   </>
                                )}
                              </div>
                            </div>
                            <div className="h-3 glass-panel-inner rounded-full overflow-hidden relative shadow-inner shadow-black/80">
                              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10 z-10" />
                              <motion.div
                                initial={{ width: "50%", opacity: 0 }}
                                animate={{ width: `${((val + 1) / 2) * 100}%`, opacity: 1 }}
                                transition={{ type: "spring", bounce: 0.2, duration: 1.2, delay: i * 0.2 }}
                                className={`h-full absolute top-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] bg-gradient-to-r from-blue-600 to-cyan-400 left-0`}
                                style={{ transformOrigin: "left" }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* The Graph */}
                    {result.enhanced_vad && (
                      <VADLineGraph 
                        originalVad={[result.vad.valence, result.vad.arousal, result.vad.dominance]} 
                        enhancedVad={result.enhanced_vad} 
                      />
                    )}
                  </div>

                  {/* Bottom row: The Text Segments Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                     <SegmentList title="Original Semantic Clusters" segments={result.segments} colorClass="border-t-blue-500" />
                     <SegmentList title="Enhanced Sentiment Synthesis" segments={result.enhanced_segments} colorClass="border-t-purple-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Controls */}
            <motion.div variants={itemVariants} className="flex flex-col items-center mt-4 mb-20 z-10 glass-panel rounded-3xl p-8 max-w-2xl mx-auto border-t border-white/10">
              <div className="flex items-center gap-10">
                {/* Record Button */}
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleRecord}
                    disabled={loading}
                    className={`w-24 h-24 rounded-full flex items-center justify-center relative z-20
                                ${
                                  isRecording
                                    ? "skeuo-btn-recording animate-pulse"
                                    : loading
                                    ? "skeuo-btn opacity-50 cursor-not-allowed"
                                    : "skeuo-btn skeuo-btn-accent"
                                }`}
                  >
                    {isRecording ? <Square className="w-8 h-8 fill-white text-white drop-shadow-md" /> : <Mic className="w-10 h-10 text-white drop-shadow-lg" />}
                  </button>
                  <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">{isRecording ? "Stop" : "Record"}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-600 to-transparent" />
                  <span className="text-gray-600 font-bold tracking-widest text-xs uppercase px-4 glass-panel-inner rounded-full py-1">OR</span>
                  <div className="w-px h-8 bg-gradient-to-b from-gray-600 via-gray-600 to-transparent" />
                </div>

                {/* Upload Button */}
                <div className="flex flex-col items-center gap-4">
                  <label
                    className={`w-24 h-24 rounded-full flex items-center justify-center relative group z-20
                                ${loading || !isConnected ? "skeuo-btn opacity-50 cursor-not-allowed" : "skeuo-btn cursor-pointer"}`}
                  >
                    <Upload className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors drop-shadow-md" />
                    <input
                      type="file"
                      accept="audio/mp3, audio/wav, audio/webm, audio/m4a, audio/flac"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={loading || isRecording || !isConnected}
                    />
                  </label>
                  <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Upload</span>
                </div>
              </div>

              <div className="mt-8 py-2 px-6 glass-panel-inner rounded-full flex items-center gap-3 border border-white/5 shadow-inner">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    !isConnected
                      ? "bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                      : isRecording
                      ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                      : loading
                      ? "bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                      : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                  }`}
                />
                <p className="text-xs text-gray-400 font-medium tracking-wide">
                  {!isConnected
                    ? "Waiting for Backend Connection..."
                    : isRecording
                    ? "Capturing voice performance..."
                    : loading
                    ? "Orchestration Pipeline & Analytics Active..."
                    : "Neural Animator Ready. Awaiting Voice Input."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
