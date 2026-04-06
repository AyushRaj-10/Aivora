import random
def map_emotion_to_face(norm):
    tension = norm['tension']
    control = norm['control']
    instability = norm['instability']
    valence = norm['valence']
    face = {}
    # core expression
    face["jawOpen"] = tension * 0.7
    face["browFurrow"] = tension
    #negative
    if valence < 0:
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