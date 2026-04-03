import { useState, useRef, useCallback } from 'react';

const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb';

function getEnvConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Backend configuration is missing');
  }

  return { supabaseUrl, supabaseKey };
}

export function useSpeechToSpeech(sendMessage: (content: string) => Promise<void> | void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingMessageIdRef = useRef<string | null>(null);

  const startListening = useCallback(async () => {
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
      console.error('Failed to start recording:', err);
    }
  }, []);

  const stopListening = useCallback(async () => {
    const { supabaseUrl, supabaseKey } = getEnvConfig();
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    return new Promise<void>((resolve) => {
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsRecording(false);
        setIsProcessing(true);
        mediaRecorder.stream.getTracks().forEach(t => t.stop());

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const sttResponse = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-stt`, {
            method: 'POST',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: formData,
          });

          if (!sttResponse.ok) {
            const payload = await sttResponse.text();
            throw new Error(payload || 'STT failed');
          }

          const sttData = await sttResponse.json();
          const transcribedText = sttData.text || '';

          if (transcribedText) {
            await sendMessage(transcribedText);
          }
        } catch (err) {
          console.error('Speech-to-speech error:', err);
        } finally {
          setIsProcessing(false);
          resolve();
        }
      };

      mediaRecorder.stop();
    });
  }, [sendMessage]);

  const speakResponse = useCallback(async (text: string, messageId: string) => {
    const { supabaseUrl, supabaseKey } = getEnvConfig();

    // Deduplicate: don't re-speak a message that is already playing.
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
