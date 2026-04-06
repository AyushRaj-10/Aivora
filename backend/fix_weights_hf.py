import os
import shutil
from huggingface_hub import hf_hub_download

files = [
    "checkpoints/wav2lip.pth",
    "checkpoints/wav2lip_gan.pth",
    "face_detection/detection/sfd/s3fd.pth"
]

for f in files:
    print(f"Resolving true LFS binary for {f}...")
    local_path = f"Wav2Lip/{f}"
    if os.path.exists(local_path):
        os.remove(local_path) # Remove the false LFS pointer
    
    downloaded = hf_hub_download(repo_id="camenduru/Wav2Lip", filename=f)
    shutil.copy(downloaded, local_path)
    print(f"Successfully copied real binary to {local_path}")
