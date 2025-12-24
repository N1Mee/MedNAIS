
'use client';

import { useState, useEffect, useCallback } from "react";
import { Button } from "./button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/timer";

interface TimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
}

// Function to play a completion sound
const playCompletionSound = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the sound
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine'; // Sine wave for a smooth sound
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Clean up
    setTimeout(() => {
      audioContext.close();
    }, 1000);
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

export function Timer({ initialSeconds = 0, onComplete, autoStart = false, className }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsCompleted(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
    setIsCompleted(false);
  }, [initialSeconds]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRunning && seconds > 0) {
      intervalId = setInterval(() => {
        setSeconds((prevSeconds) => {
          const newSeconds = prevSeconds - 1;
          if (newSeconds === 0) {
            setIsRunning(false);
            setIsCompleted(true);
            playCompletionSound(); // Play sound when timer completes
            onComplete?.();
          }
          return newSeconds;
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, seconds, onComplete]);

  const isActive = seconds > 0 && !isCompleted;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "text-2xl font-mono font-bold px-3 py-2 rounded-lg min-w-[100px] text-center",
        isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-foreground"
      )}>
        {formatTime(seconds)}
      </div>
      
      <div className="flex gap-1">
        {isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={isRunning ? pause : start}
            className="p-2"
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}
        
        <Button
          size="sm"
          variant="outline"
          onClick={reset}
          className="p-2"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
