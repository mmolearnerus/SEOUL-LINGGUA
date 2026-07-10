import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

interface PronunciationButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
  accent?: "US" | "UK";
  rate?: number; // Speed rate
  className?: string;
}

export const PronunciationButton: React.FC<PronunciationButtonProps> = ({
  text,
  size = "md",
  accent = "US",
  rate = 1.0,
  className = "",
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click events

    if (!synth) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng phát âm Web Speech API.");
      return;
    }

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    // Cancel any current utterance
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose voice based on requested accent
    const voices = synth.getVoices();
    let selectedVoice = null;

    if (accent === "UK") {
      selectedVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en-GB") ||
          voice.name.toLowerCase().includes("british") ||
          voice.name.toLowerCase().includes("united kingdom")
      );
    } else {
      selectedVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en-US") ||
          voice.name.toLowerCase().includes("google us") ||
          voice.name.toLowerCase().includes("natural") ||
          voice.name.toLowerCase().includes("america")
      );
    }

    // Fallback if requested voice not found
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) => voice.lang.startsWith("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = rate;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    synth.speak(utterance);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, [synth]);

  const buttonSizes = {
    sm: "p-1.5 text-xs rounded-md",
    md: "p-2 text-sm rounded-lg",
    lg: "p-3 text-base rounded-xl",
  };

  return (
    <button
      id={`speak-btn-${text.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
      onClick={handleSpeak}
      className={`relative inline-flex items-center justify-center transition-all duration-200 cursor-pointer ${
        isSpeaking
          ? "bg-red-50 text-red-600 ring-2 ring-red-200 hover:bg-red-100"
          : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 active:scale-95"
      } ${buttonSizes[size]} ${className}`}
      title={isSpeaking ? "Dừng phát âm" : `Nghe phát âm (${accent})`}
    >
      {isSpeaking ? (
        <div className="flex items-center gap-1">
          <VolumeX className="w-4 h-4 animate-bounce" />
          {size !== "sm" && <span className="font-mono text-xs font-semibold">Stop</span>}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Volume2 className="w-4 h-4" />
          {size !== "sm" && (
            <span className="font-mono text-[10px] tracking-wider uppercase font-bold opacity-80">
              {accent}
            </span>
          )}
        </div>
      )}
    </button>
  );
};
