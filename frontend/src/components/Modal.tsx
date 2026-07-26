'use client';

import React, { ReactNode, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  error?: string;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  loading = false,
  error = ''
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
        <div 
          className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 p-6 border-b border-border bg-muted/30">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-medium">Carregando dados oficiais...</p>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
                <p className="font-semibold text-sm">{error}</p>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: var(--primary); }
      `}} />
    </>
  );
}
