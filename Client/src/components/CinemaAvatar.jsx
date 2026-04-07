import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const CinemaAvatar = forwardRef((props, ref) => {
  const avatarContainerRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let headInstance;

    const initAvatar = async () => {
      try {
        const { TalkingHead } = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.4/modules/talkinghead.mjs");
        
        if (!isMounted) return;
        
        const container = avatarContainerRef.current;
        headInstance = new TalkingHead(container, {
          ttsEndpoint: "x",
          cameraView: "upper",
          cameraRotateEnable: true,
        });

        headRef.current = headInstance;

        await headInstance.showAvatar({
          url: "https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.4/avatars/brunette.glb",
          body: "F",
          avatarMood: "neutral",
          lipsyncLang: "en",
        });

        console.log("[CinemaAvatar] 3D Avatar Ready");
      } catch (err) {
        console.error("[CinemaAvatar] Failed to load avatar:", err);
      }
    };

    initAvatar();

    return () => {
      isMounted = false;
      if (avatarContainerRef.current) {
        avatarContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getHead: () => headRef.current,
    setMood: (mood) => {
      if (headRef.current) {
        headRef.current.setMood(mood);
      }
    },
    playGesture: (anim) => {
      if (headRef.current) {
        headRef.current.playGesture(anim);
      }
    },
    speakAudio: (audioBuffer, text, mood) => {
      if (headRef.current && audioBuffer) {
        try {
          // Calculate audio duration in ms
          const durationInMs = (audioBuffer.length / audioBuffer.sampleRate) * 1000;
          
          // Generate proportional timestamps for words to trick TalkingHead into triggering true visemes
          const words = text ? text.replace(/\[.*?\]/g, '').trim().split(/\s+/) : [];
          const wtimes = [];
          const wdurations = [];
          
          if (words.length > 0) {
            const timePerWord = Math.floor(durationInMs / words.length);
            let currentTime = 0;
            for (let i = 0; i < words.length; i++) {
              wtimes.push(currentTime);
              // leave a tiny 50ms gap between viseme triggers so they bounce naturally
              wdurations.push(timePerWord > 50 ? timePerWord - 20 : timePerWord);
              currentTime += timePerWord;
            }
          }

          headRef.current.speakAudio({
            audio: audioBuffer,
            words: words,
            wtimes: wtimes,
            wdurations: wdurations
          }, { 
            lipsyncLang: "en" 
          });

          if (mood) {
            headRef.current.setMood(mood);
          }
        } catch (err) {
          console.error("speakAudio error:", err);
        }
      }
    },
    resumeAudioContext: async () => {
      if (headRef.current && headRef.current.audioCtx?.state === "suspended") {
        await headRef.current.audioCtx.resume();
      }
    }
  }));

  return (
    <div
      ref={avatarContainerRef}
      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
      {...props}
    />
  );
});

export default CinemaAvatar;
