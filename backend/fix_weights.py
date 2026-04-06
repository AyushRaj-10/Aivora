import os
import urllib.request
import shutil

urls = {
    "Wav2Lip/checkpoints/wav2lip.pth": "https://huggingface.co/camenduru/Wav2Lip/resolve/main/checkpoints/wav2lip.pth",
    "Wav2Lip/checkpoints/wav2lip_gan.pth": "https://huggingface.co/camenduru/Wav2Lip/resolve/main/checkpoints/wav2lip_gan.pth",
    "Wav2Lip/face_detection/detection/sfd/s3fd.pth": "https://huggingface.co/camenduru/Wav2Lip/resolve/main/face_detection/detection/sfd/s3fd.pth"
}

def download_robust(url, dest):
    print(f"Bypassing corrupted weights. Re-downloading {dest} from HuggingFace...")
    temp_dest = dest + ".tmp"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response, open(temp_dest, 'wb') as out:
            shutil.copyfileobj(response, out)
        
        with open(temp_dest, 'rb') as f:
            header = f.read(100)
            if b"<!DOCTYPE" in header or b"<html" in header.lower():
                print(f"FATAL: HuggingFace returned HTML for {dest}!")
                os.remove(temp_dest)
                return False
                
        if os.path.exists(dest):
            os.remove(dest)
        os.rename(temp_dest, dest)
        print(f"Successfully verified binary: {dest}")
        return True
    except Exception as e:
        print(f"Error fetching {dest}: {e}")
        return False

for dest, url in urls.items():
    if os.path.exists(dest):
        # check if it's already a good binary
        try:
            with open(dest, 'rb') as f:
                header = f.read(100)
                if b"<!DOCTYPE" not in header and b"<html" not in header.lower():
                    print(f"{dest} looks like a valid binary file. Skipping.")
                    continue
        except Exception:
            pass
    download_robust(url, dest)
