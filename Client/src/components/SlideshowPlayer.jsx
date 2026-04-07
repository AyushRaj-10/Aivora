import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, RotateCcw, ChevronRight } from "lucide-react";

export default function SlideshowPlayer({ script, isPlaying, setIsPlaying, loading, cinemaMode = false, audioParts = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const fallbackTimerRef = useRef(null);

  // ── Reset index when playback starts ───────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      setCurrentIndex(0);
    }
  }, [isPlaying]);

  // ── Advance to next frame ──────────────────────────────────────────
  const advanceFrame = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (!script || next >= script.length) {
        setIsPlaying(false);
        return prev;
      }
      return next;
    });
  }, [script, setIsPlaying]);

  // ── Jump to specific scene ─────────────────────────────────────────
  const jumpToScene = (idx) => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setCurrentIndex(idx);
    if (!isPlaying) setIsPlaying(true);
  };

  // ── Scene timing ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !script || script.length === 0) return;

    const currentScene = script[currentIndex];
    if (!currentScene) return;

    const hasVideo = !!currentScene.video_url;

    if (hasVideo) {
      // Safety timeout: scene.duration + 3s buffer
      const safetyMs = ((currentScene.duration || 3.0) + 3) * 1000;
      fallbackTimerRef.current = setTimeout(() => {
        console.warn("Safety timeout — advancing scene", currentIndex);
        advanceFrame();
      }, safetyMs);
    } else {
      const durationMs = (currentScene.duration || 3.0) * 1000;
      fallbackTimerRef.current = setTimeout(advanceFrame, durationMs);
    }

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [currentIndex, isPlaying, script, advanceFrame]);

  // ── Video ended → advance ──────────────────────────────────────────
  const handleVideoEnded = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    advanceFrame();
  };

  // ── Autoplay handling ──────────────────────────────────────────────
  const handleVideoLoaded = (e) => {
    const video = e.target;
    video.play().catch(() => {
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {});
    });
  };

  if (loading) return null;

  const currentScene = script && script.length > currentIndex ? script[currentIndex] : null;

  return (
    <div className="w-full h-full relative bg-gray-950 rounded-2xl overflow-hidden flex border border-white/5 shadow-2xl">
      {!script || script.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-gray-500 opacity-50">
          <p className="text-xs tracking-widest uppercase font-bold">Waiting for Animation Data</p>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              LEFT: Video / Image Area (flex-1)
              ══════════════════════════════════════════════════════════ */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            {/* Video / Image */}
            <AnimatePresence mode="wait">
              {currentScene && (
                <motion.div
                  key={currentIndex}
                  className="absolute inset-0 w-full h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  transition={{ opacity: { duration: 0.4 } }}
                >
                  {currentScene.video_url ? (
                    <video
                      ref={videoRef}
                      key={`vid-${currentIndex}-${currentScene.video_url}`}
                      src={currentScene.video_url}
                      autoPlay
                      playsInline
                      muted={isMuted}
                      onEnded={handleVideoEnded}
                      onLoadedData={handleVideoLoaded}
                      className="w-full h-full object-cover animate-slow-zoom"
                      style={{ willChange: "transform, opacity" }}
                    />
                  ) : (
                    <img
                      src={currentScene.fallback_image}
                      className="w-full h-full object-cover animate-slow-zoom"
                      alt={currentScene.character}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none z-10" />

            {/* Controls (Top) */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
              <div className="bg-black/60 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-purple-300 border border-purple-500/20 backdrop-blur-md flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                Scene {currentIndex + 1} / {script.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    jumpToScene(0);
                  }}
                  className="p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-all border border-white/10 backdrop-blur-md"
                  title="Replay from start"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white/70" />
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-all border border-white/10 backdrop-blur-md"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white/70" /> : <Volume2 className="w-3.5 h-3.5 text-white/70" />}
                </button>
              </div>
            </div>

            {/* Scene progress dots */}
            <div className="absolute top-12 left-0 right-0 z-30 flex justify-center gap-1.5">
              {script.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jumpToScene(i)}
                  className={`h-1 rounded-full transition-all duration-500 cursor-pointer hover:opacity-100 ${
                    i === currentIndex
                      ? "w-8 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                      : i < currentIndex
                      ? "w-3 bg-purple-500/50"
                      : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>

            {/* Subtitle overlay (bottom) */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-8 pt-32 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col justify-end">
              <AnimatePresence mode="wait">
                {currentScene && (
                  <motion.div
                    key={"sub-" + currentIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center gap-2"
                  >
                    <span className="text-purple-400 font-bold tracking-widest uppercase text-[10px] bg-black/60 px-3 py-1 rounded-md border border-purple-500/20 backdrop-blur-md">
                      {currentScene.character}
                    </span>
                    <p
                      className="text-white text-lg lg:text-xl font-medium tracking-wide leading-relaxed max-w-2xl px-4"
                      style={{ textShadow: "0 2px 10px rgba(0,0,0,1)" }}
                    >
                      "{currentScene.line}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT: Dialogue Panel (script sidebar)
              ══════════════════════════════════════════════════════════ */}
          {cinemaMode && (
            <div className="w-[280px] flex-shrink-0 bg-black/80 backdrop-blur-xl border-l border-white/5 flex flex-col overflow-hidden">
              {/* Panel header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Script</span>
              </div>

              {/* Scene list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {script.map((scene, idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToScene(idx)}
                    className={`w-full text-left p-4 border-b border-white/5 transition-all duration-300 hover:bg-white/5 group ${
                      idx === currentIndex
                        ? "bg-purple-500/10 border-l-2 border-l-purple-500"
                        : idx < currentIndex
                        ? "opacity-40 border-l-2 border-l-transparent"
                        : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{scene.character}</span>
                      <span className="text-[8px] text-gray-500 font-bold">{scene.duration || 3}s</span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed transition-all ${
                        idx === currentIndex ? "text-white font-medium" : "text-gray-500 group-hover:text-gray-300"
                      }`}
                    >
                      "{scene.line?.length > 80 ? scene.line.slice(0, 80) + "..." : scene.line}"
                    </p>
                    {idx === currentIndex && (
                      <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-purple-500/60 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: scene.duration || 3, ease: "linear" }}
                        />
                      </div>
                    )}
                    {scene.emotion_tag && (
                      <span className="inline-block mt-2 text-[7px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">
                        {scene.emotion_tag}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Replay controls */}
              <div className="p-3 border-t border-white/5 flex items-center justify-center gap-3">
                <button
                  onClick={() => jumpToScene(0)}
                  className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-4 py-2 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-3 h-3" /> Replay All
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ken Burns CSS animation */}
      <style>{`
        .animate-slow-zoom {
          animation: slowZoom 12s ease-in-out infinite alternate;
        }
        @keyframes slowZoom {
          0% { transform: scale(1.0) translateX(0px); }
          100% { transform: scale(1.08) translateX(-8px); }
        }
      `}</style>
    </div>
  );
}
