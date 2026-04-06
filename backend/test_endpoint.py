import asyncio
import aiohttp
import json

async def test_endpoint():
    url = "http://localhost:8001/generate-avatar-video"
    payload = {
        "image_url": "http://localhost:5173/faces/bheem.png",
        "duration": 4.0,
        "line": "Don't worry Chutki, I will save Dholakpur from the thieves!",
        "character": "Bheem"
    }
    
    print("Testing POST to backend...")
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as resp:
            print("Status Code:", resp.status)
            text = await resp.text()
            print("Response:", text)

if __name__ == "__main__":
    asyncio.run(test_endpoint())
