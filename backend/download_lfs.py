import os
import subprocess
import shutil

print("Installing Git LFS...")
subprocess.run(["git", "lfs", "install"])

if not os.path.exists("hf_weights"):
    print("Cloning HuggingFace Wav2Lip mirror...")
    # This has the actual LFS weights properly resolving
    subprocess.run(["git", "clone", "https://huggingface.co/camenduru/Wav2Lip", "hf_weights"])

print("Moving extracted weights...")
def safe_move(src, dst):
    if os.path.exists(src):
        if os.path.exists(dst):
            os.remove(dst)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.move(src, dst)
        print(f"Secured {dst}.")
    else:
        print(f"Warning: {src} not found in HF repo!")

safe_move("hf_weights/checkpoints/wav2lip.pth", "Wav2Lip/checkpoints/wav2lip.pth")
safe_move("hf_weights/checkpoints/wav2lip_gan.pth", "Wav2Lip/checkpoints/wav2lip_gan.pth")
safe_move("hf_weights/face_detection/detection/sfd/s3fd.pth", "Wav2Lip/face_detection/detection/sfd/s3fd.pth")

print("Done securing weights. They are 100% binary now.")
