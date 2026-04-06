import os
import urllib.request
import subprocess

def download_file(url, dest):
    if not os.path.exists(dest):
        print(f"Downloading {dest} from {url}...")
        try:
            # Add User-Agent to avoid forbidden
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(dest, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
            print(f"Successfully downloaded {dest}")
        except Exception as e:
            print(f"Failed to download {dest}: {e}")
            # Try via curl
            subprocess.run(["curl", "-L", "-o", dest, url])
    else:
        print(f"{dest} already exists. Skipping download.")

def setup():
    # 1. Clone Wav2Lip
    if not os.path.exists("Wav2Lip"):
        print("Cloning Wav2Lip repository...")
        subprocess.run(["git", "clone", "https://github.com/Rudrabha/Wav2Lip.git"])
    
    # 2. Download Models (using Camenduru's HuggingFace mirrors which are publicly available)
    os.makedirs("Wav2Lip/checkpoints", exist_ok=True)
    os.makedirs("Wav2Lip/face_detection/detection/sfd", exist_ok=True)

    wav2lip_url = "https://huggingface.co/camenduru/Wav2Lip/resolve/main/checkpoints/wav2lip.pth"
    wav2lip_dest = "Wav2Lip/checkpoints/wav2lip.pth"

    wav2lip_gan_url = "https://huggingface.co/camenduru/Wav2Lip/resolve/main/checkpoints/wav2lip_gan.pth"
    wav2lip_gan_dest = "Wav2Lip/checkpoints/wav2lip_gan.pth"
    
    s3fd_url = "https://huggingface.co/camenduru/Wav2Lip/resolve/main/face_detection/detection/sfd/s3fd.pth"
    s3fd_dest = "Wav2Lip/face_detection/detection/sfd/s3fd.pth"

    download_file(wav2lip_url, wav2lip_dest)
    download_file(wav2lip_gan_url, wav2lip_gan_dest)
    import shutil # ensure it is available implicitly
    download_file(s3fd_url, s3fd_dest)

    # 3. Patch librosa issue in Wav2Lip/audio.py if it exists (librosa >= 0.8 requires kwargs)
    audio_path = "Wav2Lip/audio.py"
    if os.path.exists(audio_path):
        with open(audio_path, 'r') as f:
            content = f.read()
            
        patched_content = content.replace(
            "return librosa.filters.mel(hp.sample_rate, hp.n_fft, n_mels=hp.num_mels,",
            "return librosa.filters.mel(sr=hp.sample_rate, n_fft=hp.n_fft, n_mels=hp.num_mels,"
        )
        if patched_content != content:
            with open(audio_path, 'w') as f:
                f.write(patched_content)
            print("Patched Wav2Lip/audio.py for new librosa compatibility.")

    # 4. Install dependencies (latest versions instead of hardcoded buggy ones)
    print("Installing python dependencies...")
    subprocess.run(["python", "-m", "pip", "install", "librosa", "torch", "torchvision", "opencv-python", "scipy", "tqdm", "edge-tts"])

if __name__ == "__main__":
    import shutil
    setup()
    print("Setup completed!")
