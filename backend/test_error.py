import urllib.request
import subprocess
import os

print("Downloading realistic test face...")
req = urllib.request.Request(
    "https://upload.wikimedia.org/wikipedia/commons/4/48/Outdoors-man-portrait_%28cropped%29.jpg",
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req) as response, open("face_real.jpg", 'wb') as out_file:
    out_file.write(response.read())

print("Generating Test Audio...")
subprocess.run(["python", "-m", "edge_tts", "--text", "Testing actual face sync.", "--write-media", "audio.wav"])

print("Testing direct inference execution...")
cmd = [
    "python", "inference.py",
    "--checkpoint_path", "checkpoints/wav2lip.pth",
    "--face", "../face_real.jpg",
    "--audio", "../audio.wav",
    "--outfile", "../out.mp4"
]

result = subprocess.run(cmd, cwd="Wav2Lip", capture_output=True, text=True)

print("--- EXIT CODE ---")
print(result.returncode)
print("--- STDOUT ---")
print(result.stdout[-1000:])
print("--- STDERR ---")
print(result.stderr)
