# 🎭 Animation Branch — VAD++ Driven Avatar Animation

## 📌 Overview

The Animation Branch dynamically maps **VAD++ (Valence, Arousal, Dominance)** signals to continuous ARKit facial movements, tracks syllable heuristics to phonetic Visemes for Lip Sync, and calculates skeletal head/neck rotations.

Rather than relying on pre-baked animation clips or static emotional labels, this system dynamically renders:
- Time-varying micro-expressions and eyebrow arcing.
- Heuristic Text-to-Phoneme Lip Syncing.
- Autonomous eye blinking.
- Bodily Head/Neck gestures.

## ⚙️ Architecture & Data Flow

1. **Input JSON (`performance.json`)**
   Takes in a multi-segmented emotional breakdown. The output derived from the Voice layer consists of:
   - Overall emotional baseline values.
   - Distinct sub-segments featuring dialogue text, specific emotion flags, intensity scores, and momentary VAD configurations.

2. **Backend Processing (`main.py` -> `keyframes.py` -> `mapper.py`)**
   The script parses the segments and compiles three parallel tracks into an `animation_brief.json` output:
   - **VAD Keyframes**: Converts abstract signals (tension, Valence) to ARKit facial blendshapes (e.g. `browInnerUp`, `mouthFrownLeft`). Evaluates `intensity` thresholds to create graceful sine-wave arcs for emphasized expressions (like eyebrows going up on strong statements).
   - **Viseme Keyframes**: Parses the text duration, identifies word segments, and plots `jawOpen`, `mouthFunnel`, and `mouthStretch` sequences synced to vowel syllables.
   - **Bodily Motions**: Translates localized segment emotions (e.g., "sad", "confused") into skeletal joint rotations for `mixamorigHead` and `mixamorigNeck`.

3. **Frontend Rendering (`player.js`)**
   The Three.js web app ingests `animation_brief.json` and loads the `.glb` Ready Player Me model. It manages four concurrent systems:
   - Renders the continuous VAD facial track.
   - Steps through the rapid phoneme Viseme track.
   - Pivots the skeletal joints flawlessly.
   - Runs an independent continuous background heartbeat looping variable eye blinks (`eyeBlinkLeft`/`Right`).

## ▶️ Setup & Execution

### Step 1: Generate Keyframes & Datamap
```bash
python main.py
```
*(This consumes `performance.json` and emits `animation_brief.json`)*

### Step 2: Spin Up the Local Viewer
```bash
python -m http.server 8000
```

### Step 3: View Scene
Open `http://localhost:8000` via Chrome or a modern browser. 
- You can click and drag smoothly to Orbit manually.

## 🚀 Features Fully Active

- **Segment Timeline Continuity**: Gracefully transitions between completely different dialogue and emotional cues sequentially over one long take.
- **Parametric Arc Emphasis**: Analyzes sequence intensity dynamically to apply sinusoidal emphasis arcs to facial features mid-sentence.
- **Targeted Emotion Overrides**: Maps highly specific gestures procedurally based on tags overrides:
  - **Sad**: Employs `eyeSquint` constraints for a dull look, and enforces a rigid `mouthFrown` downside-down U curve.
  - **Shocked**: Ties the intensity sine-wave directly to `jawOpen` for a dramatic transient jaw-drop.
  - **Angry**: Triggers widened bug-eyes, and locks the `mixamorigRightArm` forward while precisely rolling the ring/middle/pinky/thumb joints inward to execute a commanding finger-point gesture held across the sentence.
- **Autonomous Subsystems**: Maintains lifecycle eye-blinking gracefully decoupled from the data payload.