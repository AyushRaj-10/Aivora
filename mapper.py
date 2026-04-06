import random
def map_to_face(norm):
    tension = norm['tension']
    control = norm['control']
    instability = norm['instability']
    valence = norm['valence']
    face = {}
    # core expression (make eyebrows lower intensity)
    face["browDownLeft"] = tension * 0.4
    face["browDownRight"] = tension * 0.4
    #negative
    if valence < 0:
        face["browInnerUp"] = (tension * 0.4) + (abs(valence) * 0.3)  # Forehead wrinkles (very important for sad/confused)
        face["mouthFrownLeft"] = abs(valence)
        face["mouthFrownRight"] = abs(valence)

    # instability-- eyes
        face['eyeWideLeft'] = instability
        face['eyeWideRight'] = instability  

    # control -- lip tension
        face["mouthPressLeft"] = control
        face["mouthPressRight"] = control

    # add slight asymmetry to make it more natural
    for k in face.keys():
        face[k] += random.uniform(-0.05, 0.05)  # add small random value for asymmetry

    return face     