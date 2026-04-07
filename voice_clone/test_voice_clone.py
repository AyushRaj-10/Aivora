import os
import torch
import torchaudio
try:
    torchaudio.set_audio_backend("soundfile")
except:
    pass

# Monkey patch torch.load to always use weights_only=False
_original_load = torch.load
def _patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = _patched_load

from TTS.api import TTS

def main():
    speaker_audio = "sample.wav"
    
    if not os.path.exists(speaker_audio):
        print(f"Error: Could not find '{speaker_audio}' in the current directory.")
        print("Please ensure it exists before running the script.")
        return

    # Check device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    # Force cpu as per user request
    device = "cpu"
    print(f"Loading TTS model on {device}...")

    # Load XTTS v2 model
    try:
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    # Test texts list
    texts = [
        "I am fine with that.",
        "Why would you do that?",
        "I didn't mean to hurt you.",
        "This ends now."
    ]

    print(f"\nStarting voice cloning process for {len(texts)} texts...")

    for i, text in enumerate(texts):
        output_file = f"output_{i+1}.wav"
        print(f"\n[{i+1}/{len(texts)}] Generating: '{text}'")
        print(f"Outputting to {output_file}...")
        try:
            tts.tts_to_file(
                text=text, 
                speaker_wav=speaker_audio, 
                language="en", 
                file_path=output_file
            )
            print(f"Successfully created {output_file}")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error generating {output_file}: {e}")

    print("\nAll done! Check your generated wav files.")

if __name__ == "__main__":
    main()
