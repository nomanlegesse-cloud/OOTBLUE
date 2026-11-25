import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Delete,
  Inbox,
  Mail as MailIcon,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
  UserPlus,
  Volume2,
} from 'lucide-react';
import { playDtmfTone, playTapSound } from '../../os/sound';
import { PhoneOSController } from '../../os/usePhoneOS';

/* ---------------- PHONE APP ---------------- */
export const PhoneApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [tab, setTab] = useState<'keypad' | 'recents' | 'contacts'>('keypad');
  const [dialed, setDialed] = useState('');
  const [callSeconds, setCallSeconds] = useState(0);
  const dark = os.state.settings.darkMode;

  useEffect(() => {
    if (!os.activeCall) {
      setCallSeconds(0);
      return;
    }
    const id = window.setInterval(() => {
      setCallSeconds(Math.floor((Date.now() - os.activeCall!.startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [os.activeCall]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (os.activeCall) {
    return (
      <div className="h-full flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white px-6 py-10">
        <div className="text-center mt-4">
          <div className="w-20 h-20 rounded-full bg-emerald-600/20 border border-emerald-400/40 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            {os.activeCall.contactName.slice(0, 1).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold">{os.activeCall.contactName}</h2>
          <p className="text-xs text-slate-400 mt-1">{os.activeCall.phone}</p>
          <p className="text-sm text-emerald-400 font-mono tabular-nums mt-3">
            {callSeconds < 2 ? 'Calling...' : formatTimer(callSeconds)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 w-full max-w-[260px]">
          <button
            onClick={() =>
              os.setActiveCall((c) => (c ? { ...c, muted: !c.muted } : c))
            }
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition ${
              os.activeCall.muted ? 'bg-white text-slate-950' : 'bg-white/10 text-white'
            }`}
          >
            {os.activeCall.muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[11px]">Mute</span>
          </button>

          <button
            onClick={() =>
              os.setActiveCall((c) => (c ? { ...c, speaker: !c.speaker } : c))
            }
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition ${
              os.activeCall.speaker ? 'bg-white text-slate-950' : 'bg-white/10 text-white'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-[11px]">Speaker</span>
          </button>

          <button
            onClick={() => os.openApp('contacts')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/10 text-white"
          >
            <PhoneCall className="w-5 h-5" />
            <span className="text-[11px]">Contacts</span>
          </button>
        </div>

        <button
          onClick={os.endCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-900/40 active:scale-95 transition"
          aria-label="End call"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    );
  }

  const keys = [
    ['1', ''],
    ['2', 'ABC'],
    ['3', 'DEF'],
    ['4', 'GHI'],
    ['5', 'JKL'],
    ['6', 'MNO'],
    ['7', 'PQRS'],
    ['8', 'TUV'],
    ['9', 'WXYZ'],
    ['*', ''],
    ['0', '+'],
    ['#', ''],
  ];

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">Phone</h1>
        <div className="flex gap-1 bg-slate-500/15 p-0.5 rounded-lg text-xs">
          {(['keypad', 'recents', 'contacts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition ${
                tab === t
                  ? dark
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'opacity-65'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'keypad' && (
        <div className="flex-1 flex flex-col justify-between px-6 pb-5 pt-2">
          <div className="h-14 flex items-center justify-center relative">
            <span className="text-2xl font-mono tracking-wider tabular-nums truncate max-w-[230px]">
              {dialed || <span className="opacity-25 text-lg">Enter number</span>}
            </span>
            {dialed && (
              <button
                onClick={() => setDialed((d) => d.slice(0, -1))}
                className="absolute right-0 p-2 opacity-60 hover:opacity-100"
                aria-label="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 my-auto">
            {keys.map(([digit, sub]) => (
              <button
                key={digit}
                onClick={() => {
                  playDtmfTone(digit, os.state.settings.volume, os.state.settings.muted);
                  setDialed((d) => (d.length < 16 ? d + digit : d));
                }}
                className={`h-14 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition ${
                  dark ? 'bg-slate-800/80 hover:bg-slate-800' : 'bg-white hover:bg-slate-100 shadow-sm'
                }`}
              >
                <span className="text-xl font-semibold leading-none">{digit}</span>
                {sub && <span className="text-[9px] tracking-widest opacity-50 mt-0.5">{sub}</span>}
              </button>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                const target = dialed || os.state.contacts[0]?.phone || '+1 (415) 890-2314';
                const found = os.state.contacts.find((c) => c.phone === target);
                os.startCall(found?.name || target, target);
              }}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
              aria-label="Start call"
            >
              <Phone className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {tab === 'recents' && (
        <div className="flex-1 overflow-y-auto phone-scroll px-4 py-2 space-y-2">
          {os.state.callHistory.map((item) => (
            <button
              key={item.id}
              onClick={() => os.startCall(item.name, item.number)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition ${
                dark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-slate-100 shadow-sm'
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${item.type === 'missed' ? 'text-red-400' : ''}`}>
                  {item.name}
                </p>
                <p className="text-xs opacity-60 capitalize">
                  {item.type} · {item.number}
                </p>
              </div>
              <span className="text-xs opacity-50 tabular-nums">{item.time}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'contacts' && (
        <div className="flex-1 overflow-y-auto phone-scroll px-4 py-2 space-y-2">
          {os.state.contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => os.startCall(c.name, c.phone)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition ${
                dark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${c.avatarColor} text-white flex items-center justify-center font-bold text-sm`}>
                  {c.name.slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs opacity-60">{c.phone}</p>
                </div>
              </div>
              <Phone className="w-4 h-4 text-emerald-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- MESSAGES APP ---------------- */
export const MessagesApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const dark = os.state.settings.darkMode;

  const activeThread = os.state.threads.find((t) => t.id === selectedId) ?? null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !draft.trim()) return;
    playTapSound(os.state.settings.volume, os.state.settings.muted);
    os.sendMessage(activeThread.id, draft.trim());
    setDraft('');
  };

  if (activeThread) {
    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`px-3 py-2.5 flex items-center gap-2 border-b ${dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}>
          <button
            onClick={() => setSelectedId(null)}
            className="p-1.5 rounded-lg hover:bg-slate-500/15"
            aria-label="Back to threads"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{activeThread.contactName}</p>
            <p className="text-[11px] opacity-60 truncate">{activeThread.phone}</p>
          </div>
          <button
            onClick={() => os.startCall(activeThread.contactName, activeThread.phone)}
            className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
            aria-label="Call contact"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto phone-scroll p-3 space-y-2.5">
          {activeThread.messages.length === 0 && (
            <p className="text-center text-xs opacity-50 mt-10">Start a conversation with {activeThread.contactName}</p>
          )}
          {activeThread.messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'me'
                    ? 'bg-sky-600 text-white rounded-br-sm'
                    : dark
                      ? 'bg-slate-800 text-slate-100 rounded-bl-sm'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] opacity-45 mt-0.5 px-1 tabular-nums">{m.time}</span>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSend}
          className={`p-2.5 border-t flex items-center gap-2 ${dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={os.state.settings.airplaneMode ? 'Airplane Mode On' : 'Text message...'}
            disabled={os.state.settings.airplaneMode}
            className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none ${
              dark ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-slate-100 text-slate-900'
            }`}
          />
          <button
            type="submit"
            disabled={os.state.settings.airplaneMode || !draft.trim()}
            className="p-2 rounded-xl bg-sky-600 text-white disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">Messages</h1>
        <span className="text-xs opacity-50">{os.state.threads.length} threads</span>
      </div>
      <div className="flex-1 overflow-y-auto phone-scroll px-3 space-y-2 pb-4">
        {os.state.threads.map((t) => {
          const last = t.messages[t.messages.length - 1];
          return (
            <button
              key={t.id}
              onClick={() => {
                setSelectedId(t.id);
                os.markThreadRead(t.id);
              }}
              className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition ${
                dark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-slate-100 shadow-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {t.contactName.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">{t.contactName}</p>
                  <span className="text-[11px] opacity-50 tabular-nums">{last?.time || ''}</span>
                </div>
                <p className="text-xs opacity-60 truncate mt-0.5">
                  {last ? last.text : 'No messages yet'}
                </p>
              </div>
              {t.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {t.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- CONTACTS APP ---------------- */
export const ContactsApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const dark = os.state.settings.darkMode;

  const filtered = os.state.contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query) ||
      c.role.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    os.addContact({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || 'contact@aether.local',
      role: role.trim() || 'Personal',
    });
    setName('');
    setPhone('');
    setEmail('');
    setRole('');
    setAdding(false);
  };

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">Contacts</h1>
        <button
          onClick={() => setAdding((v) => !v)}
          className="p-1.5 rounded-lg bg-sky-600 text-white"
          aria-label="Add contact"
        >
          {adding ? <ArrowLeft className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        </button>
      </div>

      {adding ? (
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name *"
            className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none ${dark ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number *"
            className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none ${dark ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none ${dark ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Label / Role"
            className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none ${dark ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-sky-600 text-white text-xs font-semibold"
          >
            Save Contact
          </button>
        </form>
      ) : (
        <>
          <div className="px-4 pb-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}>
              <Search className="w-3.5 h-3.5 opacity-50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts..."
                className="flex-1 bg-transparent text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto phone-scroll px-4 space-y-2 pb-4">
            {filtered.map((c) => (
              <div
                key={c.id}
                className={`p-3 rounded-xl flex items-center justify-between ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-full ${c.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                    {c.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-[11px] opacity-60 truncate">{c.role} · {c.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => os.startCall(c.name, c.phone)}
                    className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/15"
                    aria-label="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => os.openApp('messages')}
                    className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-500/15"
                    aria-label="Message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => os.deleteContact(c.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ---------------- MAIL APP ---------------- */
export const MailApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [folder, setFolder] = useState<'inbox' | 'sent' | 'starred'>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const dark = os.state.settings.darkMode;

  const list = os.state.emails.filter((e) => {
    if (folder === 'starred') return e.starred;
    return e.folder === folder;
  });

  const selected = os.state.emails.find((e) => e.id === selectedId) ?? null;

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;
    os.sendEmail(to.trim(), subject.trim(), body.trim());
    setTo('');
    setSubject('');
    setBody('');
    setComposing(false);
    setFolder('sent');
  };

  if (composing) {
    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-500/20">
          <button onClick={() => setComposing(false)} className="text-xs text-sky-500">Cancel</button>
          <span className="text-sm font-semibold">New Email</span>
          <button onClick={handleCompose} className="text-xs font-semibold text-sky-500">Send</button>
        </div>
        <form onSubmit={handleCompose} className="p-4 space-y-3 flex-1 flex flex-col">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To (e.g. team@studio.io)"
            className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className={`flex-1 w-full p-3 rounded-xl text-xs outline-none resize-none ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold">
            Send Email
          </button>
        </form>
      </div>
    );
  }

  if (selected) {
    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="px-3 py-3 flex items-center justify-between border-b border-slate-500/20">
          <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-slate-500/15">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => os.updateEmail(selected.id, { starred: !selected.starred })}
              className="p-1.5 rounded-lg hover:bg-slate-500/15"
            >
              <Star className={`w-4 h-4 ${selected.starred ? 'text-amber-400 fill-amber-400' : 'opacity-60'}`} />
            </button>
            <button
              onClick={() => {
                os.deleteEmail(selected.id);
                setSelectedId(null);
              }}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto phone-scroll space-y-3">
          <h2 className="text-base font-bold leading-snug">{selected.subject}</h2>
          <div className="flex items-center justify-between text-xs opacity-65">
            <span>{selected.from} ({selected.fromEmail})</span>
            <span>{selected.time}</span>
          </div>
          <div className="pt-3 border-t border-slate-500/20 text-xs leading-relaxed whitespace-pre-line">
            {selected.body}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <MailIcon className="w-4 h-4 text-blue-500" />
          Mail
        </h1>
        <button
          onClick={() => setComposing(true)}
          className="p-1.5 rounded-lg bg-blue-600 text-white"
          aria-label="Compose email"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pb-2 flex gap-1.5 text-xs">
        {(['inbox', 'starred', 'sent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
              folder === f ? 'bg-blue-600 text-white' : 'bg-slate-500/15 opacity-70'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll px-3 space-y-2 pb-4">
        {list.length === 0 && (
          <div className="text-center py-12 opacity-50 text-xs flex flex-col items-center gap-2">
            <Inbox className="w-6 h-6" />
            <span>No emails in {folder}</span>
          </div>
        )}
        {list.map((email) => (
          <button
            key={email.id}
            onClick={() => {
              setSelectedId(email.id);
              os.updateEmail(email.id, { unread: false });
            }}
            className={`w-full p-3 rounded-xl text-left transition ${
              dark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-slate-100 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${email.unread ? 'text-sky-400' : ''}`}>
                {email.from}
              </span>
              <span className="text-[11px] opacity-50 tabular-nums">{email.time}</span>
            </div>
            <p className="text-xs font-medium mt-0.5 truncate">{email.subject}</p>
            <p className="text-[11px] opacity-55 truncate mt-0.5">{email.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
