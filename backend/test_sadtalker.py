import subprocess
cmd = [
    "python", "inference.py",
    "--driven_audio", "../audio.wav",
    "--source_image", "../face_real.jpg",
    "--result_dir", "../test_out",
    "--still", "--preprocess", "full"
]
print("Running SadTalker locally...")
try:
    result = subprocess.run(cmd, cwd="SadTalker", capture_output=True, text=True)
    print("--- STDOUT ---")
    print(result.stdout[-2000:])
    print("--- STDERR ---")
    print(result.stderr)
except Exception as e:
    print("FAILED:", e)
