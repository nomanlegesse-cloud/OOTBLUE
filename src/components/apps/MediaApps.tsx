import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Camera as CameraIcon,
  Flashlight,
  Globe,
  Image as ImageIcon,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  SkipBack,
  SkipForward,
  SwitchCamera,
  ThumbsUp,
  Trash2,
  Video,
  WifiOff,
  X,
} from 'lucide-react';
import { MUSIC_TRACKS } from '../../os/catalog';
import { playShutterSound, playTapSound } from '../../os/sound';
import { PhoneOSController } from '../../os/usePhoneOS';

/* ---------------- CAMERA APP (REAL DEVICE CAMERA) ---------------- */
export const CameraApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [status, setStatus] = useState<'prompt' | 'requesting' | 'active' | 'error'>('prompt');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [savedNotice, setSavedNotice] = useState('');

  const stopStream = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
    setIsRecording(false);
  }, []);

  const startCamera = useCallback(
    async (targetFacing: 'user' | 'environment') => {
      stopStream();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('error');
        setErrorMsg('Camera API is not supported in this browser.');
        return;
      }

      setStatus('requesting');
      setErrorMsg('');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: targetFacing } },
          audio: mode === 'video',
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Check multiple cameras & torch capability
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        } catch {
          setHasMultipleCameras(false);
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
          const caps = videoTrack.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
          setTorchSupported(Boolean(caps?.torch));
        } else {
          setTorchSupported(false);
        }

        setStatus('active');
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setErrorMsg('Camera permission was denied. Allow camera access in your browser and try again.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setErrorMsg('No physical camera device was found on this system.');
        } else if (name === 'NotReadableError') {
          setErrorMsg('Camera is currently in use by another application.');
        } else {
          setErrorMsg('Unable to start camera stream. Please verify permissions.');
        }
        setStatus('error');
      }
    },
    [mode, stopStream],
  );

  // Stop camera tracks strictly on unmount (closing app, locking phone, switching apps)
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordSeconds(0);
      return;
    }
    const id = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  const handleClose = () => {
    stopStream();
    os.goHome();
  };

  const handleSwitchCamera = () => {
    if (isRecording) return;
    setFlipping(true);
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    window.setTimeout(() => setFlipping(false), 380);
    startCamera(nextFacing);
  };

  const handleToggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  };

  const showSavedToast = (msg: string) => {
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(''), 2000);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || status !== 'active') return;
    const video = videoRef.current;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    playShutterSound(os.state.settings.volume, os.state.settings.muted);
    setShutterFlash(true);
    window.setTimeout(() => setShutterFlash(false), 160);

    os.addGalleryMedia({
      type: 'photo',
      src: dataUrl,
      title: `Photo ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      fromCamera: true,
    });
    showSavedToast('Saved photo to Gallery');
  };

  const handleToggleRecordVideo = () => {
    if (status !== 'active' || !streamRef.current) return;
    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      showSavedToast('Video recording unsupported here');
      return;
    }

    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            os.addGalleryMedia({
              type: 'video',
              src: reader.result,
              title: `Video ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              fromCamera: true,
            });
            showSavedToast('Saved video to Gallery');
          }
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      showSavedToast('Could not start video recorder');
    }
  };

  const lastThumb = os.state.gallery[0];

  return (
    <div className="h-full bg-black text-white flex flex-col relative overflow-hidden">
      {/* Top Camera Controls */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
          aria-label="Close camera"
        >
          <X className="w-4 h-4" />
        </button>

        {isRecording ? (
          <div className="px-2.5 py-0.5 rounded-full bg-red-600 text-[11px] font-mono tabular-nums">
            REC {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:
            {String(recordSeconds % 60).padStart(2, '0')}
          </div>
        ) : (
          <span className="text-xs font-medium tracking-wide text-slate-300">
            {mode === 'photo' ? 'PHOTO' : 'VIDEO'}
          </span>
        )}

        {torchSupported ? (
          <button
            onClick={handleToggleFlash}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              torchOn ? 'bg-amber-400 text-slate-950' : 'bg-white/15 text-white'
            }`}
            aria-label="Toggle flash"
          >
            <Flashlight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Live Camera Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center bg-zinc-950 overflow-hidden mx-2 rounded-2xl border border-white/10">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
            flipping ? 'animate-camera-flip' : ''
          } ${status === 'active' ? 'opacity-100' : 'opacity-0'}`}
        />

        {shutterFlash && (
          <div className="absolute inset-0 bg-white/85 pointer-events-none z-30" />
        )}

        {savedNotice && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 text-white text-[11px] font-medium border border-white/15 z-30 whitespace-nowrap">
            {savedNotice}
          </div>
        )}

        {status === 'prompt' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <CameraIcon className="w-7 h-7 text-sky-400" />
            </div>
            <h2 className="text-base font-semibold">Camera Access</h2>
            <p className="text-xs text-slate-400 mt-1.5 max-w-[240px] leading-relaxed">
              Grant browser camera permission to activate the live viewfinder inside the 3D phone.
            </p>
            <button
              onClick={() => startCamera(facingMode)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
            >
              Enable Camera
            </button>
          </div>
        )}

        {status === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-xs text-slate-300 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
            <span>Requesting camera permission...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-3" />
            <p className="text-xs text-slate-300 leading-relaxed max-w-[240px]">{errorMsg}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="mt-4 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher + Shutter Bar */}
      <div className="px-6 pt-3 pb-5 flex flex-col gap-3 bg-black z-20">
        <div className="flex justify-center gap-6 text-xs font-semibold">
          <button
            onClick={() => {
              if (isRecording) return;
              setMode('photo');
              if (status === 'active') startCamera(facingMode);
            }}
            className={mode === 'photo' ? 'text-amber-400' : 'text-slate-500'}
          >
            PHOTO
          </button>
          <button
            onClick={() => {
              if (isRecording) return;
              setMode('video');
              if (status === 'active') startCamera(facingMode);
            }}
            className={mode === 'video' ? 'text-amber-400' : 'text-slate-500'}
          >
            VIDEO
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Gallery Shortcut */}
          <button
            onClick={() => {
              stopStream();
              os.openApp('gallery');
            }}
            className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 border border-white/20 flex items-center justify-center"
            aria-label="Open Gallery"
          >
            {lastThumb && lastThumb.type === 'photo' ? (
              <img
                src={lastThumb.src}
                alt={lastThumb.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-300" />
            )}
          </button>

          {/* Shutter / Record Button */}
          <button
            onClick={mode === 'photo' ? handleCapturePhoto : handleToggleRecordVideo}
            disabled={status !== 'active'}
            className="w-16 h-16 rounded-full border-[3px] border-white flex items-center justify-center disabled:opacity-35 active:scale-95 transition"
            aria-label={mode === 'photo' ? 'Capture photo' : 'Record video'}
          >
            {mode === 'photo' ? (
              <div className="w-12 h-12 rounded-full bg-white" />
            ) : (
              <div
                className={`transition-all ${
                  isRecording ? 'w-6 h-6 rounded-md bg-red-500' : 'w-12 h-12 rounded-full bg-red-500'
                }`}
              />
            )}
          </button>

          {/* Switch Camera Button */}
          <button
            onClick={handleSwitchCamera}
            disabled={status !== 'active' || isRecording}
            title={hasMultipleCameras ? 'Switch Front / Rear Camera' : 'Toggle Camera Facing'}
            className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 flex items-center justify-center"
            aria-label="Switch camera"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- GALLERY APP ---------------- */
export const GalleryApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dark = os.state.settings.darkMode;

  const selected = os.state.gallery.find((g) => g.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="h-full bg-black text-white flex flex-col">
        <div className="px-3 py-3 flex items-center justify-between bg-black/80">
          <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium truncate max-w-[180px]">{selected.title}</span>
          <button
            onClick={() => {
              os.deleteGalleryMedia(selected.id);
              setSelectedId(null);
            }}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15"
            aria-label="Delete media"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
          {selected.type === 'photo' ? (
            <img
              src={selected.src}
              alt={selected.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <video src={selected.src} controls className="max-w-full max-h-full rounded-lg" />
          )}
        </div>
        <div className="px-4 py-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/10">
          <span>{new Date(selected.createdAt).toLocaleString()}</span>
          {selected.fromCamera && <span className="text-sky-400">Camera Roll</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Gallery</h1>
          <p className="text-[11px] opacity-60">{os.state.gallery.length} items</p>
        </div>
        <button
          onClick={() => os.openApp('camera')}
          className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold flex items-center gap-1.5"
        >
          <CameraIcon className="w-3.5 h-3.5" />
          Camera
        </button>
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll px-3 pb-4">
        <div className="grid grid-cols-3 gap-1.5">
          {os.state.gallery.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="aspect-square rounded-lg overflow-hidden bg-slate-800 relative group"
            >
              {item.type === 'photo' ? (
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-sky-400">
                  <Video className="w-5 h-5" />
                  <span className="text-[10px] mt-1">Video</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------- MUSIC APP ---------------- */
export const MusicApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const track = MUSIC_TRACKS[os.musicTrackIndex];
  const dark = os.state.settings.darkMode;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">Music</h1>
        <span className="text-[11px] opacity-60">Synthesized Audio</span>
      </div>

      <div className="px-5 pt-2 pb-4 flex flex-col items-center">
        <div
          className={`w-44 h-44 rounded-2xl bg-gradient-to-br ${track.coverGradient} shadow-xl flex flex-col items-center justify-center p-4 text-white border border-white/10`}
        >
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-2">
            {os.musicPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </div>
          <p className="text-xs font-semibold text-center">{track.album}</p>
        </div>

        <div className="text-center mt-4">
          <h2 className="text-base font-bold">{track.title}</h2>
          <p className="text-xs opacity-65 mt-0.5">{track.artist}</p>
        </div>

        {/* Scrubber */}
        <div className="w-full mt-4">
          <input
            type="range"
            min={0}
            max={track.durationSec}
            value={os.musicElapsed}
            onChange={(e) => os.setMusicElapsed(Number(e.target.value))}
            className="w-full accent-rose-500 h-1.5"
          />
          <div className="flex justify-between text-[10px] opacity-55 font-mono tabular-nums mt-1">
            <span>{fmt(os.musicElapsed)}</span>
            <span>{fmt(track.durationSec)}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-6 mt-3">
          <button
            onClick={() => {
              os.setMusicTrackIndex((i) => (i - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length);
              os.setMusicElapsed(0);
            }}
            className="p-2 opacity-80 hover:opacity-100"
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={() => os.setMusicPlaying((p) => !p)}
            className="w-13 h-13 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
            aria-label={os.musicPlaying ? 'Pause' : 'Play'}
          >
            {os.musicPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button
            onClick={() => {
              os.setMusicTrackIndex((i) => (i + 1) % MUSIC_TRACKS.length);
              os.setMusicElapsed(0);
            }}
            className="p-2 opacity-80 hover:opacity-100"
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Queue */}
      <div className="flex-1 overflow-y-auto phone-scroll px-4 pb-4 space-y-1.5">
        <p className="text-[11px] font-semibold opacity-55 mb-1">Up Next</p>
        {MUSIC_TRACKS.map((t, idx) => (
          <button
            key={t.id}
            onClick={() => {
              os.setMusicTrackIndex(idx);
              os.setMusicElapsed(0);
              os.setMusicPlaying(true);
            }}
            className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left text-xs transition ${
              idx === os.musicTrackIndex
                ? 'bg-rose-600/20 text-rose-400 font-semibold'
                : dark
                  ? 'bg-slate-900 hover:bg-slate-800'
                  : 'bg-white hover:bg-slate-100'
            }`}
          >
            <span className="truncate">{t.title} · {t.artist}</span>
            <span className="font-mono tabular-nums opacity-60">{fmt(t.durationSec)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- YOUTUBE APP ---------------- */
const SAMPLE_VIDEOS = [
  {
    id: 'v1',
    title: 'Inside Grade-5 Titanium Milling',
    channel: 'Atelier Hardware',
    views: '420K views · 2 days ago',
    duration: '08:14',
    accent: '#38bdf8',
    likes: 18200,
  },
  {
    id: 'v2',
    title: 'Coastal Basalt Cliffs in 4K HDR',
    channel: 'Nordic Cinema',
    views: '1.1M views · 1 week ago',
    duration: '12:40',
    accent: '#34d399',
    likes: 54000,
  },
  {
    id: 'v3',
    title: 'Building Responsive 3D Web Interfaces',
    channel: 'ShaderCraft',
    views: '185K views · 5 days ago',
    duration: '15:08',
    accent: '#f59e0b',
    likes: 9400,
  },
];

export const YouTubeApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dark = os.state.settings.darkMode;

  const activeVideo = SAMPLE_VIDEOS.find((v) => v.id === activeId) ?? null;

  useEffect(() => {
    if (!activeVideo || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    const render = () => {
      if (playing) t += 0.03;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.strokeStyle = activeVideo.accent;
        ctx.globalAlpha = 0.25 + i * 0.1;
        ctx.lineWidth = 2;
        for (let x = 0; x <= canvas.width; x += 8) {
          const y =
            canvas.height / 2 +
            Math.sin(x * 0.025 + t + i * 0.6) * (20 + i * 6) * Math.cos(t * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [activeVideo, playing]);

  if (os.state.settings.airplaneMode) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-6 text-center ${dark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
        <WifiOff className="w-9 h-9 text-slate-400 mb-3" />
        <p className="text-sm font-semibold">You’re Offline</p>
        <p className="text-xs opacity-60 mt-1">Turn off Airplane Mode in Control Center or Settings to stream videos.</p>
      </div>
    );
  }

  if (activeVideo) {
    const liked = Boolean(likedIds[activeVideo.id]);
    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
        <div className="relative bg-black">
          <canvas ref={canvasRef} width={360} height={202} className="w-full aspect-video block" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent text-white">
            <button onClick={() => setPlaying((p) => !p)} className="p-1.5 rounded-lg bg-white/15">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-[11px] font-mono">{activeVideo.duration}</span>
          </div>
          <button
            onClick={() => setActiveId(null)}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto phone-scroll flex-1">
          <h2 className="text-sm font-bold leading-snug">{activeVideo.title}</h2>
          <p className="text-xs opacity-60">{activeVideo.channel} · {activeVideo.views}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLikedIds((l) => ({ ...l, [activeVideo.id]: !l[activeVideo.id] }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                liked ? 'bg-red-600 text-white' : 'bg-slate-500/15'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {(activeVideo.likes + (liked ? 1 : 0)).toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <div className="w-6 h-4 rounded bg-red-600 flex items-center justify-center">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
        <h1 className="text-base font-bold">YouTube</h1>
      </div>
      <div className="flex-1 overflow-y-auto phone-scroll px-3 space-y-3 pb-4">
        {SAMPLE_VIDEOS.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              setActiveId(v.id);
              setPlaying(true);
            }}
            className={`w-full rounded-xl overflow-hidden text-left transition ${
              dark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white shadow-sm hover:bg-slate-100'
            }`}
          >
            <div className="h-32 bg-slate-900 relative flex items-center justify-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: v.accent }}
              >
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                {v.duration}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold leading-snug">{v.title}</p>
              <p className="text-[11px] opacity-60 mt-1">{v.channel} · {v.views}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- BROWSER APP ---------------- */
const WEB_PAGES: Record<string, { title: string; subtitle: string; sections: { heading: string; text: string }[] }> = {
  'aether://start': {
    title: 'Aether Web Start',
    subtitle: 'Fast integrated mobile browser',
    sections: [
      { heading: 'Featured Bookmarks', text: 'Tap any quick link below to explore simulated web portals inside your 3D smartphone.' },
      { heading: 'Privacy & Speed', text: 'Zero trackers, hardware-accelerated rendering, and instant offline detection.' },
    ],
  },
  'news.daily': {
    title: 'Daily Chronicle',
    subtitle: 'Technology · Architecture · Science',
    sections: [
      { heading: 'Next-Gen Titanium Alloys Enter Consumer Devices', text: 'Precision CNC machining combined with PVD coatings delivers lighter frames with higher scratch resistance.' },
      { heading: 'Real-Time WebGL Reaches Mobile Parity', text: 'Modern browsers now render complex physically-based studio materials directly in standard tabs.' },
    ],
  },
  'wiki.atlas': {
    title: 'Atlas Encyclopedia',
    subtitle: 'Open Reference Portal',
    sections: [
      { heading: 'Smartphone Operating Systems', text: 'Modern mobile OS platforms coordinate touch input, power management, camera pipelines, and persistent application sandboxes.' },
      { heading: 'LiDAR & Optical Arrays', text: 'Multi-element lenses focus light onto high-sensitivity CMOS sensors using anti-reflective sapphire elements.' },
    ],
  },
  'dev.docs': {
    title: 'Web Platform Docs',
    subtitle: 'MediaDevices · WebAudio · Storage',
    sections: [
      { heading: 'navigator.mediaDevices.getUserMedia()', text: 'Provides user-consented live video and audio streams directly inside browser applications.' },
      { heading: 'Web Audio API', text: 'Synthesizes low-latency soundscapes, UI feedback, and music directly in JavaScript.' },
    ],
  },
};

export const BrowserApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [history, setHistory] = useState<string[]>(['aether://start']);
  const [histIdx, setHistIdx] = useState(0);
  const [urlInput, setUrlInput] = useState('aether://start');
  const dark = os.state.settings.darkMode;

  const currentUrl = history[histIdx];
  const page = WEB_PAGES[currentUrl] ?? {
    title: `Search: ${currentUrl}`,
    subtitle: 'Aether Search Results',
    sections: [
      { heading: `Results for "${currentUrl}"`, text: 'Try visiting news.daily, wiki.atlas, or dev.docs using the bookmarks or address bar.' },
    ],
  };

  const navigate = (url: string) => {
    const clean = url.trim().toLowerCase() || 'aether://start';
    playTapSound(os.state.settings.volume, os.state.settings.muted);
    const next = [...history.slice(0, histIdx + 1), clean];
    setHistory(next);
    setHistIdx(next.length - 1);
    setUrlInput(clean);
  };

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Address Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(urlInput);
        }}
        className={`p-2.5 border-b flex items-center gap-1.5 ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}
      >
        <button
          type="button"
          disabled={histIdx === 0}
          onClick={() => {
            const nextIdx = histIdx - 1;
            setHistIdx(nextIdx);
            setUrlInput(history[nextIdx]);
          }}
          className="p-1.5 rounded-lg disabled:opacity-30"
          aria-label="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={histIdx >= history.length - 1}
          onClick={() => {
            const nextIdx = histIdx + 1;
            setHistIdx(nextIdx);
            setUrlInput(history[nextIdx]);
          }}
          className="p-1.5 rounded-lg disabled:opacity-30"
          aria-label="Forward"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <div className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
          />
        </div>
        <button type="submit" className="p-1.5 rounded-lg hover:bg-slate-500/15" aria-label="Reload">
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </form>

      {os.state.settings.airplaneMode ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <WifiOff className="w-8 h-8 text-slate-400 mb-3" />
          <p className="text-sm font-semibold">No Internet Connection</p>
          <p className="text-xs opacity-60 mt-1">Disable Airplane Mode to browse web pages.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto phone-scroll p-4 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(WEB_PAGES).map((link) => (
              <button
                key={link}
                onClick={() => navigate(link)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 ${
                  currentUrl === link
                    ? 'bg-indigo-600 text-white'
                    : dark
                      ? 'bg-slate-900 text-slate-300'
                      : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                {link.replace('aether://', '')}
              </button>
            ))}
          </div>

          <div className={`p-4 rounded-2xl ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
            <h2 className="text-base font-bold">{page.title}</h2>
            <p className="text-xs text-indigo-400 mt-0.5">{page.subtitle}</p>
            <div className="mt-4 space-y-3">
              {page.sections.map((s) => (
                <div key={s.heading} className="pt-3 border-t border-slate-500/15">
                  <h3 className="text-xs font-semibold">{s.heading}</h3>
                  <p className="text-xs opacity-70 mt-1 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
