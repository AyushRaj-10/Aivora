import os
import requests
from dotenv import load_dotenv

load_dotenv()

def generate(text, params, filename):
    url = "https://api.openai.com/v1/audio/speech"
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        raise Exception("OPENAI_API_KEY is not set in .env")

    voice = params.get("voice", "nova") # nova is a good expressive voice
    model = params.get("model", "tts-1")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": model,
        "input": text,
        "voice": voice
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code != 200:
        raise Exception(f"OpenAI API Error [{response.status_code}]: {response.text}")

    with open(filename, "wb") as f:
        f.write(response.content)
