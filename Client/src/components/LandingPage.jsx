import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Mic, Film, Brain, Zap } from "lucide-react";

export default function LandingPage({ onEnter }) {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    { icon: Mic, label: "Voice Analysis", desc: "Wav2Vec acoustic pipeline extracts pitch, energy, and subtext from raw performance", color: "#a855f7" },
    { icon: Brain, label: "Emotion Fusion", desc: "Cross-modal attention detects when voice contradicts words — catching the lie in the performance", color: "#6366f1" },
    { icon: Film, label: "Cinema Mode", desc: "Real-time 3D Cinematic Avatar streaming with zero-latency Lip-Sync", color: "#8b5cf6" },
    { icon: Zap, label: "Live Pipeline", desc: "WebSocket real-time orchestration from voice input to animated output in one continuous flow", color: "#7c3aed" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };
  const up = {
    hidden: { opacity: 0, y: 32 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 55, damping: 16 } },
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.5 } }}
      className="w-full max-w-[1400px] min-h-[calc(100vh-100px)] z-10 flex flex-col lg:flex-row items-center justify-between gap-16 relative px-6 py-12"
    >

      {/* ── LEFT: Hero ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-start z-20 max-w-2xl">

        {/* Live badge */}
        <motion.div variants={up} className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/8 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-purple-400" style={{
              boxShadow: "0 0 8px #a855f7",
              animation: "aivora-pulse 2s infinite"
            }} />
            <span className="text-purple-300 font-bold tracking-[0.2em] text-xs uppercase">AI-STHETICA 2026</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-green-500/20 bg-green-500/5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-bold tracking-[0.15em] text-xs uppercase">Live</span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.div variants={up} className="mb-4">
          <h1
            className="text-7xl md:text-9xl font-black leading-[0.95] tracking-[-0.04em]"
            style={{ color: "#fff" }}
          >
            Nex
            <span style={{
              background: "linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>ora</span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p variants={up} className="text-lg md:text-xl text-gray-400 font-light mb-3 leading-relaxed max-w-lg">
          The world speaks in subtext.
          <br />
          <span className="text-white font-medium">AIvora reads between the lines.</span>
        </motion.p>

        {/* Sub-tagline */}
        <motion.p variants={up} className="text-sm text-gray-600 mb-10 max-w-md leading-relaxed">
          Voice in. Emotion detected. Script enhanced. 3D Cinematic Avatar out.
          One pipeline. Zero guesswork.
        </motion.p>

        {/* Animated feature ticker */}
        <motion.div variants={up} className="mb-10 w-full max-w-md">
          <div className="rounded-2xl border border-white/6 bg-black/30 backdrop-blur-md p-5 min-h-[90px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="flex items-start gap-4"
              >
                {React.createElement(features[activeFeature].icon, {
                  className: "w-5 h-5 mt-0.5 flex-shrink-0",
                  style: { color: features[activeFeature].color }
                })}
                <div>
                  <p className="text-white font-bold text-sm mb-1">
                    {features[activeFeature].label}
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {features[activeFeature].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-4">
              {features.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className="cursor-pointer h-0.5 rounded-full transition-all duration-500"
                  style={{
                    width: i === activeFeature ? 24 : 8,
                    background: i === activeFeature ? "#a855f7" : "rgba(255,255,255,0.1)"
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={up} className="flex items-center gap-4">
          <motion.button
            onClick={onEnter}
            whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(139,92,246,0.35)" }}
            whileTap={{ scale: 0.97 }}
            className="group relative px-8 py-4 rounded-2xl flex items-center gap-3 overflow-hidden font-bold tracking-widest uppercase text-sm text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Mic className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Initialize Director Mode</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-4 rounded-2xl border border-white/10 text-gray-400 text-sm font-medium hover:border-purple-500/30 hover:text-purple-300 transition-all"
            onClick={onEnter}
          >
            View Demo →
          </motion.button>
        </motion.div>

        {/* Bottom stat strip */}
        <motion.div variants={up} className="flex gap-8 mt-12 pt-8 border-t border-white/5 w-full">
          {[
            { val: "28", label: "Emotion Classes" },
            { val: "3D", label: "VAD Space" },
            { val: "6", label: "Pipeline Layers" },
            { val: "<2s", label: "Latency" },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-purple-400 leading-none mb-1">{val}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wider font-medium">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT: Visual Panel ────────────────────────────────── */}
      <motion.div
        variants={up}
        className="flex-1 w-full lg:w-auto relative z-20 flex items-center justify-center"
        style={{ minHeight: 560 }}
      >
        {/* Outer glow ring */}
        <div style={{
          position: "absolute",
          inset: -40,
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Main panel */}
        <div className="relative w-full max-w-[480px] aspect-square">

          {/* Grid background */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden border border-purple-500/15 bg-black/20 backdrop-blur-sm">
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 65%)"
            }} />
          </div>

          {/* HUD corners */}
          {[
            { top: 16, left: 16, borderTop: "1.5px solid rgba(168,85,247,0.5)", borderLeft: "1.5px solid rgba(168,85,247,0.5)" },
            { top: 16, right: 16, borderTop: "1.5px solid rgba(168,85,247,0.5)", borderRight: "1.5px solid rgba(168,85,247,0.5)" },
            { bottom: 16, left: 16, borderBottom: "1.5px solid rgba(168,85,247,0.5)", borderLeft: "1.5px solid rgba(168,85,247,0.5)" },
            { bottom: 16, right: 16, borderBottom: "1.5px solid rgba(168,85,247,0.5)", borderRight: "1.5px solid rgba(168,85,247,0.5)" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 20, height: 20, ...s, zIndex: 10 }} />
          ))}

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 z-10">

            {/* Waveform animation */}
            <div className="flex items-center gap-1 h-16">
              {Array.from({ length: 28 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full"
                  style={{ background: "linear-gradient(to top, #7c3aed, #a855f7)" }}
                  animate={{
                    height: [
                      8 + Math.sin(i * 0.8) * 20,
                      8 + Math.sin(i * 0.8 + 2) * 40,
                      8 + Math.sin(i * 0.8 + 4) * 20,
                    ]
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: i * 0.06,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Pipeline flow */}
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              {[
                { label: "Voice Input", status: "ready", color: "#a855f7" },
                { label: "Emotion Fusion", status: "ready", color: "#8b5cf6" },
                { label: "Script Enhancement", status: "ready", color: "#7c3aed" },
                { label: "Cinema Output", status: "ready", color: "#6366f1" },
              ].map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/5 bg-black/30 backdrop-blur-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                    background: step.color,
                    boxShadow: `0 0 6px ${step.color}`
                  }} />
                  <span className="text-xs font-medium text-gray-300 flex-1">{step.label}</span>
                  <span className="text-xs text-green-400 font-bold uppercase tracking-wider">✓</span>
                </motion.div>
              ))}
            </div>

            {/* Bottom label */}
            <div className="text-center">
              <p className="text-xs text-purple-400 font-bold uppercase tracking-[0.3em]">Neural Director</p>
              <p className="text-xs text-gray-600 mt-1">End-to-end emotion pipeline</p>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes aivora-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #a855f7; }
          50% { opacity: 0.4; box-shadow: 0 0 3px #a855f7; }
        }
      `}</style>
    </motion.div>
  );
}