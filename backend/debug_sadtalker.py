import subprocess
import os

FFMPEG_DIR = r"C:\Users\amrit\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin"
os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")

print("Starting debug script...")
image_path = "../public/faces/bheem.png"
# Create a dummy silent wav using ffmpeg just for this test
subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", "3", "test_audio.wav"])

cmd = [
    "python", "inference.py",
    "--driven_audio", "../test_audio.wav",
    "--source_image", image_path,
    "--result_dir", "../debug_out",
    "--still", "--preprocess", "full"
]

print("Running command:", " ".join(cmd))
try:
    result = subprocess.run(cmd, cwd="SadTalker", capture_output=True, text=True)
    if "Error" in result.stderr or result.returncode != 0:
        print("====== SADTALKER CRASHED ======")
        print("STDERR:")
        print(result.stderr)
    else:
        print("====== SADTALKER SUCCEEDED ======")
        print("STDOUT:")
        print(result.stdout[-1000:])
except Exception as e:
    print("PYTHON ERROR:", e)
