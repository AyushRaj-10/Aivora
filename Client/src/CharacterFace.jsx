import { motion } from "framer-motion";

function CharacterFace({ vad, loading }) {
  // Default neutral if no VAD
  const v = vad?.valence ?? 0;
  const a = vad?.arousal ?? 0;
  const d = vad?.dominance ?? 0;

  // Derive blendshape weights from VAD mathematically
  const mouthSmile = Math.max(0, v * 0.8);
  const mouthFrown = Math.max(0, -v * 0.8);
  const browFurrow = Math.max(0, -v * a * 0.7);
  const browRaise = Math.max(0, a * 0.4);
  const eyeWide = Math.max(0, a * 0.6);
  const jawTension = Math.max(0, -d * a * 0.5);
  const forcedSmile = a > 0.5 && v < 0 ? a * 0.5 : 0;

  // Face color shifts with emotion (more muted/premium for Vercel dark mode)
  const faceHue = v > 0 ? "245, 230, 215" : "215, 205, 205";
  const dropShadow = v > 0 
    ? "drop-shadow(0 0 15px rgba(255,255,255,0.1))" 
    : "drop-shadow(0 0 10px rgba(0,0,0,0.5))";

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [0, -5, 0] }}
      transition={{ 
        y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
        scale: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className="flex items-center justify-center w-full h-full perspective-1000"
    >
      <motion.svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        style={{ filter: dropShadow, transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
        animate={loading ? { rotate: [0, -2, 2, 0] } : {}}
        transition={{ repeat: loading ? Infinity : 0, duration: 3, ease: "easeInOut" }}
      >
        {/* Face circle */}
        <circle
          cx="80"
          cy="80"
          r="70"
          fill={`rgb(${faceHue})`}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          style={{ transition: "fill 0.6s ease" }}
        />
        
        {/* Inner shadow for 3D sphere feel */}
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="6"
        />

        {/* Left Eye */}
        <ellipse
          cx="55"
          cy="65"
          rx="10"
          ry={loading ? 3 : 8 + eyeWide * 6}
          fill="#1c1c1c"
          style={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        {/* Eye highlight */}
        {!loading && <circle cx="58" cy="62" r="3" fill="rgba(255,255,255,0.8)" />}

        {/* Right Eye */}
        <ellipse
          cx="105"
          cy="65"
          rx="10"
          ry={loading ? 3 : 8 + eyeWide * 6}
          fill="#1c1c1c"
          style={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        {/* Eye highlight */}
        {!loading && <circle cx="108" cy="62" r="3" fill="rgba(255,255,255,0.8)" />}

        {/* Left Brow */}
        <line
          x1="40"
          y1={50 - browRaise * 10}
          x2="68"
          y2={48 - browRaise * 8 + browFurrow * 12}
          stroke="#1c1c1c"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transition: "all 0.4s ease" }}
        />

        {/* Right Brow */}
        <line
          x1="92"
          y1={48 - browRaise * 8 + browFurrow * 12}
          x2="120"
          y2={50 - browRaise * 10}
          stroke="#1c1c1c"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ transition: "all 0.4s ease" }}
        />

        {/* Mouth */}
        {mouthSmile > 0.1 || forcedSmile > 0.1 ? (
          <path
            d={`M 50 105 
                Q 80 ${105 + (mouthSmile + forcedSmile) * 30} 
                110 105`}
            fill="none"
            stroke="#1c1c1c"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        ) : mouthFrown > 0.1 ? (
          <path
            d={`M 50 115 
                Q 80 ${115 - mouthFrown * 30} 
                110 115`}
            fill="none"
            stroke="#1c1c1c"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        ) : (
          <line
            x1="55"
            y1={110 + (loading ? 5 : 0)}
            x2="105"
            y2={110 + (loading ? 5 : 0)}
            stroke="#1c1c1c"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ transition: "all 0.5s ease" }}
          />
        )}

        {/* Jaw tension indicator */}
        {jawTension > 0.3 && (
          <ellipse
            cx="80"
            cy="138"
            rx={15 + jawTension * 10}
            ry={4 + jawTension * 3}
            fill="rgba(150, 80, 80, 0.2)"
            style={{ transition: "all 0.6s ease" }}
          />
        )}

        {/* Sweat drop for fear/anxiety */}
        {a > 0.7 && v < 0 && d < 0 && (
          <ellipse
            cx="125"
            cy="60"
            rx="5"
            ry="8"
            fill="rgba(100,180,255,0.6)"
            style={{ filter: "blur(1px)" }}
          />
        )}
      </motion.svg>
    </motion.div>
  );
}

export default CharacterFace;