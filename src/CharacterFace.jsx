function CharacterFace({ vad, loading }) {
  // Default neutral if no VAD
  const v = vad?.valence ?? 0
  const a = vad?.arousal ?? 0
  const d = vad?.dominance ?? 0

  // Derive blendshape weights from VAD mathematically
  const mouthSmile    = Math.max(0, v * 0.8)
  const mouthFrown    = Math.max(0, -v * 0.8)
  const browFurrow    = Math.max(0, (-v * a * 0.7))
  const browRaise     = Math.max(0, a * 0.4)
  const eyeWide       = Math.max(0, a * 0.6)
  const jawTension    = Math.max(0, -d * a * 0.5)
  const forcedSmile   = (a > 0.5 && v < 0) ? a * 0.5 : 0

  // Face color shifts with emotion
  const faceHue = v > 0 ? "255, 220, 180" : "220, 180, 180"

  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        style={{ transition: "all 0.6s ease" }}
      >
        {/* Face circle */}
        <circle
          cx="80" cy="80" r="70"
          fill={`rgb(${faceHue})`}
          stroke="#555" strokeWidth="2"
          style={{ transition: "fill 0.6s ease" }}
        />

        {/* Left Eye */}
        <ellipse
          cx="55" cy="65"
          rx="10"
          ry={loading ? 10 : 8 + eyeWide * 6}
          fill="#333"
          style={{ transition: "all 0.6s ease" }}
        />

        {/* Right Eye */}
        <ellipse
          cx="105" cy="65"
          rx="10"
          ry={loading ? 10 : 8 + eyeWide * 6}
          fill="#333"
          style={{ transition: "all 0.6s ease" }}
        />

        {/* Left Brow */}
        <line
          x1="40" y1={50 - browRaise * 10}
          x2="68" y2={48 - browRaise * 8 + browFurrow * 12}
          stroke="#333" strokeWidth="4" strokeLinecap="round"
          style={{ transition: "all 0.6s ease" }}
        />

        {/* Right Brow */}
        <line
          x1="92" y1={48 - browRaise * 8 + browFurrow * 12}
          x2="120" y2={50 - browRaise * 10}
          stroke="#333" strokeWidth="4" strokeLinecap="round"
          style={{ transition: "all 0.6s ease" }}
        />

        {/* Mouth */}
        {mouthSmile > 0.1 || forcedSmile > 0.1 ? (
          // Smile path — forced smile is shallower
          <path
            d={`M 50 105 
                Q 80 ${105 + (mouthSmile + forcedSmile) * 30} 
                110 105`}
            fill="none"
            stroke="#333" strokeWidth="4" strokeLinecap="round"
            style={{ transition: "all 0.6s ease" }}
          />
        ) : mouthFrown > 0.1 ? (
          // Frown path
          <path
            d={`M 50 115 
                Q 80 ${115 - mouthFrown * 30} 
                110 115`}
            fill="none"
            stroke="#333" strokeWidth="4" strokeLinecap="round"
            style={{ transition: "all 0.6s ease" }}
          />
        ) : (
          // Neutral line
          <line
            x1="55" y1="110"
            x2="105" y2="110"
            stroke="#333" strokeWidth="4" strokeLinecap="round"
          />
        )}

        {/* Jaw tension indicator — subtle chin clench */}
        {jawTension > 0.3 && (
          <ellipse
            cx="80" cy="138"
            rx={15 + jawTension * 10}
            ry={4 + jawTension * 3}
            fill="rgba(180,100,100,0.3)"
            style={{ transition: "all 0.6s ease" }}
          />
        )}

        {/* Sweat drop for fear/anxiety */}
        {a > 0.7 && v < 0 && d < 0 && (
          <ellipse cx="125" cy="60" rx="5" ry="8"
            fill="rgba(100,180,255,0.6)" />
        )}
      </svg>
    </div>
  )
}

export default CharacterFace