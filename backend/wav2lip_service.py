import subprocess
import logging
import os
import shutil

logging.basicConfig(level=logging.INFO)

def run_wav2lip(face_path: str, audio_path: str, output_path: str) -> bool:
    """
    Executes Wav2Lip inference.py script. Wait for script output.
    """
    try:
        wav2lip_dir = "Wav2Lip"
        abs_face = os.path.abspath(face_path)
        abs_audio = os.path.abspath(audio_path)
        abs_out = os.path.abspath(output_path)
        
        cmd = [
            "python", "inference.py",
            "--checkpoint_path", "checkpoints/wav2lip_gan.pth", # using default checkpoint
            "--face", abs_face,
            "--audio", abs_audio,
            "--outfile", abs_out
        ]
        
        if os.path.exists(os.path.join(wav2lip_dir, "inference.py")):
            logging.info(f"Running actual Wav2Lip: {' '.join(cmd)}")
            subprocess.run(cmd, check=True, cwd=wav2lip_dir)
            return True
        else:
            logging.warning("Wav2Lip inference.py not found in backend directory.")
            logging.warning("Mocking Wav2Lip output by returning the input static video.")
            shutil.copy(face_path, output_path)
            return True
            
    except subprocess.CalledProcessError as e:
        logging.error(f"Wav2Lip execution failed: {e}")
        return False
