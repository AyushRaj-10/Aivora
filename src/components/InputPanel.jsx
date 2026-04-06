import React, { useState } from 'react';
import { Play, Loader2, Code2 } from 'lucide-react';
import { generateImageForKeyframe, generatePromptFromScene } from '../utils/gemini';

const DEFAULT_JSON = `[
  {
    "character": "Bheem",
    "line": "Don't worry Chutki, I will save Dholakpur from the thieves!",
    "duration": 4.0,
    "director_note": "Heroic, confident smile"
  },
  {
    "character": "Kalia",
    "line": "Haha! Not if I stop you first, Bheem!",
    "duration": 3.5,
    "director_note": "Arrogant, hands on hips"
  },
  {
    "character": "Chutki",
    "line": "Be careful Bheem! They have set a trap in the forest!",
    "duration": 3.0,
    "director_note": "Worried, pointing forward"
  },
  {
    "character": "Raju",
    "line": "We are with you Bheem! Let's go!",
    "duration": 2.5,
    "director_note": "Enthusiastic, jumping"
  }
]`;

export default function InputPanel({ onDataParsed, setGeneratedImages, setIsPlaying, isGenerating, setIsGenerating }) {
  const [jsonText, setJsonText] = useState(DEFAULT_JSON);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleGenerate = async () => {
    try {
      setError('');
      setIsPlaying(false);
      
      const parsedScenes = JSON.parse(jsonText);
      if (!Array.isArray(parsedScenes)) {
        throw new Error("Invalid JSON: Root must be an array of scenes.");
      }
      
      onDataParsed(parsedScenes);
      setIsGenerating(true);
      
      const images = [];
      setProgress({ current: 0, total: parsedScenes.length });

      for (let i = 0; i < parsedScenes.length; i++) {
        const scene = parsedScenes[i];
        setProgress({ current: i + 1, total: parsedScenes.length });
        
        // Use internally generated photorealistic 3D portraits to bypass API 404s
        const charName = (scene.character || "bheem").toLowerCase();
        const imgUrl = `http://localhost:5173/faces/${charName}.png`;
        
        try {
           const sadResp = await fetch('http://localhost:8001/generate-avatar-video', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                 image_url: imgUrl, 
                 duration: scene.duration || 3.0,
                 line: scene.line,
                 character: scene.character
               })
           });
           
           if (!sadResp.ok) throw new Error("SadTalker backend Error");
           const data = await sadResp.json();
           images.push({ type: 'video', src: data.video_url });
        } catch (e) {
           console.error("SadTalker bridge failed, using static fallback:", e);
           images.push({ type: 'image', src: imgUrl });
        }
      }

      setGeneratedImages(images);
      setIsGenerating(false);
      setIsPlaying(true);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to parse JSON or generate avatars.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] overflow-hidden">
      <div className="p-6 border-b border-gray-800 bg-[#0f0f0f] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent w-max">
            Cartoon AI Video
          </h1>
          <p className="text-xs text-gray-400 mt-1">Multi-scene dialogue video generator</p>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Code2 size={16} className="text-orange-400" />
          Scene Array Payload
        </label>
        
        <textarea
          className="flex-1 w-full bg-[#1e1e1e] border border-gray-800 rounded-xl p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck="false"
        />

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs mt-2">
            {error}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-800 bg-[#0f0f0f]">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full relative overflow-hidden group bg-orange-500 hover:bg-orange-400 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(249,115,22,0.3)]"
        >
          {isGenerating ? (
            <>
               <Loader2 className="animate-spin text-white/70" size={20} />
               <span className="animate-pulse">Rendering animation... {progress.current}/{progress.total}</span>
            </>
          ) : (
            <>
              <Play fill="currentColor" size={18} />
              <span>Generate Video</span>
            </>
          )}
          
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
        </button>
      </div>
    </div>
  );
}
