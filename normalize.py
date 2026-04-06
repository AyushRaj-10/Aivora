def normalize_vad(vad):
    valence = clamp(vad["valence"])
    arousal = clamp(vad["arousal"])
    dominance = clamp(vad["dominance"])

    tension = arousal
    control = (dominance +1) /2
    instability = abs(valence) * arousal

    return{
        "valence": valence,
        "arousal": arousal,
        "dominance": dominance,
        "tension": round(tension, 2),
        "control": round (control, 2),
        "instability": round (instability, 2)
    }