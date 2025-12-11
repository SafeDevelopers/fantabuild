/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowUpTrayIcon, SparklesIcon, CpuChipIcon, PaperClipIcon, XMarkIcon, DocumentIcon, LockClosedIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, VideoCameraIcon, PaintBrushIcon, FilmIcon } from '@heroicons/react/24/outline';
import { GenerationMode } from '../services/gemini';

interface InputAreaProps {
  onGenerate: (prompt: string, file: File | undefined, mode: GenerationMode) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const CyclingText = () => {
    const words = [
        "a napkin sketch",
        "a chaotic whiteboard",
        "a game level design",
        "a sci-fi interface",
        "a diagram of a machine",
        "an ancient scroll"
    ];
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // fade out
            setTimeout(() => {
                setIndex(prev => (prev + 1) % words.length);
                setFade(true); // fade in
            }, 500); // Wait for fade out
        }, 3000); // Slower cycle to read longer text
        return () => clearInterval(interval);
    }, [words.length]);

    return (
        <span className={`inline-block whitespace-nowrap transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-sm'} text-white font-medium pb-1 border-b-2 border-orange-500/50`}>
            {words[index]}
        </span>
    );
};

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<GenerationMode>('web');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert("Please upload an image or PDF.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, isGenerating]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isGenerating) {
        setIsDragging(true);
    }
  }, [disabled, isGenerating]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleSubmit = () => {
    if (!prompt.trim() && !selectedFile) return;
    onGenerate(prompt, selectedFile || undefined, mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const modes: { id: GenerationMode; label: string; icon: any }[] = [
      { id: 'web', label: 'Web App', icon: ComputerDesktopIcon },
      { id: 'mobile', label: 'Mobile UI', icon: DevicePhoneMobileIcon },
      { id: 'social', label: 'TikTok/Reels', icon: VideoCameraIcon },
      { id: 'logo', label: 'Logo & Brand', icon: PaintBrushIcon },
      { id: 'video', label: 'AI Video', icon: FilmIcon },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto perspective-1000">
        {/* Mode Selector - Mobile Optimized */}
        <div className="flex justify-center mb-3 sm:mb-4 px-2">
            <div className="inline-flex bg-zinc-900/80 backdrop-blur-md rounded-full p-0.5 sm:p-1 border border-zinc-800 shadow-xl overflow-x-auto scrollbar-hide max-w-full">
                {modes.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        disabled={disabled || isGenerating}
                        className={`
                            relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-[10px] xs:text-xs sm:text-xs md:text-sm font-medium transition-all duration-300 flex-shrink-0
                            ${mode === m.id 
                                ? 'text-white shadow-lg' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }
                        `}
                    >
                        {mode === m.id && (
                            <div className="absolute inset-0 bg-zinc-800 rounded-full border border-zinc-700 -z-10 animate-in fade-in zoom-in duration-200"></div>
                        )}
                        <m.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${mode === m.id ? 'text-orange-500' : ''}`} />
                        <span className="whitespace-nowrap">{m.label}</span>
                    </button>
                ))}
            </div>
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>

      <div 
        className={`relative group transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div
          className={`
            relative flex flex-col items-center
            min-h-[14rem] md:min-h-[16rem]
            bg-zinc-900/30 
            backdrop-blur-sm
            rounded-xl border border-dashed
            overflow-hidden
            transition-all duration-300
            ${disabled 
                ? 'border-red-900/30 bg-red-950/10 opacity-70 cursor-not-allowed' 
                : isDragging 
                  ? 'border-orange-500 bg-zinc-900/50 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]' 
                  : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/40'
            }
          `}
        >
            {/* Technical Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px'}}>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center w-full h-full p-4 sm:p-6 md:p-8">
                
                {/* Header Section */}
                {!selectedFile && (
                    <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col items-center transition-all duration-300">
                        <div className={`relative w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform duration-500 ${isDragging ? 'scale-110' : ''}`}>
                            <div className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-zinc-800 border border-zinc-700 shadow-xl flex items-center justify-center ${isGenerating ? 'animate-pulse' : ''}`}>
                                {isGenerating ? (
                                    <CpuChipIcon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-400 animate-spin-slow" />
                                ) : disabled ? (
                                    <LockClosedIcon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500/50" />
                                ) : (
                                    <ArrowUpTrayIcon className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-zinc-300 transition-all duration-300 ${isDragging ? '-translate-y-1 text-orange-400' : ''}`} />
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2 px-2">
                            <h3 className="flex flex-col sm:flex-row items-center justify-center text-base xs:text-lg sm:text-xl md:text-2xl text-zinc-100 leading-tight sm:leading-none font-bold tracking-tighter gap-1.5 sm:gap-2 md:gap-3">
                                {disabled ? (
                                    <span className="text-zinc-500">Daily Limit Reached</span>
                                ) : (
                                    <>
                                        <span>Bring</span>
                                        <div className="h-5 xs:h-6 sm:h-7 md:h-8 flex items-center justify-center">
                                           <CyclingText />
                                        </div>
                                        <span>to life</span>
                                    </>
                                )}
                            </h3>
                            <p className="text-zinc-500 text-[11px] xs:text-xs sm:text-sm md:text-sm font-light tracking-wide px-2">
                                {disabled ? "Check back tomorrow for more credits." : "Drop an image, or type a prompt below"}
                            </p>
                        </div>
                    </div>
                )}

                {/* File Preview (If Selected) */}
                {selectedFile && (
                    <div className="w-full max-w-lg mb-6 animate-in fade-in zoom-in duration-300">
                        <div className="relative flex items-center p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg group/file">
                            <div className="w-10 h-10 flex-shrink-0 bg-zinc-800 rounded flex items-center justify-center border border-zinc-700">
                                <DocumentIcon className="w-6 h-6 text-orange-400" />
                            </div>
                            <div className="ml-3 flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-zinc-200 truncate">{selectedFile.name}</p>
                                <p className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button 
                                onClick={clearFile}
                                disabled={disabled}
                                className="p-1.5 hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-red-400 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Controls */}
                <div className="w-full max-w-2xl relative">
                    <div className={`relative flex items-end gap-2 bg-zinc-950/80 border focus-within:ring-1 rounded-xl p-2 transition-all shadow-lg ${disabled ? 'border-red-900/20' : 'border-zinc-700 focus-within:border-orange-500/50 focus-within:ring-orange-500/50'}`}>
                        
                        {/* Attach Button */}
                        <button 
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach Image or PDF"
                            disabled={disabled}
                        >
                            <PaperClipIcon className="w-5 h-5" />
                        </button>

                        {/* Text Area */}
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                disabled 
                                ? "Limit reached." 
                                : selectedFile 
                                    ? "Add instructions (optional)..." 
                                    : mode === 'social' 
                                        ? "Describe the video vibe (e.g., 'Energetic sneaker ad')..."
                                        : mode === 'logo'
                                            ? "Describe the brand (e.g., 'Minimal coffee shop')..."
                                            : "Describe what you want to build..."
                            }
                            className={`w-full bg-transparent border-none text-zinc-100 placeholder-zinc-600 focus:ring-0 resize-none py-2 px-1 max-h-32 text-sm md:text-base leading-relaxed ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                            rows={1}
                            disabled={disabled || isGenerating}
                        />

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!prompt.trim() && !selectedFile || disabled || isGenerating}
                            className={`
                                p-2 rounded-lg flex-shrink-0 transition-all duration-200
                                ${(!prompt.trim() && !selectedFile) || disabled
                                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                                    : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20'
                                }
                            `}
                        >
                            {isGenerating ? (
                                <CpuChipIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <SparklesIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

            </div>

            <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isGenerating || disabled}
            />
        </div>
      </div>
    </div>
  );
};