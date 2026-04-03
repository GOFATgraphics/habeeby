import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb';

function getEnvConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Backend configuration is missing');
  }

  return { supabaseUrl, supabaseKey };
}

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        toast.error('Could not access microphone. Please check your device and try again.');
        console.error('Failed to start recording:', err);
      }
      throw err;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    const { supabaseUrl, supabaseKey } = getEnvConfig();

    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsRecording(false);
        mediaRecorder.stream.getTracks().forEach(t => t.stop());

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-stt`, {
            method: 'POST',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const payload = await response.text();
            throw new Error(payload || 'STT failed');
          }

          const data = await response.json();
          resolve(data.text || '');
        } catch (err) {
          reject(err);
        }
      };

      mediaRecorder.stop();
    });
  }, []);

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
    stopRecording,
    playTTS,
  };
}
