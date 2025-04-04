import { useCallback, useRef } from 'react';

export const useSpeech = () => {
  const speechRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!speechRef.current) {
      speechRef.current = window.speechSynthesis;
    }

    // Cancel any ongoing speech
    speechRef.current.cancel();

    // Create new utterance
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = 1;
    utteranceRef.current.pitch = 1;

    // Speak the text
    speechRef.current.speak(utteranceRef.current);
  }, []);

  const stop = useCallback(() => {
    if (speechRef.current) {
      speechRef.current.cancel();
    }
  }, []);

  return { speak, stop };
};