import subprocess
import logging

logging.basicConfig(level=logging.INFO)

def create_static_video(image_path: str, duration: float, output_path: str) -> bool:
    try:
        cmd = [
            "ffmpeg", "-y", "-loop", "1", "-i", image_path,
            "-c:v", "libx264", "-t", str(duration),
            "-pix_fmt", "yuv420p", output_path
        ]
        logging.info(f"Running FFmpeg video creation: {' '.join(cmd)}")
        # Removing DEVNULL to allow logs to be viewed in terminal for debugging
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        logging.error(f"FFmpeg error (static video): {e}")
        return False

def create_silent_audio(duration: float, output_path: str) -> bool:
    try:
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono",
            "-t", str(duration), output_path
        ]
        logging.info(f"Running FFmpeg silent audio creation: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        logging.error(f"FFmpeg error (silent audio): {e}")
        return False

def create_speech_audio(text: str, duration: float, output_path: str, voice: str = "en-US-JennyNeural") -> bool:
    try:
        temp_wav = output_path.replace(".wav", "_temp.wav")
        cmd_tts = [
            "python", "-m", "edge_tts", "--voice", voice, "--text", f"{text}", "--write-media", temp_wav
        ]
        logging.info(f"Running edge-tts: {' '.join(cmd_tts)}")
        subprocess.run(cmd_tts, check=True)
        
        # Pad or trim to exact duration to match video constraints exactly
        cmd_pad = [
            "ffmpeg", "-y", "-i", temp_wav,
            "-af", f"apad,atrim=0:{duration}", output_path
        ]
        subprocess.run(cmd_pad, check=True)
        return True
    except subprocess.CalledProcessError as e:
        logging.error(f"TTS or Audio padding error: {e}")
        return False
