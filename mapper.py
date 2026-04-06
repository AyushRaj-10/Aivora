face["jawOpen"] = tension *0.7
#Negative emotion
if valence < 0:
    face["mouthFrownLeft"] = abs(valence)
    face["mouthFrownRight"] = abs(valence)

    #instability-- eyes
    face['eyeWideLeft'] = instability
    face['eyeWideRight'] = instability

    #control -- lip tension
    face["mouthPressLeft"] = control
    face["mouthPressRight"] = control  
    
    #add slight asymmetry to make it more natural

    for k in face.keys():
        face[k] += random.uniform(-0.05, 0.05)  # add small random value for asymmetry
    return face