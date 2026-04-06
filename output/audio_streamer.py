import wave
import contextlib

def get_duration(file):
    with contextlib.closing(wave.open(file,'r')) as f:
        frames = f.getnframes()
        rate = f.getframerate()
        return frames / float(rate)