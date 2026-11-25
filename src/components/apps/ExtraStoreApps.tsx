import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
} from 'lucide-react';
import { playAlarmChime } from '../../os/sound';
import { PhoneOSController } from '../../os/usePhoneOS';

/* ---------------- PULSE SOCIAL ---------------- */
export const PulseSocialApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [draft, setDraft] = useState('');
  const dark = os.state.settings.darkMode;

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    os.addPulsePost(draft.trim());
    setDraft('');
  };

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 border-b border-slate-500/15">
        <h1 className="text-lg font-bold text-pink-500">Pulse</h1>
      </div>

      <form onSubmit={handlePost} className="p-3 border-b border-slate-500/15 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share a quick update..."
          className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
        />
        <button type="submit" className="px-3 rounded-xl bg-pink-600 text-white">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto phone-scroll p-3 space-y-2.5">
        {os.state.pulsePosts.map((p) => (
          <div key={p.id} className={`p-3.5 rounded-2xl ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">{p.author} <span className="font-normal opacity-50">{p.handle}</span></span>
              <span className="text-[10px] opacity-50">{p.time}</span>
            </div>
            <p className="text-xs mt-1.5 leading-relaxed opacity-90">{p.content}</p>
            <button
              onClick={() => os.togglePulseLike(p.id)}
              className={`mt-2.5 flex items-center gap-1 text-xs ${p.liked ? 'text-pink-500 font-semibold' : 'opacity-60'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${p.liked ? 'fill-pink-500' : ''}`} />
              <span className="font-mono tabular-nums">{p.likes}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- FOCUS TIMER ---------------- */
export const FocusTimerApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          playAlarmChime(os.state.settings.volume, os.state.settings.muted);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, os.state.settings.volume, os.state.settings.muted]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="h-full bg-teal-950 text-white flex flex-col items-center justify-between p-6">
      <div className="flex gap-2 bg-white/10 p-1 rounded-xl text-xs">
        <button
          onClick={() => {
            setMode('focus');
            setRunning(false);
            setSeconds(25 * 60);
          }}
          className={`px-3 py-1 rounded-lg ${mode === 'focus' ? 'bg-teal-500 text-slate-950 font-semibold' : ''}`}
        >
          Focus 25m
        </button>
        <button
          onClick={() => {
            setMode('break');
            setRunning(false);
            setSeconds(5 * 60);
          }}
          className={`px-3 py-1 rounded-lg ${mode === 'break' ? 'bg-teal-500 text-slate-950 font-semibold' : ''}`}
        >
          Break 5m
        </button>
      </div>

      <div className="w-52 h-52 rounded-full border-4 border-teal-400/40 flex flex-col items-center justify-center">
        <span className="text-4xl font-mono tabular-nums font-semibold">{fmt(seconds)}</span>
        <span className="text-xs text-teal-300 mt-1 capitalize">{mode} Session</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setRunning(false);
            setSeconds(mode === 'focus' ? 25 * 60 : 5 * 60);
          }}
          className="p-3 rounded-xl bg-white/10"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-7 py-3 rounded-xl bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? 'Pause' : 'Start Focus'}
        </button>
      </div>
    </div>
  );
};

/* ---------------- LINGOCARDS (EDUCATION) ---------------- */
const DECK = [
  { front: 'Luminescence', back: 'Emission of light not caused by heat (cold light).' },
  { front: 'Anisotropy', back: 'Directional dependence of a surface or material property.' },
  { front: 'Quaternion', back: 'Four-component hypercomplex number used for smooth 3D rotation.' },
  { front: 'Parallax', back: 'Apparent shift in an object’s position from two viewing angles.' },
];

export const FlashcardsApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<number[]>([]);
  const dark = os.state.settings.darkMode;

  const card = DECK[idx];

  return (
    <div className={`h-full flex flex-col justify-between p-5 ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-400">LingoCards</h1>
        <span className="text-xs font-mono opacity-60">
          {mastered.length}/{DECK.length} mastered
        </span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className={`h-64 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition ${
          flipped
            ? 'bg-indigo-600 text-white'
            : dark
              ? 'bg-slate-900 border border-slate-800'
              : 'bg-white shadow-md'
        }`}
      >
        <span className="text-[10px] uppercase tracking-widest opacity-55 mb-3">
          {flipped ? 'Definition' : 'Tap to reveal'}
        </span>
        <p className={flipped ? 'text-sm leading-relaxed' : 'text-xl font-bold'}>{flipped ? card.back : card.front}</p>
      </button>

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!mastered.includes(idx)) setMastered((m) => [...m, idx]);
            setFlipped(false);
            setIdx((i) => (i + 1) % DECK.length);
          }}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
        >
          Got It
        </button>
        <button
          onClick={() => {
            setFlipped(false);
            setIdx((i) => (i + 1) % DECK.length);
          }}
          className="flex-1 py-2.5 rounded-xl bg-slate-500/20 text-xs font-semibold"
        >
          Next Card
        </button>
      </div>
    </div>
  );
};

/* ---------------- AURA HABITS (LIFESTYLE) ---------------- */
export const HabitsApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [title, setTitle] = useState('');
  const dark = os.state.settings.darkMode;

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-lg font-bold text-emerald-500">Aura Habits</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          os.addHabit(title.trim());
          setTitle('');
        }}
        className="px-4 pb-3 flex gap-2"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New daily habit..."
          className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
        />
        <button type="submit" className="px-3 rounded-xl bg-emerald-600 text-white">
          <Plus className="w-4 h-4" />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto phone-scroll px-4 space-y-2 pb-4">
        {os.state.habits.map((h) => (
          <button
            key={h.id}
            onClick={() => os.toggleHabit(h.id)}
            className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left ${
              dark ? 'bg-slate-900' : 'bg-white shadow-sm'
            }`}
          >
            <div>
              <p className={`text-xs font-semibold ${h.completedToday ? 'line-through opacity-55' : ''}`}>
                {h.title}
              </p>
              <p className="text-[11px] opacity-60 font-mono">{h.streak} day streak</p>
            </div>
            <CheckCircle2 className={`w-5 h-5 ${h.completedToday ? 'text-emerald-500' : 'opacity-25'}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- OMNICONVERT (UTILITIES) ---------------- */
export const UnitConverterApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [cat, setCat] = useState<'length' | 'weight' | 'temp'>('length');
  const [val, setVal] = useState('10');
  const dark = os.state.settings.darkMode;

  const n = parseFloat(val) || 0;

  const outputs =
    cat === 'length'
      ? [
          { unit: 'Meters', v: n.toFixed(2) },
          { unit: 'Kilometers', v: (n / 1000).toFixed(4) },
          { unit: 'Feet', v: (n * 3.28084).toFixed(2) },
          { unit: 'Miles', v: (n * 0.00062137).toFixed(4) },
        ]
      : cat === 'weight'
        ? [
            { unit: 'Kilograms', v: n.toFixed(2) },
            { unit: 'Grams', v: (n * 1000).toFixed(0) },
            { unit: 'Pounds', v: (n * 2.20462).toFixed(2) },
            { unit: 'Ounces', v: (n * 35.274).toFixed(2) },
          ]
        : [
            { unit: 'Celsius', v: `${n.toFixed(1)} °C` },
            { unit: 'Fahrenheit', v: `${((n * 9) / 5 + 32).toFixed(1)} °F` },
            { unit: 'Kelvin', v: `${(n + 273.15).toFixed(1)} K` },
          ];

  return (
    <div className={`h-full flex flex-col p-4 space-y-4 ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <h1 className="text-lg font-bold text-cyan-400">OmniConvert</h1>
      <div className="grid grid-cols-3 gap-1.5 text-xs">
        {(['length', 'weight', 'temp'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`py-2 rounded-xl capitalize font-medium ${
              cat === c ? 'bg-cyan-600 text-white' : 'bg-slate-500/15'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div>
        <label className="text-[11px] opacity-60 block mb-1">
          Input ({cat === 'length' ? 'Meters' : cat === 'weight' ? 'Kilograms' : 'Celsius'})
        </label>
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className={`w-full px-3.5 py-3 rounded-2xl text-xl font-mono outline-none ${
            dark ? 'bg-slate-900' : 'bg-white border border-slate-200'
          }`}
        />
      </div>

      <div className="space-y-2">
        {outputs.map((o) => (
          <div
            key={o.unit}
            className={`p-3 rounded-2xl flex items-center justify-between ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}
          >
            <span className="text-xs opacity-70">{o.unit}</span>
            <span className="text-sm font-mono tabular-nums font-bold">{o.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
