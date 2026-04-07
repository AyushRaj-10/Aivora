import os
import torch
import subprocess
from flask import Flask, request, send_file, jsonify

# Monkey patch torch.load to always use weights_only=False
_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = _patched_load

from TTS.api import TTS

app = Flask(__name__)

# Initialize TTS model globally
print("Initializing XTTS v2 model globally...")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

try:
    tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    print("XTTS v2 Model loaded successfully!")
except Exception as e:
    print(f"FAILED to load TTS Model: {e}")
    tts_model = None

@app.route("/clone", methods=["POST"])
def clone_voice():
    if tts_model is None:
        return jsonify({"error": "TTS model failed to load on server startup"}), 500

    data = request.json
    if not data or 'text' not in data or 'speaker_path' not in data:
        return jsonify({"error": "Missing 'text' or 'speaker_path' in JSON body"}), 400

    text = data['text']
    speaker_path = data['speaker_path']

    if not os.path.exists(speaker_path):
        return jsonify({"error": f"Speaker target file not found: {speaker_path}"}), 404

    # Force convert to .wav using ffmpeg to guarantee compatibility with XTTS
    wav_target = speaker_path + ".wav"
    try:
        subprocess.run(["ffmpeg", "-y", "-i", speaker_path, "-ac", "1", "-ar", "22050", wav_target], 
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except Exception as e:
        return jsonify({"error": f"FFMPEG conversion failed: {str(e)}"}), 500

    output_path = os.path.join(os.path.dirname(speaker_path), "tts_output.wav")

    print(f"Synthesizing: {text[:50]}...")
    try:
        tts_model.tts_to_file(
            text=text, 
            speaker_wav=wav_target, 
            language="en", 
            file_path=output_path
        )
        
        # Convert to cartesia drop-in equivalent format (raw pcm_s16le 44100Hz)
        raw_output_path = output_path.replace(".wav", ".raw")
        subprocess.run(
            ["ffmpeg", "-y", "-i", output_path, "-f", "s16le", "-ac", "1", "-ar", "44100", raw_output_path],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True
        )
        
        return send_file(raw_output_path, mimetype="application/octet-stream")
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Flask XTTS Server on port 5000...")
    app.run(host="127.0.0.1", port=5000, threaded=False)
