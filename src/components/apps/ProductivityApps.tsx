import React, { useEffect, useState } from 'react';
import {
  AlarmClock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Globe,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sun,
  Timer as TimerIcon,
  Trash2,
  Watch,
  WifiOff,
  Wind,
} from 'lucide-react';
import { PhoneOSController } from '../../os/usePhoneOS';

/* ---------------- CALENDAR APP ---------------- */
export const CalendarApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const dark = os.state.settings.darkMode;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const dayEvents = os.state.events.filter((e) => e.date === selectedDate);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    os.addEvent({
      date: selectedDate,
      time: newTime,
      title: newTitle.trim(),
      color: 'bg-orange-500',
    });
    setNewTitle('');
  };

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-base font-bold">{monthLabel}</h1>
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (month === 0) {
                setMonth(11);
                setYear((y) => y - 1);
              } else setMonth((m) => m - 1);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-500/15"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (month === 11) {
                setMonth(0);
                setYear((y) => y + 1);
              } else setMonth((m) => m + 1);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-500/15"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-3">
        <div className="grid grid-cols-7 text-center text-[10px] opacity-50 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const hasEvent = os.state.events.some((ev) => ev.date === dateStr);
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-8 rounded-lg flex flex-col items-center justify-center relative font-mono tabular-nums transition ${
                  isSelected
                    ? 'bg-orange-600 text-white font-bold'
                    : dark
                      ? 'hover:bg-slate-800'
                      : 'hover:bg-slate-200'
                }`}
              >
                <span>{day}</span>
                {hasEvent && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-1 ${
                      isSelected ? 'bg-white' : 'bg-orange-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll p-3 mt-2 space-y-2 border-t border-slate-500/15">
        <p className="text-[11px] font-semibold opacity-60">Events · {selectedDate}</p>
        {dayEvents.length === 0 && (
          <p className="text-xs opacity-45 py-2">No events scheduled for this day.</p>
        )}
        {dayEvents.map((ev) => (
          <div
            key={ev.id}
            className={`p-2.5 rounded-xl flex items-center justify-between ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-6 rounded-full ${ev.color}`} />
              <div>
                <p className="text-xs font-semibold">{ev.title}</p>
                <p className="text-[10px] opacity-60 font-mono tabular-nums">{ev.time}</p>
              </div>
            </div>
            <button
              onClick={() => os.deleteEvent(ev.id)}
              className="p-1 text-red-400 hover:bg-red-500/10 rounded"
              aria-label="Delete event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="p-3 border-t border-slate-500/15 flex gap-1.5">
        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className={`px-2 py-1.5 rounded-lg text-xs font-mono outline-none ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
        />
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New event..."
          className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
        />
        <button type="submit" className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold">
          Add
        </button>
      </form>
    </div>
  );
};

/* ---------------- NOTES APP ---------------- */
export const NotesApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const dark = os.state.settings.darkMode;

  const active = os.state.notes.find((n) => n.id === selectedId) ?? null;

  if (active) {
    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-amber-50/40 text-slate-900'}`}>
        <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-500/15">
          <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-slate-500/15 flex items-center gap-1 text-xs font-medium text-amber-500">
            <ArrowLeft className="w-4 h-4" />
            Notes
          </button>
          <button
            onClick={() => {
              os.deleteNote(active.id);
              setSelectedId(null);
            }}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15"
            aria-label="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-2">
          <input
            value={active.title}
            onChange={(e) => os.saveNote({ id: active.id, title: e.target.value })}
            placeholder="Title"
            className="text-base font-bold bg-transparent outline-none"
          />
          <textarea
            value={active.content}
            onChange={(e) => os.saveNote({ id: active.id, content: e.target.value })}
            placeholder="Start typing..."
            className="flex-1 bg-transparent text-xs leading-relaxed outline-none resize-none"
          />
        </div>
      </div>
    );
  }

  const filtered = os.state.notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">Notes</h1>
        <button
          onClick={() => {
            os.saveNote({ title: 'New Note', content: '' });
          }}
          className="p-1.5 rounded-lg bg-amber-500 text-slate-950"
          aria-label="Create note"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 pb-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}>
          <Search className="w-3.5 h-3.5 opacity-50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 bg-transparent text-xs outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto phone-scroll px-3 space-y-2 pb-4">
        {filtered.map((n) => (
          <button
            key={n.id}
            onClick={() => setSelectedId(n.id)}
            className={`w-full p-3 rounded-xl text-left transition ${dark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white shadow-sm hover:bg-slate-100'}`}
          >
            <p className="text-xs font-semibold truncate">{n.title || 'Untitled'}</p>
            <p className="text-[11px] opacity-60 truncate mt-0.5">{n.content || 'Empty note'}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- CALCULATOR APP ---------------- */
export const CalculatorApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const dark = os.state.settings.darkMode;

  const inputDigit = (d: string) => {
    if (fresh) {
      setDisplay(d === '.' ? '0.' : d);
      setFresh(false);
    } else {
      if (d === '.' && display.includes('.')) return;
      setDisplay(display === '0' && d !== '.' ? d : display + d);
    }
  };

  const compute = (a: number, b: number, operator: string) => {
    switch (operator) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const handleOp = (nextOp: string) => {
    const cur = parseFloat(display);
    if (prevVal !== null && op && !fresh) {
      const res = compute(prevVal, cur, op);
      const formatted = Number.isNaN(res) ? 'Error' : String(Number(res.toFixed(8)));
      setDisplay(formatted);
      setPrevVal(Number.isNaN(res) ? null : res);
    } else {
      setPrevVal(cur);
    }
    setOp(nextOp);
    setFresh(true);
  };

  const handleEquals = () => {
    if (prevVal === null || !op) return;
    const cur = parseFloat(display);
    const res = compute(prevVal, cur, op);
    const formatted = Number.isNaN(res) ? 'Error' : String(Number(res.toFixed(8)));
    setHistory((h) => [`${prevVal} ${op} ${cur} = ${formatted}`, ...h].slice(0, 4));
    setDisplay(formatted);
    setPrevVal(null);
    setOp(null);
    setFresh(true);
  };

  const buttons = [
    ['AC', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '√', '='],
  ];

  return (
    <div className={`h-full flex flex-col justify-between p-4 ${dark ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="space-y-1 text-right pt-2">
        <div className="h-12 overflow-hidden flex flex-col justify-end text-[11px] opacity-45 font-mono tabular-nums">
          {history.slice(0, 2).map((item, i) => (
            <div key={i} className="truncate">{item}</div>
          ))}
        </div>
        <div className="text-4xl font-light font-mono tabular-nums tracking-tight truncate py-2">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 pb-2">
        {buttons.flat().map((btn) => {
          const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
          const isTop = ['AC', '±', '%'].includes(btn);
          return (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'AC') {
                  setDisplay('0');
                  setPrevVal(null);
                  setOp(null);
                  setFresh(true);
                } else if (btn === '±') {
                  setDisplay((d) => String(parseFloat(d) * -1));
                } else if (btn === '%') {
                  setDisplay((d) => String(parseFloat(d) / 100));
                } else if (btn === '√') {
                  const val = parseFloat(display);
                  setDisplay(val < 0 ? 'Error' : String(Number(Math.sqrt(val).toFixed(8))));
                  setFresh(true);
                } else if (btn === '=') {
                  handleEquals();
                } else if (['÷', '×', '-', '+'].includes(btn)) {
                  handleOp(btn);
                } else {
                  inputDigit(btn);
                }
              }}
              className={`h-14 rounded-2xl text-lg font-medium active:scale-95 transition flex items-center justify-center ${
                isOperator
                  ? op === btn && fresh
                    ? 'bg-white text-amber-500'
                    : 'bg-amber-500 text-white hover:bg-amber-400'
                  : isTop
                    ? dark
                      ? 'bg-zinc-700 text-white'
                      : 'bg-slate-300 text-slate-900'
                    : dark
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'bg-white text-slate-900 shadow-sm'
              }`}
            >
              {btn}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- CLOCK APP ---------------- */
export const ClockApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [tab, setTab] = useState<'world' | 'alarm' | 'stopwatch' | 'timer'>('alarm');
  const [newAlarmTime, setNewAlarmTime] = useState('07:30');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [swMs, setSwMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const dark = os.state.settings.darkMode;

  useEffect(() => {
    if (!swRunning) return;
    const start = Date.now() - swMs;
    const id = window.setInterval(() => setSwMs(Date.now() - start), 50);
    return () => window.clearInterval(id);
  }, [swRunning]);

  const fmtSw = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const fmtTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const worldZones = [
    { city: 'San Francisco', tz: 'America/Los_Angeles' },
    { city: 'New York', tz: 'America/New_York' },
    { city: 'London', tz: 'Europe/London' },
    { city: 'Tokyo', tz: 'Asia/Tokyo' },
  ];

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-lg font-bold mb-2">Clock</h1>
        <div className="grid grid-cols-4 gap-1 bg-slate-500/15 p-1 rounded-xl text-[11px] font-medium">
          {[
            { id: 'world', label: 'World', icon: Globe },
            { id: 'alarm', label: 'Alarm', icon: AlarmClock },
            { id: 'stopwatch', label: 'Stop', icon: Watch },
            { id: 'timer', label: 'Timer', icon: TimerIcon },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition ${
                  tab === item.id
                    ? dark
                      ? 'bg-slate-800 text-sky-400'
                      : 'bg-white text-sky-600 shadow-sm'
                    : 'opacity-65'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll p-4">
        {tab === 'world' && (
          <div className="space-y-2.5">
            {worldZones.map((z) => {
              const t = new Date().toLocaleTimeString([], {
                timeZone: z.tz,
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={z.city}
                  className={`p-3.5 rounded-2xl flex items-center justify-between ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}
                >
                  <span className="text-sm font-semibold">{z.city}</span>
                  <span className="text-xl font-mono tabular-nums">{t}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'alarm' && (
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                os.addAlarm(newAlarmTime, newAlarmLabel);
                setNewAlarmLabel('');
              }}
              className="flex gap-1.5"
            >
              <input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                className={`px-2.5 py-2 rounded-xl text-xs font-mono ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
              />
              <input
                value={newAlarmLabel}
                onChange={(e) => setNewAlarmLabel(e.target.value)}
                placeholder="Label"
                className={`flex-1 px-2.5 py-2 rounded-xl text-xs ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
              />
              <button type="submit" className="px-3 rounded-xl bg-sky-600 text-white text-xs font-semibold">
                Add
              </button>
            </form>

            {os.state.alarms.map((a) => (
              <div
                key={a.id}
                className={`p-3.5 rounded-2xl flex items-center justify-between ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}
              >
                <div>
                  <p className="text-2xl font-mono tabular-nums font-semibold">{a.time}</p>
                  <p className="text-xs opacity-60">{a.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => os.toggleAlarm(a.id)}
                    className={`w-11 h-6 rounded-full p-0.5 transition ${a.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        a.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => os.deleteAlarm(a.id)}
                    className="p-1 text-red-400"
                    aria-label="Delete alarm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'stopwatch' && (
          <div className="flex flex-col items-center pt-4">
            <div className="text-4xl font-mono tabular-nums font-light py-6">{fmtSw(swMs)}</div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (swRunning) setLaps((l) => [swMs, ...l]);
                  else {
                    setSwMs(0);
                    setLaps([]);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-500/20 text-xs font-semibold"
              >
                {swRunning ? 'Lap' : 'Reset'}
              </button>
              <button
                onClick={() => setSwRunning((r) => !r)}
                className={`px-6 py-2 rounded-xl text-xs font-semibold text-white ${
                  swRunning ? 'bg-red-600' : 'bg-emerald-600'
                }`}
              >
                {swRunning ? 'Stop' : 'Start'}
              </button>
            </div>
            <div className="w-full mt-5 space-y-1.5">
              {laps.map((l, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs font-mono tabular-nums px-3 py-1.5 rounded-lg bg-slate-500/10"
                >
                  <span>Lap {laps.length - i}</span>
                  <span>{fmtSw(l)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'timer' && (
          <div className="flex flex-col items-center pt-4">
            <div className="text-5xl font-mono tabular-nums font-light py-6">
              {fmtTimer(os.timer.remainingSeconds)}
            </div>
            <div className="flex gap-2 mb-5">
              {[60, 180, 300, 600].map((sec) => (
                <button
                  key={sec}
                  onClick={() =>
                    os.setTimer({ totalSeconds: sec, remainingSeconds: sec, running: false })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-500/15 text-xs font-mono"
                >
                  {sec / 60}m
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  os.setTimer((t) => ({ ...t, remainingSeconds: t.totalSeconds, running: false }))
                }
                className="p-3 rounded-xl bg-slate-500/20"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  os.setTimer((t) => ({
                    ...t,
                    remainingSeconds: t.remainingSeconds === 0 ? t.totalSeconds : t.remainingSeconds,
                    running: !t.running,
                  }))
                }
                className={`px-6 py-3 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 ${
                  os.timer.running ? 'bg-amber-600' : 'bg-emerald-600'
                }`}
              >
                {os.timer.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {os.timer.running ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- WEATHER APP ---------------- */
const WEATHER_CITIES = [
  {
    city: 'San Francisco',
    temp: 19,
    cond: 'Partly Cloudy',
    high: 21,
    low: 13,
    humidity: '64%',
    wind: '18 km/h',
    uv: '5 Moderate',
    icon: CloudSun,
    gradient: 'from-sky-900 via-slate-900 to-slate-950',
    hourly: [
      { h: 'Now', t: 19 },
      { h: '14:00', t: 21 },
      { h: '16:00', t: 20 },
      { h: '18:00', t: 17 },
      { h: '20:00', t: 15 },
    ],
  },
  {
    city: 'Tokyo',
    temp: 24,
    cond: 'Clear Sky',
    high: 26,
    low: 17,
    humidity: '52%',
    wind: '11 km/h',
    uv: '7 High',
    icon: Sun,
    gradient: 'from-blue-800 via-indigo-950 to-slate-950',
    hourly: [
      { h: 'Now', t: 24 },
      { h: '14:00', t: 26 },
      { h: '16:00', t: 25 },
      { h: '18:00', t: 22 },
      { h: '20:00', t: 19 },
    ],
  },
  {
    city: 'London',
    temp: 14,
    cond: 'Light Rain',
    high: 16,
    low: 10,
    humidity: '81%',
    wind: '22 km/h',
    uv: '2 Low',
    icon: CloudRain,
    gradient: 'from-slate-700 via-slate-900 to-black',
    hourly: [
      { h: 'Now', t: 14 },
      { h: '14:00', t: 15 },
      { h: '16:00', t: 14 },
      { h: '18:00', t: 12 },
      { h: '20:00', t: 11 },
    ],
  },
];

export const WeatherApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [cityIdx, setCityIdx] = useState(0);
  const w = WEATHER_CITIES[cityIdx];
  const Icon = w.icon;

  if (os.state.settings.airplaneMode) {
    return (
      <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <WifiOff className="w-8 h-8 text-slate-400 mb-3" />
        <p className="text-sm font-semibold">Weather Unavailable</p>
        <p className="text-xs text-slate-400 mt-1">Turn off Airplane Mode to update live forecasts.</p>
      </div>
    );
  }

  return (
    <div className={`h-full bg-gradient-to-b ${w.gradient} text-white flex flex-col p-4 overflow-y-auto phone-scroll`}>
      <div className="flex gap-1.5 mb-4">
        {WEATHER_CITIES.map((c, idx) => (
          <button
            key={c.city}
            onClick={() => setCityIdx(idx)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              idx === cityIdx ? 'bg-white text-slate-950' : 'bg-white/10 text-white/75'
            }`}
          >
            {c.city}
          </button>
        ))}
      </div>

      <div className="text-center py-4">
        <h1 className="text-xl font-bold">{w.city}</h1>
        <div className="flex items-center justify-center gap-3 my-2">
          <Icon className="w-10 h-10 text-amber-300" />
          <span className="text-5xl font-light font-mono tabular-nums">{w.temp}°</span>
        </div>
        <p className="text-xs text-slate-300">{w.cond} · H:{w.high}° L:{w.low}°</p>
      </div>

      <div className="p-3 rounded-2xl bg-white/10 border border-white/10 mt-2">
        <p className="text-[11px] font-semibold text-slate-300 mb-2">Hourly Forecast</p>
        <div className="grid grid-cols-5 gap-1 text-center">
          {w.hourly.map((hr) => (
            <div key={hr.h} className="py-1">
              <p className="text-[10px] text-slate-300">{hr.h}</p>
              <Cloud className="w-4 h-4 mx-auto my-1.5 text-sky-300" />
              <p className="text-xs font-mono tabular-nums">{hr.t}°</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
          <Droplets className="w-4 h-4 text-sky-300 mb-1" />
          <p className="text-[10px] text-slate-300">Humidity</p>
          <p className="text-sm font-semibold font-mono">{w.humidity}</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
          <Wind className="w-4 h-4 text-teal-300 mb-1" />
          <p className="text-[10px] text-slate-300">Wind</p>
          <p className="text-sm font-semibold font-mono">{w.wind}</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
          <Sun className="w-4 h-4 text-amber-300 mb-1" />
          <p className="text-[10px] text-slate-300">UV Index</p>
          <p className="text-xs font-semibold">{w.uv}</p>
        </div>
      </div>
    </div>
  );
};
