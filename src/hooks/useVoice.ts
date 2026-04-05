import { useState, useRef, useCallback } from 'react';
import { useAudioRecording } from './useAudioRecording';

const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb';

function getEnvConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Backend configuration is missing');
  return { supabaseUrl, supabaseKey };
}

export function useVoice() {
  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopRecordingAndTranscribe = useCallback(async (): Promise<string> => {
    const { supabaseUrl, supabaseKey } = getEnvConfig();
    const audioBlob = await stopRecording();

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-stt`, {
      method: 'POST',
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(payload || 'STT failed');
    }

    const data = await response.json() as { text?: string };
    return data.text || '';
  }, [stopRecording]);

  const playTTS = useCallback(async (text: string, messageId: string) => {
    const { supabaseUrl, supabaseKey } = getEnvConfig();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingMessageId === messageId) {
      setIsPlaying(false);
      setPlayingMessageId(null);
      return;
    }

    try {
      setIsPlaying(true);
      setPlayingMessageId(messageId);

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
        setIsPlaying(false);
        setPlayingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsPlaying(false);
      setPlayingMessageId(null);
    }
  }, [playingMessageId]);

  return {
    isRecording,
    isPlaying,
    playingMessageId,
    startRecording,
    stopRecording: stopRecordingAndTranscribe,
    playTTS,
  };
}
