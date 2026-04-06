def clamp(value, min_val=0.0, max_val=1.0):
    return max(min(value, max_val), min_val)


def map_voice_params(emotion, intensity, valence=0, arousal=0, dominance=0):
    params = {
        "stability": 0.5,
        "similarity_boost": 0.7
    }

    # 🎭 Emotion-based base settings
    if emotion == "excited":
        params["stability"] = 0.3
        params["similarity_boost"] = 0.6

    elif emotion == "calm":
        params["stability"] = 0.7
        params["similarity_boost"] = 0.8

    elif emotion == "angry":
        params["stability"] = 0.25
        params["similarity_boost"] = 0.6

    elif emotion == "sad":
        params["stability"] = 0.65
        params["similarity_boost"] = 0.75

    elif emotion == "tense":
        params["stability"] = 0.35
        params["similarity_boost"] = 0.65

    elif emotion == "relaxed":
        params["stability"] = 0.75
        params["similarity_boost"] = 0.8

    elif emotion == "happy":
        params["stability"] = 0.4
        params["similarity_boost"] = 0.7

    elif emotion == "frustrated":
        params["stability"] = 0.3
        params["similarity_boost"] = 0.65

    else:  # neutral
        params["stability"] = 0.5
        params["similarity_boost"] = 0.7

    # 🔥 Intensity effect (more emotion = less stability)
    params["stability"] -= intensity * 0.25

    # ⚡ Arousal effect (high energy → more variation)
    params["stability"] -= arousal * 0.1

    # ❤️ Valence effect (positive → smoother voice)
    params["similarity_boost"] += valence * 0.05

    # 🧠 Dominance (confidence → more consistent tone)
    params["similarity_boost"] += dominance * 0.05

    # ✅ Clamp values
    params["stability"] = clamp(params["stability"])
    params["similarity_boost"] = clamp(params["similarity_boost"])

    return params