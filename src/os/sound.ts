import { MusicTrack, NotificationToneName, RingtoneName } from './types';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainVal), now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playTapSound(volume = 70, muted = false) {
  if (muted || volume <= 0) return;
  const g = (volume / 100) * 0.04;
  playTone(620, 0.035, 'triangle', g);
}

export function playLockSound(volume = 70, muted = false) {
  if (muted || volume <= 0) return;
  const g = (volume / 100) * 0.06;
  playTone(440, 0.05, 'sine', g, 0);
  playTone(280, 0.07, 'sine', g * 0.8, 0.04);
}

export function playUnlockSound(volume = 70, muted = false) {
  if (muted || volume <= 0) return;
  const g = (volume / 100) * 0.06;
  playTone(520, 0.06, 'sine', g, 0);
  playTone(760, 0.09, 'sine', g, 0.05);
}

export function playShutterSound(volume = 70, muted = false) {
  if (muted || volume <= 0) return;
  const g = (volume / 100) * 0.09;
  playTone(1200, 0.025, 'square', g * 0.5, 0);
  playTone(320, 0.04, 'triangle', g, 0.03);
}

export function playDtmfTone(digit: string, volume = 70, muted = false) {
  if (muted || volume <= 0) return;
  const map: Record<string, [number, number]> = {
    '1': [697, 1209],
    '2': [697, 1336],
    '3': [697, 1477],
    '4': [770, 1209],
    '5': [770, 1336],
    '6': [770, 1477],
    '7': [852, 1209],
    '8': [852, 1336],
    '9': [852, 1477],
    '*': [941, 1209],
    '0': [941, 1336],
    '#': [941, 1477],
  };
  const pair = map[digit];
  if (!pair) return;
  const g = (volume / 100) * 0.05;
  playTone(pair[0], 0.12, 'sine', g);
  playTone(pair[1], 0.12, 'sine', g);
}

export function playNotificationSound(tone: NotificationToneName, volume = 70, muted = false) {
  if (muted || volume <= 0) return;
  const g = (volume / 100) * 0.08;
  switch (tone) {
    case 'Droplet':
      playTone(660, 0.12, 'sine', g, 0);
      playTone(880, 0.18, 'sine', g, 0.09);
      break;
    case 'Crystal':
      playTone(1046, 0.14, 'triangle', g, 0);
      playTone(1318, 0.22, 'sine', g, 0.1);
      break;
    case 'Soft Tap':
      playTone(520, 0.08, 'sine', g, 0);
      break;
    case 'Beacon':
      playTone(784, 0.1, 'sine', g, 0);
      playTone(987, 0.1, 'sine', g, 0.12);
      playTone(1174, 0.18, 'sine', g, 0.24);
      break;
  }
}

export function playRingtonePreview(ringtone: RingtoneName, volume = 70, muted = false) {
  if (muted || volume <= 0) return;
  const g = (volume / 100) * 0.08;
  const patterns: Record<RingtoneName, number[]> = {
    'Apex Chime': [523, 659, 784, 1046],
    'Pulse Wave': [440, 554, 659, 880],
    'Velvet Bell': [587, 740, 880, 740],
    Horizon: [493, 659, 740, 987],
  };
  patterns[ringtone].forEach((f, idx) => {
    playTone(f, 0.18, 'sine', g, idx * 0.14);
  });
}

export function playAlarmChime(volume = 70, muted = false) {
  if (muted || volume <= 0) return;
  const g = (volume / 100) * 0.1;
  [880, 1046, 880, 1046].forEach((f, i) => {
    playTone(f, 0.14, 'triangle', g, i * 0.16);
  });
}

// Procedural Music Player Synthesizer
class ProceduralMusicEngine {
  private intervalId: number | null = null;
  private step = 0;
  private currentTrack: MusicTrack | null = null;
  private volume = 70;
  private muted = false;

  setAudioLevel(volume: number, muted: boolean) {
    this.volume = volume;
    this.muted = muted;
  }

  start(track: MusicTrack) {
    this.stop();
    this.currentTrack = track;
    this.step = 0;
    const playStep = () => {
      if (!this.currentTrack) return;
      if (!this.muted && this.volume > 0) {
        const note = this.currentTrack.notes[this.step % this.currentTrack.notes.length];
        const bass = note / 2;
        const g = (this.volume / 100) * 0.055;
        playTone(note, 0.35, 'sine', g);
        if (this.step % 2 === 0) {
          playTone(bass, 0.45, 'triangle', g * 0.7);
        }
      }
      this.step += 1;
    };
    playStep();
    this.intervalId = window.setInterval(playStep, track.tempoMs);
  }

  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const musicEngine = new ProceduralMusicEngine();
