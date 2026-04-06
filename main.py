import json
from normalize import normalize_vad
from mapper import map_to_face
from keyframes import generate_segment_keyframes

def run():
    with open("performance.json") as f:
        data = json.load(f)

    overall_vad = data.get("vad", {})
    segments = data.get("segments", [])

    all_keyframes = []
    all_visemes = []
    all_body_motions = []

    current_time = 0.0

    for seg in segments:
        text = seg["text"]
        emotion = seg["emotion"]
        
        # Merge segment VAD with overall dominance fallback
        vad = {
            "valence": seg.get("valence", overall_vad.get("valence", 0)),
            "arousal": seg.get("arousal", overall_vad.get("arousal", 0)),
            "dominance": seg.get("dominance", overall_vad.get("dominance", 0.5))
        }
        
        # Estimate duration: 0.4 seconds per word
        duration = max(len(text.split()) * 0.4, 1.0) 
        
        intensity = seg.get("intensity", 0.5)
        
        norm = normalize_vad(vad)
        mapped = map_to_face(norm)
        
        k, v, b = generate_segment_keyframes(mapped, current_time, duration, text, emotion, intensity)
        
        all_keyframes.extend(k)
        all_visemes.extend(v)
        all_body_motions.extend(b)
        
        current_time += duration

    output = {
        "line": " ".join([s["text"] for s in segments]),
        "duration": round(current_time, 2),
        "keyframes": all_keyframes,
        "visemes": all_visemes,
        "body_motions": all_body_motions
    }

    with open("animation_brief.json", "w") as f:
        json.dump(output, f, indent=2)

    print("Generated animation_brief.json with lip sync and body movements")

if __name__ == "__main__":
    run()