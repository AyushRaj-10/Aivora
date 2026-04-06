# 🎭 Animation Branch — VAD++ Driven Avatar Animation

## 📌 Overview

The Animation Branch dynamically maps **VAD++ (Valence, Arousal, Dominance)** signals to continuous ARKit facial movements, tracks syllable heuristics to phonetic Visemes for Lip Sync, and calculates skeletal head/neck rotations.

Rather than relying on pre-baked animation clips or static emotional labels, this system dynamically renders:
- Time-varying micro-expressions and eyebrow arcing.
- Heuristic Text-to-Phoneme Lip Syncing.
- Autonomous eye blinking.
- Bodily Head/Neck gestures.

## 🗂️ File Tree Structure
```text
📂 animation_b
 ├── 📄 performance.json        # Input: The emotional script drafted by Voice/LLM layer
 ├── 📄 main.py                 # Backend Core: Intersects the pipeline, parses JSON payload
 ├── 📄 normalize.py            # Backend Util: Clamps and parses dynamic VAD intensity ranges
 ├── 📄 mapper.py               # Backend Util: Maps VAD variables to ARKit facial blendshapes
 ├── 📄 keyframes.py            # Backend Builder: Composes time-tracked facial, skeletal, and lip sync data
 ├── 📄 animation_brief.json    # Intermediary payload housing calculated runtime tracking metrics
 ├── 📄 index.html              # Frontend DOM containing the Three.js canvas layer
 ├── 📄 player.js               # Frontend Engine: Binds RPM bones/meshes and synchronizes timing playback
 ├── 📄 avatar.glb              # Standard 3D GLTF Ready Player Me asset containing Mixamorig rig
 ├── 📄 rig_mapping.json        # Mixamorig skeleton index mapping references
 ├── 📄 .gitignore              # Ignores cached compile files
 └── 📄 readme.md               # Pipeline documentation
```

## ⚙️ Data Pipeline Workflow

1. **Script Ingestion**: `performance.json` enters the pipeline containing VAD baseline metrics and temporal phrase segments (e.g., sad, angry, shocked).
2. **Signal Normalization**: `main.py` parses these sequences and triggers `normalize.py` to assert mathematical safety bounds (clamp values between -1 and 1).
3. **Blendshape Projection**: Normal metrics are subsequently dispatched into `mapper.py`, assigning the abstracted emotion values to strictly standardized ARKit shape arrays. 
4. **Timeline Orchestration**: `keyframes.py` distributes the data structures iteratively over calculated frame cycles:
     * Dispatches procedural sinusoidal curves for emphasis logic.
     * Overrides bone rotations natively. 
     * Synthesizes heuristic word-length syllables into mapped lip-sync phoneme arrays.
5. **Runtime Rendering**: The completed `animation_brief.json` structure is streamed directly into `player.js` where the browser utilizes WebGL layers and `OrbitControls` to project continuous character animations alongside parallel independent behaviors like randomized eye-blinking.

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