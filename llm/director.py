import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are a voice director.

Given a line and emotional parameters, produce expressive dialogue for speech.

Rules:
- Keep original meaning
- Add pauses using "..."
- Add style tags in [brackets] at start
- Reflect tone and subtext
- Keep it natural and short
"""

def direct_line(data, context=None):
    context_str = f"Context: {context}" if context else ""

    user_prompt = f"""
Text: {data['text']}
Emotion: {data['emotion']}
Intensity: {data['intensity']}
Tone: {data['tone']}
Subtext: {data['subtext']}
{context_str}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback for testing without API key
        return f"[Mocked {data['emotion'].capitalize()}] {data['text']} ..."