import os
import subprocess

def setup_sadtalker():
    if not os.path.exists("SadTalker"):
        print("Cloning SadTalker repository...")
        subprocess.run(["git", "clone", "https://github.com/OpenTalker/SadTalker.git"])

    print("Checking dependencies...")
    subprocess.run(["python", "-m", "pip", "install", "safetensors", "facexlib", "yacs", "gfpgan"])

    if not os.path.exists("sadtalker_weights"):
        print("Cloning SadTalker weights via HuggingFace (camenduru mirror)...")
        # Ensure LFS is active
        subprocess.run(["git", "lfs", "install"])
        subprocess.run(["git", "clone", "https://huggingface.co/camenduru/SadTalker", "sadtalker_weights"])

        # The weights typically go inside SadTalker/checkpoints and SadTalker/gfpgan/weights
        os.makedirs("SadTalker/checkpoints", exist_ok=True)
        os.makedirs("SadTalker/gfpgan/weights", exist_ok=True)
        
        # SadTalker expects: mapping20220322.pth, SadTalker_V0.0.2_256.safetensors, etc.
        # We will use simple shutils to move the essential stuff
        import shutil
        src = "sadtalker_weights"
        dest = "SadTalker/checkpoints"
        for file in os.listdir(src):
            if file.endswith(".pth") or file.endswith(".safetensors"):
                shutil.move(os.path.join(src, file), os.path.join(dest, file))
        print("Weights configured.")

if __name__ == "__main__":
    setup_sadtalker()
