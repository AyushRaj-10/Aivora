import os
import subprocess
import logging
import platform

def run_sadtalker(image_path: str, audio_path: str, output_dir: str) -> str:
    """
    Executes SadTalker inference.py script. Wait for script output.
    Returns the path to the generated mp4 video, or empty string if failed.
    """
    try:
        sadtalker_dir = "SadTalker"
        abs_img = os.path.abspath(image_path)
        abs_audio = os.path.abspath(audio_path)
        abs_out = os.path.abspath(output_dir)
        
        os.makedirs(abs_out, exist_ok=True)

        cmd = [
            "python", "inference.py",
            "--driven_audio", abs_audio,
            "--source_image", abs_img,
            "--result_dir", abs_out,
            "--still", "--preprocess", "full"
        ]
        
        if os.path.exists(os.path.join(sadtalker_dir, "inference.py")):
            logging.info(f"Running actual SadTalker: {' '.join(cmd)}")
            subprocess.run(cmd, check=True, cwd=sadtalker_dir, shell=platform.system() == 'Windows')
            
            # SadTalker structures results inside a timestamped folder inside result_dir usually, OR directly.
            # We must hunt for the output mp4 file.
            for root, dirs, files in os.walk(abs_out):
                for file in files:
                    if file.endswith(".mp4"):
                        return os.path.join(root, file)
            return ""
        else:
            logging.warning("SadTalker inference.py not found in backend directory.")
            return ""

    except subprocess.CalledProcessError as e:
        logging.error(f"SadTalker Inference failed: {e}")
        return ""
