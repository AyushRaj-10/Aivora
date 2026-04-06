import math

def generate_segment_keyframes(mapped_face, start_time, duration, text, emotion, intensity=0.5):
    keyframes = []
    visemes = []
    body_motions = []
    
    steps = 4
    for i in range(steps):
        t = start_time + (i / (steps - 1)) * duration
        arc_multiplier = math.sin(math.pi * (i / (steps - 1)))
        
        frames = {}
        for k, v in mapped_face.items():
            frames[k] = min(1.0, max(0.0, v * (1 + (i * 0.1))))
            
        # Common arc pop-up
        if intensity > 0.5:
            lift = (intensity - 0.5) * 0.8 * arc_multiplier
            frames["browOuterUpLeft"] = min(1.0, frames.get("browOuterUpLeft", 0) + lift)
            frames["browOuterUpRight"] = min(1.0, frames.get("browOuterUpRight", 0) + lift)
            frames["browInnerUp"] = min(1.0, frames.get("browInnerUp", 0) + lift)
            
        # Targeted Custom Expressions
        if emotion == "sad":
            frames["mouthFrownLeft"] = 0.8  # upside down U
            frames["mouthFrownRight"] = 0.8
            frames["eyeSquintLeft"] = 0.5   # dull look
            frames["eyeSquintRight"] = 0.5
        elif emotion == "shocked" and intensity > 0.5:
            frames["jawOpen"] = min(1.0, frames.get("jawOpen", 0) + arc_multiplier * 0.6) # Jaw drops
            frames["browInnerUp"] = min(1.0, frames.get("browInnerUp", 0) + arc_multiplier * 0.8)
        elif emotion == "angry" and intensity > 0.5:
            frames["eyeWideLeft"] = min(1.0, frames.get("eyeWideLeft", 0) + arc_multiplier * 0.9) # Eyes bug out
            frames["eyeWideRight"] = min(1.0, frames.get("eyeWideRight", 0) + arc_multiplier * 0.9)
            
        keyframes.append({
            "time": round(t, 2),
            "blendshapes": frames
        })  
        
        # Bodily Motion dynamically per frame
        head_x = 0; head_y = 0; head_z = 0
        arm_x = 0; arm_y = 0; arm_z = 0
        farm_x = 0; farm_y = 0; farm_z = 0
        hand_y = 0; curl_z = 0
        
        if emotion == "sad":
            head_x = 0.3
        elif emotion == "confused":
            head_z = 0.2
            head_x = 0.1
        elif emotion == "angry" and intensity > 0.5:
            # Extreme sustained point directly forward
            # Instead of a fast, flickering arc, hold the point aggressively for the whole block
            
            # In RPM/Mixamo: X brings the arm forward from A-pose.
            arm_x = -1.4   # Swing arm straight forward and up aggressively
            arm_z = -0.2   # Slight inward angle
            farm_x = -0.1  # Keep forearm rigid/straight
            
            # Twist wrist to point
            hand_y = -0.6
            
            # Curl fingers heavily inward, keep index pointing
            curl_z = 2.0

        body_motions.append({
            "time": round(t, 2),
            "bones": {
                "Head": {"pitch": head_x, "yaw": head_y, "roll": head_z},
                "Neck": {"pitch": head_x * 0.5, "yaw": head_y * 0.5, "roll": head_z * 0.5},
                "RightArm": {"pitch": arm_x, "yaw": arm_y, "roll": arm_z},
                "RightForeArm": {"pitch": farm_x, "yaw": farm_y, "roll": farm_z},
                "RightHand": {"pitch": 0, "yaw": hand_y, "roll": 0},
                "RightIndex": {"pitch": 0, "yaw": 0, "roll": 0},
                "RightMiddle": {"pitch": 0, "yaw": 0, "roll": curl_z},
                "RightRing": {"pitch": 0, "yaw": 0, "roll": curl_z},
                "RightPinky": {"pitch": 0, "yaw": 0, "roll": curl_z},
                "RightThumb": {"pitch": 0, "yaw": 0, "roll": curl_z * 0.5}
            }
        })
        
    # Text-to-Viseme mock timing (approximate syllables)
    words = text.split()
    word_duration = duration / max(len(words), 1)
    
    for w_idx, word in enumerate(words):
        w_start = start_time + (w_idx * word_duration)
        w_mid = w_start + (word_duration * 0.5)
        w_end = w_start + word_duration
        
        w_lower = word.lower()
        
        # Mock ARKit Visemes (Combination of standardized ARKit shapes for vowels)
        v_shapes = {"jawOpen": 0.25, "mouthStretchLeft": 0.15, "mouthStretchRight": 0.15} # default 'A'
        if "o" in w_lower or "u" in w_lower:
            v_shapes = {"jawOpen": 0.3, "mouthFunnel": 0.4} # 'O' / 'U'
        elif "e" in w_lower or "i" in w_lower:
            v_shapes = {"jawOpen": 0.1, "mouthStretchLeft": 0.3, "mouthStretchRight": 0.3} # 'E' / 'I'
            
        visemes.append({"time": round(w_start, 2), "shapes": {}})
        visemes.append({"time": round(w_mid, 2), "shapes": v_shapes})
        visemes.append({"time": round(w_end - 0.05, 2), "shapes": {}})
    
    return keyframes, visemes, body_motions
