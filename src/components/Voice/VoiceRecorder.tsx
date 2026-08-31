import React, { useRef, useState } from 'react';
import { Mic, Square, Trash2, Upload, FileAudio, RefreshCw } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

interface Props {
  /** Existing base64 data-URI recording, if any (e.g. saved greetingAudioUrl). */
  value?: string;
  onChange: (dataUri: string | undefined) => void;
  /** Short label describing what's being recorded, e.g. a person's name. */
  label?: string;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ACCEPTED_FORMATS = 'audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac,.flac';

/** A versatile voice prompt control supporting both live mic recording and audio file uploads */
export function VoiceRecorder({ value, onChange, label }: Props) {
  const recorder = useVoiceRecorder();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleToggleRecord = async () => {
    setFileError(null);
    if (recorder.state === 'recording') {
      const dataUri = await recorder.stop();
      if (dataUri) {
        onChange(dataUri);
      }
    } else {
      await recorder.start();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('Audio file is too large. Please select a file under 15MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setIsUploading(false);
      const result = reader.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setFileError('Could not read audio file. Please try another file.');
    };
    reader.readAsDataURL(file);

    // Reset input so re-uploading the same file still triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    recorder.reset();
    setFileError(null);
    onChange(undefined);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept={ACCEPTED_FORMATS}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        aria-label="Upload audio file"
      />

      {value && recorder.state !== 'recording' ? (
        /* State 1: Audio is present (from recording or file upload) */
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          background: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          borderRadius: 12,
          padding: '8px 12px',
        }}>
          <audio
            src={value}
            controls
            style={{ height: 36, minWidth: 200, flex: 1 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={handleToggleRecord}
              title="Record a new clip with microphone"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: 'white',
                color: '#475569',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Mic size={13} /> Re-record
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload a different audio file"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: 'white',
                color: '#475569',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Upload size={13} /> Change File
            </button>

            <button
              type="button"
              onClick={handleRemove}
              title="Delete audio clip"
              aria-label="Delete audio clip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 8,
                border: 'none',
                background: '#FEE2E2',
                color: '#DC2626',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* State 2: No audio yet, or currently recording */
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {/* Record Button */}
          {recorder.isSupported && (
            <button
              type="button"
              onClick={handleToggleRecord}
              aria-label={recorder.state === 'recording' ? 'Stop recording' : `Record${label ? ` for ${label}` : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                background: recorder.state === 'recording' ? '#EF4444' : '#E0F2FE',
                color: recorder.state === 'recording' ? 'white' : '#0369A1',
                boxShadow: recorder.state === 'recording' ? '0 0 0 3px rgba(239, 68, 68, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {recorder.state === 'recording' ? (
                <>
                  <Square size={13} fill="white" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic size={14} />
                  <span>Record Voice</span>
                </>
              )}
            </button>
          )}

          {recorder.state !== 'recording' && (
            <>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>or</span>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  color: '#334155',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>Upload Audio File</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Helpful format hint */}
      {!value && recorder.state !== 'recording' && (
        <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
          <FileAudio size={12} /> Supports mic recording or audio files (.mp3, .wav, .m4a, .ogg)
        </span>
      )}

      {/* Errors */}
      {(recorder.error || fileError) && (
        <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
          ⚠️ {recorder.error || fileError}
        </span>
      )}
    </div>
  );
}
