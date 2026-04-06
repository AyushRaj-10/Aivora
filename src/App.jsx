import React, { useState } from 'react';
import InputPanel from './components/InputPanel';
import SlideshowPlayer from './components/SlideshowPlayer';

function App() {
  const [keyframeData, setKeyframeData] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDataParsed = (data) => {
    setKeyframeData(data);
  };

  return (
    <div className="flex h-screen w-full bg-background text-text overflow-hidden font-sans">
      {/* Left Panel: Input */}
      <div className="w-[400px] lg:w-[500px] flex-shrink-0 flex flex-col border-r border-border bg-surface shadow-2xl z-20">
        <InputPanel 
          onDataParsed={handleDataParsed}
          setGeneratedImages={setGeneratedImages} 
          setIsPlaying={setIsPlaying}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          keyframeData={keyframeData}
        />
      </div>
      
      {/* Right Panel: Slideshow Output */}
      <div className="flex-1 flex flex-col relative bg-black shadow-inner z-10 overflow-hidden">
        <SlideshowPlayer 
          keyframeData={keyframeData} 
          images={generatedImages} 
          isPlaying={isPlaying} 
          setIsPlaying={setIsPlaying}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}

export default App;
