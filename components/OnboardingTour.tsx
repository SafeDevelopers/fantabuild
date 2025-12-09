/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { XMarkIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setStep(0);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const steps = [
    {
      // Step 0: Welcome Modal (Center)
      position: "inset-0 flex items-center justify-center",
      content: (
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
          {/* Fanta Glow Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-900/10">
              <SparklesIcon className="w-8 h-8 text-orange-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">Welcome to Fanta Build</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              The fastest way to turn your ideas into reality. 
              We transform sketches, screenshots, and diagrams into fully functional code instantly.
            </p>

            <button 
              onClick={handleNext}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-all flex items-center justify-center space-x-2 shadow-[0_4px_20px_rgba(249,115,22,0.2)]"
            >
              <span>Start Tour</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    },
    {
      // Step 1: Input Area (Center-Middle)
      // We position the spotlight relative to the screen to highlight the input area
      spotlightPosition: "top-[50%] left-1/2 -translate-x-1/2 -translate-y-[10%]",
      spotlightSize: "w-[90%] max-w-4xl h-[22rem]",
      tooltipPosition: "top-[50%] left-1/2 -translate-x-1/2 translate-y-[11rem] mt-8", // Below the input
      title: "Drop Anything Here",
      text: "Upload a napkin sketch, a whiteboard photo, or a UI wireframe. Our AI analyzes the visual structure and builds a working app in seconds."
    },
    {
      // Step 2: History (Bottom)
      spotlightPosition: "bottom-0 left-0 w-full h-[180px]",
      spotlightSize: "w-full h-[180px]",
      tooltipPosition: "bottom-[200px] left-1/2 -translate-x-1/2", // Above the history
      title: "Your Archive",
      text: "Every generation is saved here. You can click on the examples (like the Chess Game or Cassette Player) to see what Fanta Build is capable of."
    }
  ];

  const currentStepData = steps[step];

  return (
    <div className={`fixed inset-0 z-[60] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Backdrop with "Cutout" logic simulated via SVG or just heavy shadows. 
          For simplicity and robustness, we use a dark background and float the content on top 
          or use a spotlight div that is transparent with a huge shadow. */}
      
      {step === 0 ? (
        // Simple dark backdrop for welcome modal
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-700"></div>
      ) : (
        // Spotlight effect for steps 1 & 2
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {/* The dark overlay constructed of 4 divs around the hole would be complex. 
                 Instead, we use a giant box-shadow on the "hole" element. */}
             <div 
                className={`absolute transition-all duration-700 ease-in-out rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] border-2 border-orange-500/50 ${currentStepData.spotlightPosition} ${currentStepData.spotlightSize}`}
             >
                {/* Pulse animation for the target area */}
                <div className="absolute inset-0 bg-orange-500/5 animate-pulse rounded-xl"></div>
             </div>
        </div>
      )}

      {/* Content Layer */}
      <div className="absolute inset-0 pointer-events-auto">
        {step === 0 ? (
           <div className={currentStepData.position}>
             {currentStepData.content}
           </div>
        ) : (
           <div className={`absolute transition-all duration-700 ease-in-out w-[90%] max-w-md ${currentStepData.tooltipPosition}`}>
              <div className="bg-[#121214] border border-zinc-800 p-6 rounded-xl shadow-2xl relative">
                  {/* Triangle pointer (simplified) */}
                  <div className={`absolute w-4 h-4 bg-[#121214] border-l border-t border-zinc-800 transform rotate-45 left-1/2 -translate-x-1/2 ${step === 2 ? 'bottom-[-9px] rotate-[225deg]' : 'top-[-9px]'}`}></div>
                  
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-orange-500 text-xs font-bold tracking-wider uppercase">Step {step} of 2</span>
                      <button onClick={onClose} className="text-zinc-500 hover:text-white">
                          <XMarkIcon className="w-4 h-4" />
                      </button>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{currentStepData.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6">{currentStepData.text}</p>
                  
                  <div className="flex justify-end space-x-3">
                      <button onClick={onClose} className="text-zinc-500 text-sm font-medium hover:text-white px-3 py-2">
                          Skip
                      </button>
                      <button 
                        onClick={handleNext}
                        className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                          {step === 2 ? 'Get Started' : 'Next'}
                      </button>
                  </div>
              </div>
           </div>
        )}
      </div>

    </div>
  );
};