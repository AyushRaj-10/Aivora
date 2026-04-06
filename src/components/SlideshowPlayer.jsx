import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SlideshowPlayer({ keyframeData, images, isPlaying, setIsPlaying, isGenerating }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying || !keyframeData || images.length === 0) return;

    const playNextFrame = () => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= images.length) {
          setIsPlaying(false);
          return prev; // Stay on last frame
        }
        return next;
      });
    };

    const currentScene = keyframeData[currentIndex];
    let durationSeconds = currentScene?.duration || 3.0;

    const timeout = setTimeout(playNextFrame, durationSeconds * 1000);
    return () => clearTimeout(timeout);
  }, [currentIndex, isPlaying, keyframeData, images, setIsPlaying]);

  useEffect(() => {
    if (isPlaying) setCurrentIndex(0);
  }, [isPlaying]);

  const getMotionProps = (index) => {
    const isEven = index % 2 === 0;
    return {
      initial: { opacity: 0, scale: isEven ? 1.05 : 1.25, x: isEven ? -15 : 15, rotate: isEven ? -2 : 2 },
      animate: { opacity: 1, scale: isEven ? 1.15 : 1.05, x: isEven ? 15 : -15, rotate: 0 },
      exit: { opacity: 0, scale: isEven ? 1.2 : 1.0, zIndex: 0 },
      transition: { 
        opacity: { duration: 0.8, ease: "easeInOut" },
        scale: { duration: 15, ease: "linear" },
        x: { duration: 15, ease: "linear" },
        rotate: { duration: 15, ease: "linear" }
      }
    };
  };

  const currentScene = keyframeData && keyframeData.length > currentIndex ? keyframeData[currentIndex] : null;
  const currentMedia = images[currentIndex];

  return (
    <div className="w-full h-full relative bg-gray-900 flex items-center justify-center overflow-hidden font-sans shadow-inner">
      {isGenerating ? (
        <div className="flex flex-col items-center gap-6">
           <div className="relative flex justify-center items-center">
             <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin w-16 h-16" />
           </div>
           <p className="text-gray-400 tracking-widest uppercase text-sm animate-pulse mt-12">Rendering Wav2Lip Pipeline...</p>
        </div>
      ) : images.length > 0 && currentScene && currentMedia ? (
        <>
          <AnimatePresence>
             {currentMedia.type === 'video' ? (
                 <motion.video 
                    key={currentIndex + "-vid"}
                    src={currentMedia.src}
                    autoPlay
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover origin-center"
                    style={{ willChange: "transform, opacity" }}
                    {...getMotionProps(currentIndex)}
                 />
             ) : (
                 <motion.img 
                    key={currentIndex + "-img"}
                    src={currentMedia.src || currentMedia.fallback}
                    className="absolute inset-0 w-full h-full object-cover origin-center"
                    style={{ willChange: "transform, opacity" }}
                    {...getMotionProps(currentIndex)}
                 />
             )}
          </AnimatePresence>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent pointer-events-none z-10" />
          
          <div className="absolute bottom-12 w-full px-12 z-20 flex flex-col items-center">
            {currentScene.line && (
              <motion.div 
                 key={"text-" + currentIndex}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ delay: 0.1, duration: 0.8 }}
                 className="flex flex-col items-center max-w-4xl w-full gap-2"
              >
                 {currentScene.character && (
                   <span className="text-orange-400 font-bold tracking-widest uppercase text-lg bg-black/60 px-4 py-1 rounded-md border border-orange-500/30">
                     {currentScene.character}
                   </span>
                 )}
                 <p className="text-white text-3xl lg:text-5xl font-medium tracking-tight text-center px-8"
                    style={{ textShadow: "0 4px 20px rgba(0,0,0,0.9), 0 2px 5px rgba(0,0,0,1)" }}>
                   "{currentScene.line}"
                 </p>
              </motion.div>
            )}
            
            <div className="mt-12 flex gap-3 w-full max-w-md justify-center">
              {images.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ease-in-out ${i === currentIndex ? 'w-16 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'w-4 bg-white/20'}`} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-gray-500 flex flex-col items-center gap-4">
           <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
           </svg>
           <p className="text-sm tracking-widest uppercase opacity-80">Ready to play video</p>
        </div>
      )}
    </div>
  );
}
