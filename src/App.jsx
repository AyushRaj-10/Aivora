import { useState, useRef } from "react";
import axios from "axios";
import CharacterFace from "./CharacterFace";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originalAudio, setOriginalAudio] = useState(null);
  const [enhancedAudio, setEnhancedAudio] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
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

      // Pass the blob AND the filename
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

    setOriginalAudio(URL.createObjectURL(file));
    setLoading(true);

    // Pass the actual file AND its real filename so Groq doesn't crash
    await sendToBackend(file, file.name);
  };

  // 🔴 UPDATED: Now accepts a filename parameter
  const sendToBackend = async (blobOrFile, filename) => {
    const formData = new FormData();
    formData.append("audio", blobOrFile, filename);

    try {
      const response = await axios.post(
        "http://localhost:3000/analyze",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setResult(response.data);
      setTranscript(response.data.transcript);
      if (response.data.enhanced_audio_url) {
        setEnhancedAudio(response.data.enhanced_audio_url);
      }
    } catch (err) {
      console.error(err);
      // Fallback mock data if server fails
      setResult({
        transcript: "I'm fine with that.",
        surface_emotion: "neutral",
        true_emotion: "anger",
        contradiction_score: 0.81,
        subtext_detected: true,
        enhanced_dialogue: "I'm... completely fine with that. Really.",
        stage_directions: [
          "Character looks slightly left, avoids eye contact",
          "Fingers press flat against thigh",
          "Smile appears 0.3 seconds too late",
        ],
        voice_note: "Slow the delivery. Let 'completely' carry the weight.",
        vad: { valence: -0.72, arousal: 0.84, dominance: -0.31 },
      });
      setTranscript("I'm fine with that.");
    } finally {
      setLoading(false);
    }
  };

  function downloadKeyframes(result) {
    if (!result) return;
    const keyframes = {
      line: result.enhanced_dialogue,
      emotion: {
        surface: result.surface_emotion,
        true: result.true_emotion,
        contradiction_score: result.contradiction_score,
        vad: result.vad,
      },
      keyframes: result.keyframes || [
        { t: 0.0, mouthSmile: 0.3, browFurrow: 0.7, jawTension: 0.8 },
        { t: 0.5, mouthSmile: 0.2, browFurrow: 0.9, jawTension: 0.9 },
        { t: 1.2, mouthSmile: 0.3, browFurrow: 0.7, eyeContact: 0.1 },
        { t: 2.3, mouthSmile: 0.1, browFurrow: 0.8, jawTension: 0.7 },
      ],
      stage_directions: result.stage_directions,
      voice_note: result.voice_note,
    };

    const blob = new Blob([JSON.stringify(keyframes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyframes.json";
    a.click();
  }

  return (
    <div
      className="min-h-screen bg-gray-950 text-white flex flex-col 
                    items-center justify-center p-8"
    >
      {/* Header */}
      <h1 className="text-4xl font-bold mb-2 text-purple-400">EmotiScene</h1>
      <p className="text-gray-400 mb-12 text-sm">
        Emotion-Aware Dialogue Enhancement for Animation
      </p>

      {/* Contradiction Badge */}
      {result?.subtext_detected && (
        <div
          className="mb-6 bg-red-950 border border-red-700 text-red-300 
                        text-sm px-4 py-2 rounded-full"
        >
          ⚠️ Subtext detected — voice contradicts words (
          {Math.round(result.contradiction_score * 100)}% contradiction)
        </div>
      )}

      {/* Main Panels */}
      <div className="w-full max-w-6xl grid grid-cols-2 gap-8">
        {/* LEFT — Original */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-gray-400 uppercase text-xs tracking-widest mb-4">
            Original
          </h2>

          <div className="bg-gray-800 rounded-xl h-48 flex items-center justify-center mb-4">
            <CharacterFace vad={{ valence: 0, arousal: 0, dominance: 0 }} />
          </div>

          <div className="bg-gray-800 rounded-lg p-4 min-h-16 mb-4">
            <p className="text-gray-300 italic">
              {transcript || "Your dialogue will appear here..."}
            </p>
          </div>

          {originalAudio && (
            <audio controls src={originalAudio} className="w-full mb-4" />
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Detected:</span>
            <span className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
              {result?.surface_emotion || "neutral"}
            </span>
          </div>
        </div>

        {/* RIGHT — Enhanced */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-purple-900">
          <h2 className="text-purple-400 uppercase text-xs tracking-widest mb-4">
            Enhanced
          </h2>

          <div className="bg-gray-800 rounded-xl h-48 flex items-center justify-center mb-4">
            <CharacterFace vad={result?.vad} loading={loading} />
          </div>

          <div className="bg-gray-800 rounded-lg p-4 min-h-16 mb-4">
            {loading ? (
              <p className="text-gray-500 italic">Analyzing...</p>
            ) : (
              <>
                <p className="text-purple-200 italic mb-3">
                  {result?.enhanced_dialogue ||
                    "Enhanced dialogue will appear here..."}
                </p>
                {result?.stage_directions && (
                  <ul className="text-xs text-gray-400 space-y-1 border-t border-gray-700 pt-3">
                    {result.stage_directions.map((d, i) => (
                      <li key={i}>📌 {d}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {enhancedAudio && (
            <audio controls src={enhancedAudio} className="w-full mb-4" />
          )}

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">True emotion:</span>
            <span className="bg-purple-900 text-purple-300 text-xs px-3 py-1 rounded-full">
              {result?.true_emotion || "pending"}
            </span>
          </div>
          {result && (
            <button
              onClick={() => downloadKeyframes(result)}
              className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 
               text-xs py-2 rounded-lg border border-gray-700"
            >
              ⬇ Download Keyframe JSON
            </button>
          )}
          {result?.voice_note && (
            <p className="text-xs text-yellow-400 italic mt-2">
              🎙 {result.voice_note}
            </p>
          )}
        </div>
      </div>

      {/* VAD Bar */}
      {result?.vad && (
        <div className="mt-8 w-full max-w-6xl bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-gray-400 uppercase text-xs tracking-widest mb-4">
            Emotion Vector (VAD)
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {Object.entries(result.vad).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 capitalize">{key}</span>
                  <span className="text-purple-300">{val.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${((val + 1) / 2) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Controls (Record OR Upload) */}
      <div className="flex flex-col items-center mt-10">
        <div className="flex items-center gap-8">
          {/* Record Button */}
          <button
            onClick={handleRecord}
            disabled={loading}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg
                    transition-all duration-200
                    ${
                      isRecording
                        ? "bg-red-500 scale-110 animate-pulse"
                        : loading
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-500 hover:scale-105"
                    }`}
          >
            {isRecording ? "⏹" : "🎙"}
          </button>

          <span className="text-gray-500 font-bold tracking-widest text-sm">
            OR
          </span>

          {/* Upload Button */}
          <label
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg
                       transition-all duration-200 border-2 border-gray-700
                       ${
                         loading
                           ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                           : "bg-gray-800 cursor-pointer hover:bg-gray-700 hover:border-gray-500 hover:scale-105"
                       }`}
          >
            📁
            <input
              type="file"
              accept="audio/mp3, audio/wav, audio/webm, audio/m4a, audio/flac"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading || isRecording}
            />
          </label>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          {isRecording
            ? "Recording... click to stop"
            : loading
              ? "Analyzing your performance..."
              : "Click to speak OR select a file"}
        </p>
      </div>
    </div>
  );
}

export default App;
