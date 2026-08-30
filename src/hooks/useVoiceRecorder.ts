import { useCallback, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'stopped' | 'error';

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Records a short mic clip and hands back a base64 data-URI — the same
 * string format already used for photoUrl/greetingAudioUrl, so recordings
 * need no new storage handling anywhere downstream. Mirrors the
 * feature-detect + graceful-degrade pattern of VoiceService.isSupported().
 */
export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof window !== 'undefined'
    && typeof MediaRecorder !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia;

  const start = useCallback(async () => {
    if (!isSupported) { setError('Recording is not supported on this device.'); setState('error'); return; }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = recorder;
      setState('recording');
    } catch {
      setError('Microphone access was denied or unavailable.');
      setState('error');
    }
  }, [isSupported]);

  const stop = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') { resolve(null); return; }
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        setState('stopped');
        if (blob.size === 0) { resolve(null); return; }
        resolve(await blobToDataUri(blob));
      };
      recorder.stop();
    });
  }, []);

  const reset = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setState('idle');
    setError(null);
  }, []);

  return { isSupported, state, error, start, stop, reset };
}
