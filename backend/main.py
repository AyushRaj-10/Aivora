from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import aiohttp
import hashlib
import os
import sys
import shutil

# Globally configure system path so subproceses can discover Winget's isolated FFmpeg
FFMPEG_DIR = r"C:\Users\amrit\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin"
os.environ["PATH"] = FFMPEG_DIR + os.pathsep + os.environ.get("PATH", "")

from ffmpeg_utils import create_static_video, create_silent_audio, create_speech_audio
from wav2lip_service import run_wav2lip
from sadtalker_service import run_sadtalker

app = FastAPI(title="Video Bridge Service")

# Allow frontend at localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("cache", exist_ok=True)
os.makedirs("temp", exist_ok=True)
app.mount("/static", StaticFiles(directory="cache"), name="static")

class VideoRequest(BaseModel):
    image_url: str
    duration: float
    line: str = ""
    character: str = ""

@app.post("/generate-avatar-video")
async def generate_sadtalker(req: VideoRequest):
    # Hash unique combination
    raw_str = f"sadtalker|{req.image_url}|{req.duration}|{req.line}"
    cache_hash = hashlib.md5(raw_str.encode()).hexdigest()
    output_filename = f"{cache_hash}.mp4"
    output_filepath = os.path.join("cache", output_filename)
    
    if os.path.exists(output_filepath):
        return {"video_url": f"http://localhost:8001/static/{output_filename}"}

    temp_img_png = os.path.join("temp", f"{cache_hash}.png")
    temp_img_jpg = os.path.join("temp", f"{cache_hash}.jpg")
    temp_aud = os.path.join("temp", f"{cache_hash}_in.wav")
    temp_results_dir = os.path.join("temp", f"{cache_hash}_results")
    
    actual_temp = temp_img_png if "png" in req.image_url.lower() else temp_img_jpg
    
    try:
        if req.image_url.startswith("data:image"):
            import base64
            header, encoded = req.image_url.split(",", 1)
            with open(actual_temp, "wb") as f:
                f.write(base64.b64decode(encoded))
        else:
            async with aiohttp.ClientSession() as session:
                async with session.get(req.image_url) as resp:
                    if resp.status != 200:
                        raise HTTPException(status_code=400, detail="Failed to fetch image url")
                    data = await resp.read()
                    with open(actual_temp, "wb") as f:
                        f.write(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
         
    if req.line:
         if not create_speech_audio(req.line, req.duration, temp_aud):
              create_silent_audio(req.duration, temp_aud)
    else:
         if not create_silent_audio(req.duration, temp_aud):
              raise HTTPException(status_code=500, detail="FFmpeg audio creation failed")
         
    # Run Wav2Lip instantly for extreme speed instead of SadTalker
    temp_vid = os.path.join("temp", f"{cache_hash}_in.mp4")
    if not create_static_video(actual_temp, req.duration, temp_vid):
         raise HTTPException(status_code=500, detail="FFmpeg video creation failed")
         
    if not run_wav2lip(temp_vid, temp_aud, output_filepath):
         raise HTTPException(status_code=500, detail="Wav2Lip inference failed")
         
    # Clean up
    for tp in [temp_img_jpg, temp_img_png, temp_aud, temp_vid]:
        if os.path.exists(tp):
            try:
                os.remove(tp)
            except Exception:
                pass
            
    return {"video_url": f"http://localhost:8001/static/{output_filename}"}
