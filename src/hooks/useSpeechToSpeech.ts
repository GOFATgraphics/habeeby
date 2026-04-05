import { useState, useRef, useCallback } from 'react';
import { useAudioRecording } from './useAudioRecording';

const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb';

function getEnvConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Backend configuration is missing');
  return { supabaseUrl, supabaseKey };
}

export function useSpeechToSpeech(sendMessage: (content: string) => Promise<void> | void) {
  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingMessageIdRef = useRef<string | null>(null);

  const startListening = startRecording;

  const stopListening = useCallback(async () => {
    const { supabaseUrl, supabaseKey } = getEnvConfig();
    setIsProcessing(true);
    try {
      const audioBlob = await stopRecording();

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const sttResponse = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-stt`, {
        method: 'POST',
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: formData,
      });

      if (!sttResponse.ok) {
        const payload = await sttResponse.text();
        throw new Error(payload || 'STT failed');
      }

      const sttData = await sttResponse.json() as { text?: string };
      const transcribedText = sttData.text || '';

      if (transcribedText) {
        await sendMessage(transcribedText);
      }
    } catch (err) {
      console.error('Speech-to-speech error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [stopRecording, sendMessage]);

  const speakResponse = useCallback(async (text: string, messageId: string) => {
    const { supabaseUrl, supabaseKey } = getEnvConfig();

    if (speakingMessageIdRef.current === messageId) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    speakingMessageIdRef.current = messageId;

    try {
      setIsAISpeaking(true);

      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ text, voiceId: ELEVENLABS_VOICE_ID }),
      });

      if (!response.ok) {
        const payload = await response.text();
        throw new Error(payload || 'TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        speakingMessageIdRef.current = null;
        setIsAISpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      speakingMessageIdRef.current = null;
      setIsAISpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speakingMessageIdRef.current = null;
    setIsAISpeaking(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    isAISpeaking,
    startListening,
    stopListening,
    speakResponse,
    stopSpeaking,
  };
}
