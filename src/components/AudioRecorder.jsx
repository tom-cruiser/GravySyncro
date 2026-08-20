import React, { useEffect, useRef, useState } from 'react';
import { Mic, Pause, Play, Square, RotateCcw } from 'lucide-react';
import './AudioRecorder.css';

const formatElapsed = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

// Picks the best mime type the browser's MediaRecorder actually supports,
// since Safari/Firefox/Chrome don't agree on one default.
const pickSupportedMimeType = () => {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  if (typeof MediaRecorder === 'undefined') return '';
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || '';
};

/**
 * Record/pause/resume/stop UI backed by the browser's MediaRecorder API.
 * Once stopped, shows a preview player and lets the user re-record or hand
 * the finished blob off to the caller via onRecordingReady.
 */
const AudioRecorder = ({ onRecordingReady, disabled = false }) => {
  const [phase, setPhase] = useState('idle'); // idle | recording | paused | stopped
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const mimeTypeRef = useRef('');
  // recorder.onstop is assigned once per recording and closes over whatever
  // `elapsedSeconds` was at that time (0, since it's set right after) — a
  // ref always reflects the latest tick, so the reported duration is correct.
  const elapsedSecondsRef = useRef(0);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => {
    clearTimer();
    stopStream();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      mimeTypeRef.current = pickSupportedMimeType();

      const recorder = new MediaRecorder(stream, mimeTypeRef.current ? { mimeType: mimeTypeRef.current } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopStream();
        onRecordingReady?.(blob, elapsedSecondsRef.current);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      elapsedSecondsRef.current = 0;
      setElapsedSeconds(0);
      setPhase('recording');

      timerRef.current = setInterval(() => {
        elapsedSecondsRef.current += 1;
        setElapsedSeconds(elapsedSecondsRef.current);
      }, 1000);
    } catch (err) {
      setError('Microphone access was denied or is unavailable. Check your browser permissions.');
    }
  };

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause();
    clearTimer();
    setPhase('paused');
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    timerRef.current = setInterval(() => {
      elapsedSecondsRef.current += 1;
      setElapsedSeconds(elapsedSecondsRef.current);
    }, 1000);
    setPhase('recording');
  };

  const stopRecording = () => {
    clearTimer();
    mediaRecorderRef.current?.stop();
    setPhase('stopped');
  };

  const reRecord = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    elapsedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setPhase('idle');
    chunksRef.current = [];
  };

  return (
    <div className="audio-recorder">
      {error && <p className="audio-recorder-error">{error}</p>}

      <div className="audio-recorder-timer">
        <span className={`audio-recorder-dot ${phase === 'recording' ? 'live' : ''}`} />
        {formatElapsed(elapsedSeconds)}
      </div>

      <div className="audio-recorder-controls">
        {phase === 'idle' && (
          <button type="button" className="audio-recorder-btn primary" onClick={startRecording} disabled={disabled}>
            <Mic size={18} /> Record
          </button>
        )}

        {phase === 'recording' && (
          <>
            <button type="button" className="audio-recorder-btn" onClick={pauseRecording}>
              <Pause size={18} /> Pause
            </button>
            <button type="button" className="audio-recorder-btn danger" onClick={stopRecording}>
              <Square size={18} /> Stop
            </button>
          </>
        )}

        {phase === 'paused' && (
          <>
            <button type="button" className="audio-recorder-btn primary" onClick={resumeRecording}>
              <Play size={18} /> Resume
            </button>
            <button type="button" className="audio-recorder-btn danger" onClick={stopRecording}>
              <Square size={18} /> Stop
            </button>
          </>
        )}

        {phase === 'stopped' && previewUrl && (
          <>
            <audio className="audio-recorder-preview" src={previewUrl} controls />
            <button type="button" className="audio-recorder-btn" onClick={reRecord} disabled={disabled}>
              <RotateCcw size={16} /> Re-record
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
