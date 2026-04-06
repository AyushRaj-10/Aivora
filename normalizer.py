import math

def clamp(value, min_val=-1.0, max_val=1.0):
    return max(min(value, max_val), min_val)


def normalize_vad(vad):
    valence = clamp(vad.get("valence", 0))
    arousal = clamp(vad.get("arousal", 0))
    dominance = clamp(vad.get("dominance", 0))

    # 🎭 8-emotion mapping
    if valence > 0.6 and arousal > 0.6:
        emotion = "excited"
    elif valence > 0.6 and arousal < 0.4:
        emotion = "calm"
    elif valence < -0.6 and arousal > 0.6:
        emotion = "angry"
    elif valence < -0.6 and arousal < 0.4:
        emotion = "sad"
    elif arousal > 0.7 and -0.3 < valence < 0.3:
        emotion = "tense"
    elif arousal < 0.3 and -0.3 < valence < 0.3:
        emotion = "relaxed"
    elif valence > 0.2:
        emotion = "happy"
    elif valence < -0.2:
        emotion = "frustrated"
    else:
        emotion = "neutral"

    # 🔥 Intensity calculation
    intensity = round((abs(valence) + arousal) / 2, 2)

    # 💡 Optional dominance-based tone
    if dominance > 0.5:
        tone_style = "confident"
    elif dominance < -0.5:
        tone_style = "submissive"
    else:
        tone_style = "neutral"

    return {
        "emotion": emotion,
        "intensity": intensity,
        "valence": valence,
        "arousal": arousal,
        "dominance": dominance,
        "tone_style": tone_style
    }


def normalize_line(line_json):
    vad = line_json.get("vad", {})
    norm = normalize_vad(vad)

    return {
        "text": line_json["line"],
        "emotion": norm["emotion"],
        "intensity": norm["intensity"],
        "tone": line_json.get("director_note", ""),
        "subtext": line_json.get("subtext", ""),
        "duration": line_json.get("timestamp_end", 2.0),

        # Optional extra signals for your pipeline
        "valence": norm["valence"],
        "arousal": norm["arousal"],
        "dominance": norm["dominance"],
        "tone_style": norm["tone_style"]
    }