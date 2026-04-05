import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

function getSupportedMimeType(): string {
  const candidates = ['audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
  return candidates.find((t) => !t || MediaRecorder.isTypeSupported(t)) ?? '';
}

export interface UseAudioRecordingReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (err.name === 'NotSupportedError') {
          toast.error('Audio recording is not supported on this device or browser.');
        } else if (err.name === 'SecurityError') {
          toast.error('Microphone access blocked by security policy. Please use HTTPS.');
        } else {
          toast.error('Could not access microphone. Please check your device and try again.');
          console.error('Failed to start recording:', err);
        }
      } else {
        toast.error('Could not access microphone. Please check your device and try again.');
        console.error('Failed to start recording:', err);
      }
      throw err;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorder.onerror = (e) => {
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        setIsRecording(false);
        reject(new Error(`Recording error: ${e.type}`));
      };

      mediaRecorder.stop();
    });
  }, []);

  return { isRecording, startRecording, stopRecording };
}
