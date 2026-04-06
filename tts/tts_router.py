from .openai_client import generate as openai_generate
import os

def route_tts(directed, params, filename):
    print(f"Routing to TTS -> Saving to {filename}")
    print(f"  TTS Params: {params}")
    print(f"  TTS Text: {directed}")
    
    try:
        # Route to OpenAI
        abs_path = os.path.abspath(filename)
        # Using a default OpenAI voice for now, since ElevenLabs params don't map 1:1
        openai_params = {"voice": "nova", "model": "tts-1"}
        openai_generate(directed, openai_params, abs_path)
        print(f"  Successfully wrote OpenAI audio to {abs_path}")
    except Exception as e:
        print(f"  Failed to generate OpenAI audio: {e}")
