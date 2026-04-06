def generate_keyframes(mapped_face,duration):
    keyframes=[]
    steps =4
    for i in range(steps):
        t = (i / (steps - 1)) * duration

        #slight progression of expression over time
        frames = {}
        for k, v in mapped_face.items():
            frames[k] = min(1.0, max(0.0, v *  (1+(i*0.1))))
            
        keyframes.append({
            "time": round(t, 2),
            "blendshapes": frames
        })  # scale by time progression

    return keyframes
