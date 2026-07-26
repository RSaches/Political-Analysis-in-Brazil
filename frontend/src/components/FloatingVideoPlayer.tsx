'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useVideo } from '@/context/VideoContext';
import { X, GripHorizontal, Minimize2, Maximize2 } from 'lucide-react';

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function FloatingVideoPlayer() {
  const { globalVideo, setGlobalVideo, isPlaying } = useVideo();
  const pathname = usePathname();

  // Size state (resizable)
  const [size, setSize] = useState({ w: 400, h: 225 });
  const [isCompact, setIsCompact] = useState(false);

  // Position state (draggable)
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === '/';

  // Set default position (bottom-right) on first render
  useEffect(() => {
    if (position.x === -1 && position.y === -1 && typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - size.w - 24,
        y: window.innerHeight - size.h - 24,
      });
    }
  }, [position.x, position.y, size.w, size.h]);

  // When toggling compact, adjust size
  useEffect(() => {
    if (isCompact) {
      setSize({ w: 260, h: 146 });
    } else {
      setSize({ w: 400, h: 225 });
    }
  }, [isCompact]);

  // ========================
  // DRAG HANDLERS
  // ========================
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleDragTouchStart = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 80)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 40)),
      });
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      setPosition({
        x: Math.max(0, Math.min(t.clientX - dragOffset.x, window.innerWidth - 80)),
        y: Math.max(0, Math.min(t.clientY - dragOffset.y, window.innerHeight - 40)),
      });
    };
    const onEnd = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, dragOffset]);

  // ========================
  // RESIZE HANDLERS
  // ========================
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizeStart({ x: e.clientX, y: e.clientY, w: size.w, h: size.h });
    setIsResizing(true);
  }, [size]);

  const handleResizeTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const t = e.touches[0];
    setResizeStart({ x: t.clientX, y: t.clientY, w: size.w, h: size.h });
    setIsResizing(true);
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const dw = e.clientX - resizeStart.x;
      const newW = Math.max(240, Math.min(resizeStart.w + dw, 800));
      const newH = Math.round(newW * (9 / 16)); // maintain 16:9
      setSize({ w: newW, h: newH });
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dw = t.clientX - resizeStart.x;
      const newW = Math.max(240, Math.min(resizeStart.w + dw, 800));
      const newH = Math.round(newW * (9 / 16));
      setSize({ w: newW, h: newH });
    };
    const onEnd = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isResizing, resizeStart]);

  // ========================
  // RENDER LOGIC
  // ========================

  // Sempre renderiza quando há vídeo ativo — NUNCA desmonta o iframe
  if (!globalVideo || !isPlaying) return null;

  const videoId = getYouTubeId(globalVideo.content);
  if (!videoId) return null;

  // Na Home, escondemos o floating player (o vídeo é mostrado diretamente na aside)
  // PORÉM mantemos o iframe renderizado (invisível) para preservar o estado de reprodução
  if (isHome) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <iframe
          id="global-video-player"
          width="400"
          height="225"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`}
          title={globalVideo.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] shadow-2xl rounded-2xl overflow-hidden border-2 border-border/80 bg-black group animate-in fade-in zoom-in-90 duration-300"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.w}px`,
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.3s ease',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Drag Handle + Controls Bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragTouchStart}
        style={{ cursor: 'grab' }}
      >
        <div className="flex items-center gap-1.5 text-white/70">
          <GripHorizontal className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[250px]">
            {globalVideo.title.split('(')[0].trim()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsCompact(!isCompact); }}
            className="p-1 rounded-md hover:bg-white/20 text-white/80 transition-colors"
            title={isCompact ? 'Expandir' : 'Minimizar'}
          >
            {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setGlobalVideo(null); }}
            className="p-1 rounded-md hover:bg-red-500/60 text-white/80 transition-colors"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* YouTube iFrame */}
      <iframe
        id="global-video-player"
        width="100%"
        height={size.h}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`}
        title={globalVideo.title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }}
      ></iframe>

      {/* Resize Handle (bottom-right corner) */}
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeTouchStart}
        className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Redimensionar"
      >
        <svg viewBox="0 0 20 20" className="w-full h-full text-white/60">
          <path d="M14 20L20 14M10 20L20 10M6 20L20 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
