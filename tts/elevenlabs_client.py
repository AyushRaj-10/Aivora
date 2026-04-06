import requests

API_KEY = "sk_639f734e263f506e8614464dba6cd0ea1214dc017460ae4d"
VOICE_ID = "EXAVITQu4vr4xnSDxMaL"

def generate(text, params, filename):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    data = {
        "text": text,
        "voice_settings": params
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code != 200:
        raise Exception(f"ElevenLabs API Error [{response.status_code}]: {response.text}")

    with open(filename, "wb") as f:
        f.write(response.content)