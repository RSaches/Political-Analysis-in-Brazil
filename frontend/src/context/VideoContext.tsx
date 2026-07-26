'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface VideoData {
  title: string;
  content: string; // YouTube URL
  images?: { medium?: string };
}

interface VideoContextType {
  globalVideo: VideoData | null;
  setGlobalVideo: (video: VideoData | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const VideoContext = createContext<VideoContextType>({
  globalVideo: null,
  setGlobalVideo: () => {},
  isPlaying: false,
  setIsPlaying: () => {},
});

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [globalVideo, setGlobalVideoState] = useState<VideoData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const setGlobalVideo = useCallback((video: VideoData | null) => {
    setGlobalVideoState(video);
    setIsPlaying(!!video);
  }, []);

  return (
    <VideoContext.Provider value={{ globalVideo, setGlobalVideo, isPlaying, setIsPlaying }}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  return useContext(VideoContext);
}
