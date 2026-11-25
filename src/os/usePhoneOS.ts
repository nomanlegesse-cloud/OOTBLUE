import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  APP_CATALOG,
  DEFAULT_DOCK_APPS,
  INITIAL_ALARMS,
  INITIAL_CONTACTS,
  INITIAL_EMAILS,
  INITIAL_EVENTS,
  INITIAL_FILES,
  INITIAL_GALLERY,
  INITIAL_NOTES,
  INITIAL_THREADS,
  MUSIC_TRACKS,
  PREINSTALLED_HOME_APPS,
} from './catalog';
import {
  musicEngine,
  playAlarmChime,
  playLockSound,
  playNotificationSound,
  playTapSound,
  playUnlockSound,
} from './sound';
import { COUNTRY_MAP, CountryId } from './countries';
import {
  ActiveCallState,
  ActiveTimerState,
  AppId,
  BoardingPass,
  CalendarEvent,
  Contact,
  EmailItem,
  FileEntry,
  GalleryMedia,
  NoteItem,
  NotificationItem,
  PhoneOSState,
  PhoneSettings,
  SystemOverlay,
} from './types';

const STORAGE_KEY = 'ootblue1_os_state_v1';

function createInitialState(): PhoneOSState {
  return {
    isLocked: true,
    isScreenOn: true,
    flashlightOn: false,
    activeApp: null,
    recentApps: ['messages', 'camera', 'appstore'],
    installedApps: [...PREINSTALLED_HOME_APPS],
    dockApps: [...DEFAULT_DOCK_APPS],
    settings: {
      deviceName: 'OOTBLUE 1',
      language: 'en',
      brightness: 92,
      darkMode: true,
      wallpaperId: 'obsidian_flow',
      screenTimeoutSec: 60,
      volume: 75,
      muted: false,
      ringtone: 'Apex Chime',
      notificationSound: 'Droplet',
      wifi: true,
      bluetooth: true,
      airplaneMode: false,
      iconShape: 'squircle',
      themeAccent: 'cobalt',
      batteryLevel: 86,
      batterySaver: false,
    },
    notifications: [
      {
        id: 'notif-1',
        appId: 'messages',
        title: 'Elena Vance',
        body: 'Awesome, let’s review the camera bump tolerances at 2pm.',
        timestamp: Date.now() - 420_000,
        read: false,
      },
      {
        id: 'notif-2',
        appId: 'mail',
        title: 'Sofia Lindqvist',
        body: 'Sapphire Lens Coating Test Results',
        timestamp: Date.now() - 1800_000,
        read: false,
      },
      {
        id: 'notif-3',
        appId: 'appstore',
        title: 'App Store',
        body: '7 playable games & productivity tools ready to install.',
        timestamp: Date.now() - 3600_000,
        read: false,
      },
    ],
    contacts: INITIAL_CONTACTS,
    threads: INITIAL_THREADS,
    emails: INITIAL_EMAILS,
    events: INITIAL_EVENTS,
    notes: INITIAL_NOTES,
    gallery: INITIAL_GALLERY,
    alarms: INITIAL_ALARMS,
    files: INITIAL_FILES,
    callHistory: [
      { id: 'ch1', name: 'Elena Vance', number: '+1 (415) 890-2314', type: 'incoming', time: '09:12' },
      { id: 'ch2', name: 'Marcus Chen', number: '+1 (650) 412-9088', type: 'outgoing', time: 'Yesterday' },
      { id: 'ch3', name: 'David Morales', number: '+1 (212) 774-1903', type: 'missed', time: 'Mon' },
    ],
    gameHighScores: {},
    pulsePosts: [
      {
        id: 'p1',
        author: 'Elena Vance',
        handle: '@elenavance',
        content: 'Testing the Grade 5 titanium finish under studio softbox lights. Specular bevels look dialed in.',
        likes: 42,
        liked: false,
        time: '18m ago',
      },
      {
        id: 'p2',
        author: 'Marcus Chen',
        handle: '@mchen_dev',
        content: 'Just pushed AetherOS 4.0 with 7 native playable games in the App Store.',
        likes: 89,
        liked: true,
        time: '2h ago',
      },
    ],
    habits: [
      { id: 'h1', title: 'Morning Hydration', streak: 9, completedToday: true },
      { id: 'h2', title: '30m Deep Focus', streak: 5, completedToday: false },
      { id: 'h3', title: 'Evening Walk', streak: 14, completedToday: false },
    ],
    currentCountry: 'ootblue',
    visitedCountries: ['ootblue'],
    boardingPasses: [],
  };
}

function loadPersistedState(): PhoneOSState {
  const fallback = createInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PhoneOSState>;
    const installed = parsed.installedApps ? [...parsed.installedApps] : [...fallback.installedApps];
    if (!installed.includes('airport')) {
      installed.splice(Math.min(2, installed.length), 0, 'airport');
    }
    return {
      ...fallback,
      ...parsed,
      installedApps: installed,
      currentCountry: parsed.currentCountry && COUNTRY_MAP[parsed.currentCountry] ? parsed.currentCountry : fallback.currentCountry,
      visitedCountries: Array.isArray(parsed.visitedCountries) && parsed.visitedCountries.length > 0 ? parsed.visitedCountries : fallback.visitedCountries,
      boardingPasses: Array.isArray(parsed.boardingPasses)
        ? parsed.boardingPasses.map((bp) => ({ ...bp, status: bp.status ?? 'used' }))
        : fallback.boardingPasses,
      settings: {
        ...fallback.settings,
        ...(parsed.settings ?? {}),
      },
      // Always boot screen on so user immediately sees phone screen
      isScreenOn: true,
    };
  } catch {
    return fallback;
  }
}

export function usePhoneOS() {
  const [state, setState] = useState<PhoneOSState>(loadPersistedState);
  const [overlay, setOverlay] = useState<SystemOverlay>(null);
  const [installingProgress, setInstallingProgress] = useState<Record<string, number>>({});
  const [volumeHudVisible, setVolumeHudVisible] = useState(false);
  const volumeHudTimerRef = useRef<number | null>(null);

  // Live Music state
  const [musicTrackIndex, setMusicTrackIndex] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicElapsed, setMusicElapsed] = useState(0);

  // Live Active Call state
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);

  // Live Timer state
  const [timer, setTimer] = useState<ActiveTimerState>({
    totalSeconds: 300,
    remainingSeconds: 300,
    running: false,
  });

  // Debounced OS state persistence so clicks & sliders never block the main thread
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore quota exceeded on large captured media
      }
    }, 350);
    return () => window.clearTimeout(id);
  }, [state]);

  // Sync audio volume to music synthesizer
  useEffect(() => {
    musicEngine.setAudioLevel(state.settings.volume, state.settings.muted);
  }, [state.settings.volume, state.settings.muted]);

  // Music playback timer
  useEffect(() => {
    const track = MUSIC_TRACKS[musicTrackIndex];
    if (musicPlaying) {
      musicEngine.start(track);
      const id = window.setInterval(() => {
        setMusicElapsed((prev) => {
          if (prev + 1 >= track.durationSec) {
            setMusicTrackIndex((idx) => (idx + 1) % MUSIC_TRACKS.length);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      return () => {
        window.clearInterval(id);
        musicEngine.stop();
      };
    } else {
      musicEngine.stop();
    }
  }, [musicPlaying, musicTrackIndex]);

  // Countdown timer tick
  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (!prev.running) return prev;
        if (prev.remainingSeconds <= 1) {
          playAlarmChime(state.settings.volume, state.settings.muted);
          setState((s) => ({
            ...s,
            notifications: [
              {
                id: `notif-timer-${Date.now()}`,
                appId: 'clock',
                title: 'Timer Complete',
                body: 'Your countdown timer has finished.',
                timestamp: Date.now(),
                read: false,
              },
              ...s.notifications,
            ],
          }));
          return { ...prev, remainingSeconds: 0, running: false };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer.running, state.settings.volume, state.settings.muted]);

  // Gentle battery simulation & screen timeout
  const lastInteractionRef = useRef<number>(Date.now());
  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => {
        if (!prev.isScreenOn) return prev;
        const timeout = prev.settings.screenTimeoutSec;
        if (timeout > 0 && Date.now() - lastInteractionRef.current > timeout * 1000 && !musicPlaying && !activeCall && prev.activeApp !== 'camera') {
          return { ...prev, isScreenOn: false, isLocked: true };
        }
        return prev;
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [musicPlaying, activeCall]);

  // Trigger Volume HUD
  const showVolumeHud = useCallback(() => {
    setVolumeHudVisible(true);
    if (volumeHudTimerRef.current) window.clearTimeout(volumeHudTimerRef.current);
    volumeHudTimerRef.current = window.setTimeout(() => {
      setVolumeHudVisible(false);
    }, 1800);
  }, []);

  // Push Notification helper
  const pushNotification = useCallback(
    (appId: AppId, title: string, body: string) => {
      setState((prev) => {
        playNotificationSound(prev.settings.notificationSound, prev.settings.volume, prev.settings.muted);
        return {
          ...prev,
          notifications: [
            {
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              appId,
              title,
              body,
              timestamp: Date.now(),
              read: false,
            },
            ...prev.notifications,
          ].slice(0, 30),
        };
      });
    },
    [],
  );

  // Receive a live message from an NPC in the 3D World
  const receiveNpcMessage = useCallback((npcName: string, text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setState((prev) => {
      playNotificationSound(prev.settings.notificationSound, prev.settings.volume, prev.settings.muted);
      const existing = prev.threads.find((t) => t.contactName === npcName);
      const msg = { id: `m-npc-${Date.now()}`, sender: 'them' as const, text, time };
      const updatedThreads = existing
        ? prev.threads.map((t) =>
            t.id === existing.id
              ? { ...t, unread: t.unread + 1, messages: [...t.messages, msg] }
              : t,
          )
        : [
            {
              id: `t-npc-${Date.now()}`,
              contactId: `c-npc-${Date.now()}`,
              contactName: npcName,
              phone: '+1 (800) OOT-BLUE',
              unread: 1,
              messages: [msg],
            },
            ...prev.threads,
          ];
      return {
        ...prev,
        threads: updatedThreads,
        notifications: [
          {
            id: `notif-npc-${Date.now()}`,
            appId: 'messages' as AppId,
            title: npcName,
            body: text,
            timestamp: Date.now(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 30),
      };
    });
  }, []);

  // Actions
  const pressPowerButton = useCallback(() => {
    markInteraction();
    setOverlay(null);
    setState((prev) => {
      if (!prev.isScreenOn) {
        playUnlockSound(prev.settings.volume, prev.settings.muted);
        return { ...prev, isScreenOn: true };
      }
      playLockSound(prev.settings.volume, prev.settings.muted);
      return { ...prev, isScreenOn: false, isLocked: true, flashlightOn: false };
    });
  }, [markInteraction]);

  const wakeScreen = useCallback(() => {
    markInteraction();
    setState((prev) => {
      if (!prev.isScreenOn) {
        return { ...prev, isScreenOn: true };
      }
      return prev;
    });
  }, [markInteraction]);

  const unlockPhone = useCallback(() => {
    markInteraction();
    setOverlay(null);
    setState((prev) => {
      playUnlockSound(prev.settings.volume, prev.settings.muted);
      return { ...prev, isScreenOn: true, isLocked: false };
    });
  }, [markInteraction]);

  const lockPhone = useCallback(() => {
    setOverlay(null);
    setState((prev) => {
      playLockSound(prev.settings.volume, prev.settings.muted);
      return { ...prev, isLocked: true, activeApp: null };
    });
  }, []);

  const openApp = useCallback(
    (appId: AppId) => {
      markInteraction();
      setOverlay(null);
      setState((prev) => {
        playTapSound(prev.settings.volume, prev.settings.muted);
        const isInstalled =
          prev.installedApps.includes(appId) || prev.dockApps.includes(appId);
        if (!isInstalled) return prev;
        const recent = [appId, ...prev.recentApps.filter((id) => id !== appId)].slice(0, 8);
        const updatedNotifs = prev.notifications.map((n) =>
          n.appId === appId ? { ...n, read: true } : n,
        );
        return {
          ...prev,
          isScreenOn: true,
          isLocked: false,
          activeApp: appId,
          recentApps: recent,
          notifications: updatedNotifs,
        };
      });
    },
    [markInteraction],
  );

  const goHome = useCallback(() => {
    markInteraction();
    setOverlay(null);
    setState((prev) => {
      if (prev.activeApp) playTapSound(prev.settings.volume, prev.settings.muted);
      return { ...prev, activeApp: null };
    });
  }, [markInteraction]);

  const closeRecentApp = useCallback((appId: AppId) => {
    setState((prev) => ({
      ...prev,
      recentApps: prev.recentApps.filter((id) => id !== appId),
      activeApp: prev.activeApp === appId ? null : prev.activeApp,
    }));
  }, []);

  const adjustVolume = useCallback(
    (delta: number) => {
      markInteraction();
      setState((prev) => {
        const nextVol = Math.max(0, Math.min(100, prev.settings.volume + delta));
        return {
          ...prev,
          isScreenOn: true,
          settings: {
            ...prev.settings,
            volume: nextVol,
            muted: nextVol === 0 ? true : false,
          },
        };
      });
      showVolumeHud();
    },
    [markInteraction, showVolumeHud],
  );

  const updateSettings = useCallback((patch: Partial<PhoneSettings>) => {
    markInteraction();
    setState((prev) => {
      const nextSettings = { ...prev.settings, ...patch };
      if (patch.airplaneMode === true) {
        nextSettings.wifi = false;
        nextSettings.bluetooth = false;
      }
      return { ...prev, settings: nextSettings };
    });
  }, [markInteraction]);

  // App Store install / uninstall
  const installApp = useCallback(
    (appId: AppId) => {
      if (installingProgress[appId] !== undefined) return;
      setInstallingProgress((prev) => ({ ...prev, [appId]: 8 }));
      const start = Date.now();
      const duration = 450;
      const tick = window.setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.min(100, Math.round((elapsed / duration) * 100));
        if (pct >= 100) {
          window.clearInterval(tick);
          setInstallingProgress((prev) => {
            const copy = { ...prev };
            delete copy[appId];
            return copy;
          });
          setState((prev) => {
            if (prev.installedApps.includes(appId)) return prev;
            const app = APP_CATALOG[appId];
            playNotificationSound(prev.settings.notificationSound, prev.settings.volume, prev.settings.muted);
            return {
              ...prev,
              installedApps: [...prev.installedApps, appId],
              notifications: [
                {
                  id: `notif-inst-${Date.now()}`,
                  appId: 'appstore',
                  title: `${app.name} Installed`,
                  body: 'Added to your Home Screen. Tap to launch.',
                  timestamp: Date.now(),
                  read: false,
                },
                ...prev.notifications,
              ],
            };
          });
        } else {
          setInstallingProgress((prev) => ({ ...prev, [appId]: pct }));
        }
      }, 65);
    },
    [installingProgress],
  );

  const uninstallApp = useCallback((appId: AppId) => {
    const app = APP_CATALOG[appId];
    if (!app || app.preinstalled) return;
    setState((prev) => ({
      ...prev,
      installedApps: prev.installedApps.filter((id) => id !== appId),
      recentApps: prev.recentApps.filter((id) => id !== appId),
      activeApp: prev.activeApp === appId ? null : prev.activeApp,
    }));
  }, []);

  const moveHomeApp = useCallback((appId: AppId, direction: -1 | 1) => {
    setState((prev) => {
      const list = [...prev.installedApps];
      const idx = list.indexOf(appId);
      if (idx === -1) return prev;
      const target = idx + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...prev, installedApps: list };
    });
  }, []);

  // Notifications
  const dismissNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setState((prev) => ({ ...prev, notifications: [] }));
  }, []);

  const openNotification = useCallback(
    (notif: NotificationItem) => {
      setState((prev) => ({
        ...prev,
        isLocked: false,
        isScreenOn: true,
        notifications: prev.notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      }));
      openApp(notif.appId);
    },
    [openApp],
  );

  // Badges count per app
  const badges = useMemo(() => {
    const map: Partial<Record<AppId, number>> = {};
    for (const n of state.notifications) {
      if (!n.read) {
        map[n.appId] = (map[n.appId] ?? 0) + 1;
      }
    }
    const msgUnread = state.threads.reduce((acc, t) => acc + t.unread, 0);
    if (msgUnread > 0) map.messages = msgUnread;
    const mailUnread = state.emails.filter((e) => e.folder === 'inbox' && e.unread).length;
    if (mailUnread > 0) map.mail = mailUnread;
    return map;
  }, [state.notifications, state.threads, state.emails]);

  // Communication actions
  const startCall = useCallback((contactName: string, phone: string) => {
    setActiveCall({
      contactName,
      phone,
      startedAt: Date.now(),
      muted: false,
      speaker: false,
    });
    setState((prev) => ({
      ...prev,
      callHistory: [
        {
          id: `ch-${Date.now()}`,
          name: contactName,
          number: phone,
          type: 'outgoing',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.callHistory,
      ],
    }));
  }, []);

  const endCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  const sendMessage = useCallback(
    (threadId: string, text: string) => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let contactName = '';
      setState((prev) => ({
        ...prev,
        threads: prev.threads.map((t) => {
          if (t.id !== threadId) return t;
          contactName = t.contactName;
          return {
            ...t,
            unread: 0,
            messages: [...t.messages, { id: `m-${Date.now()}`, sender: 'me', text, time: nowStr }],
          };
        }),
      }));

      // Simulated contextual reply
      const replies = [
        'Got it, sounds great!',
        'Just saw this — checking right now.',
        'Perfect. Let’s sync up later today.',
        'Thanks for the update!',
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      window.setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setState((prev) => {
          const isViewingMessages = prev.activeApp === 'messages' && !prev.isLocked;
          if (!isViewingMessages) {
            playNotificationSound(prev.settings.notificationSound, prev.settings.volume, prev.settings.muted);
          }
          const targetThread = prev.threads.find((t) => t.id === threadId);
          const senderName = targetThread?.contactName || contactName || 'Contact';
          return {
            ...prev,
            threads: prev.threads.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    unread: isViewingMessages ? 0 : t.unread + 1,
                    messages: [
                      ...t.messages,
                      { id: `m-${Date.now()}-r`, sender: 'them', text: replyText, time: replyTime },
                    ],
                  }
                : t,
            ),
            notifications: isViewingMessages
              ? prev.notifications
              : [
                  {
                    id: `notif-msg-${Date.now()}`,
                    appId: 'messages',
                    title: senderName,
                    body: replyText,
                    timestamp: Date.now(),
                    read: false,
                  },
                  ...prev.notifications,
                ],
          };
        });
      }, 650);
    },
    [],
  );

  const markThreadRead = useCallback((threadId: string) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
    }));
  }, []);

  const addContact = useCallback((c: Omit<Contact, 'id' | 'avatarColor'>) => {
    const colors = ['bg-sky-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const newContact: Contact = { ...c, id: `c-${Date.now()}`, avatarColor };
    setState((prev) => ({
      ...prev,
      contacts: [newContact, ...prev.contacts],
      threads: [
        ...prev.threads,
        {
          id: `t-${Date.now()}`,
          contactId: newContact.id,
          contactName: newContact.name,
          phone: newContact.phone,
          unread: 0,
          messages: [],
        },
      ],
    }));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  }, []);

  // Mail
  const sendEmail = useCallback((to: string, subject: string, body: string) => {
    const item: EmailItem = {
      id: `e-${Date.now()}`,
      from: 'You',
      fromEmail: to,
      subject,
      body,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      folder: 'sent',
      unread: false,
      starred: false,
    };
    setState((prev) => ({ ...prev, emails: [item, ...prev.emails] }));
  }, []);

  const updateEmail = useCallback((id: string, patch: Partial<EmailItem>) => {
    setState((prev) => ({
      ...prev,
      emails: prev.emails.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const deleteEmail = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      emails: prev.emails.filter((e) => e.id !== id),
    }));
  }, []);

  // Gallery & Camera capture
  const addGalleryMedia = useCallback((media: Omit<GalleryMedia, 'id' | 'createdAt'>) => {
    const id = `g-${Date.now()}`;
    const createdAt = Date.now();
    const fileEntry: FileEntry = {
      id: `f-${Date.now()}`,
      name: `${media.title.replace(/\s+/g, '_')}.${media.type === 'video' ? 'webm' : 'jpg'}`,
      folder: 'Captures',
      size: media.type === 'video' ? '1.8 MB' : '420 KB',
      kind: media.type === 'video' ? 'video' : 'image',
      mediaSrc: media.src,
      updatedAt: createdAt,
    };
    setState((prev) => ({
      ...prev,
      gallery: [{ ...media, id, createdAt }, ...prev.gallery],
      files: [fileEntry, ...prev.files],
    }));
  }, []);

  const deleteGalleryMedia = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((g) => g.id !== id),
    }));
  }, []);

  // Notes
  const saveNote = useCallback((note: Partial<NoteItem> & { id?: string }) => {
    setState((prev) => {
      if (note.id) {
        return {
          ...prev,
          notes: prev.notes.map((n) =>
            n.id === note.id
              ? { ...n, title: note.title ?? n.title, content: note.content ?? n.content, updatedAt: Date.now() }
              : n,
          ),
        };
      }
      const created: NoteItem = {
        id: `n-${Date.now()}`,
        title: note.title || 'Untitled Note',
        content: note.content || '',
        updatedAt: Date.now(),
      };
      return { ...prev, notes: [created, ...prev.notes] };
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }));
  }, []);

  // Calendar
  const addEvent = useCallback((ev: Omit<CalendarEvent, 'id'>) => {
    setState((prev) => ({ ...prev, events: [...prev.events, { ...ev, id: `ev-${Date.now()}` }] }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setState((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
  }, []);

  // Alarms
  const toggleAlarm = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      alarms: prev.alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    }));
  }, []);

  const addAlarm = useCallback((time: string, label: string) => {
    setState((prev) => ({
      ...prev,
      alarms: [...prev.alarms, { id: `a-${Date.now()}`, time, label: label || 'Alarm', enabled: true }],
    }));
  }, []);

  const deleteAlarm = useCallback((id: string) => {
    setState((prev) => ({ ...prev, alarms: prev.alarms.filter((a) => a.id !== id) }));
  }, []);

  // High scores
  const updateHighScore = useCallback((gameId: string, score: number) => {
    setState((prev) => {
      const current = prev.gameHighScores[gameId] ?? 0;
      if (score <= current) return prev;
      return {
        ...prev,
        gameHighScores: { ...prev.gameHighScores, [gameId]: score },
      };
    });
  }, []);

  // Pulse Social & Habits
  const togglePulseLike = useCallback((postId: string) => {
    setState((prev) => ({
      ...prev,
      pulsePosts: prev.pulsePosts.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p,
      ),
    }));
  }, []);

  const addPulsePost = useCallback((content: string) => {
    setState((prev) => ({
      ...prev,
      pulsePosts: [
        {
          id: `p-${Date.now()}`,
          author: prev.settings.deviceName,
          handle: '@you',
          content,
          likes: 0,
          liked: false,
          time: 'Just now',
        },
        ...prev.pulsePosts,
      ],
    }));
  }, []);

  const toggleHabit = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h;
        const completed = !h.completedToday;
        return {
          ...h,
          completedToday: completed,
          streak: completed ? h.streak + 1 : Math.max(0, h.streak - 1),
        };
      }),
    }));
  }, []);

  const addHabit = useCallback((title: string) => {
    setState((prev) => ({
      ...prev,
      habits: [...prev.habits, { id: `h-${Date.now()}`, title, streak: 0, completedToday: false }],
    }));
  }, []);

  // Files
  const deleteFile = useCallback((id: string) => {
    setState((prev) => ({ ...prev, files: prev.files.filter((f) => f.id !== id) }));
  }, []);

  // Airport & International Travel (Buy Ticket in App -> Verified by Airport Passport Control NPC)
  const bookFlightTicket = useCallback((countryId: CountryId): BoardingPass | null => {
    const dest = COUNTRY_MAP[countryId];
    if (!dest) return null;
    markInteraction();
    const origin = COUNTRY_MAP[state.currentCountry] ?? COUNTRY_MAP.ootblue;
    const flightNum = `OB-${100 + Math.floor(Math.random() * 890)}`;
    const seats = ['1A', '2C', '4A', '6F', '9B', '12A'];
    const pass: BoardingPass = {
      id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      flightNo: flightNum,
      fromCode: origin.airportCode,
      toCode: dest.airportCode,
      fromCountry: origin.id,
      toCountry: dest.id,
      gate: dest.gate,
      seat: seats[Math.floor(Math.random() * seats.length)],
      issuedAt: Date.now(),
      status: 'ready',
    };
    setState((prev) => {
      playNotificationSound(prev.settings.notificationSound, prev.settings.volume, prev.settings.muted);
      return {
        ...prev,
        boardingPasses: [pass, ...prev.boardingPasses].slice(0, 12),
        notifications: [
          {
            id: `notif-ticket-${Date.now()}`,
            appId: 'airport' as AppId,
            title: `Ticket Issued: ${origin.airportCode} → ${dest.airportCode}`,
            body: `Flight ${pass.flightNo} (${dest.gate}). Show your Passport & Ticket to Officer Kenji at the Airport!`,
            timestamp: Date.now(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 30),
      };
    });
    return pass;
  }, [markInteraction, state.currentCountry]);

  const boardFlightWithTicket = useCallback((ticketId: string): CountryId | null => {
    const ticket = state.boardingPasses.find(
      (bp) => bp.id === ticketId && bp.status === 'ready' && bp.fromCountry === state.currentCountry,
    );
    if (!ticket) return null;
    const dest = COUNTRY_MAP[ticket.toCountry];
    if (!dest) return null;
    markInteraction();
    setState((prev) => {
      playNotificationSound(prev.settings.notificationSound, prev.settings.volume, prev.settings.muted);
      const visited = prev.visitedCountries.includes(dest.id)
        ? prev.visitedCountries
        : [...prev.visitedCountries, dest.id];
      return {
        ...prev,
        currentCountry: dest.id,
        visitedCountries: visited,
        boardingPasses: prev.boardingPasses.map((bp) =>
          bp.id === ticket.id ? { ...bp, status: 'used' as const } : bp,
        ),
        notifications: [
          {
            id: `notif-flight-${Date.now()}`,
            appId: 'airport' as AppId,
            title: `Passport Stamped: ${dest.name}`,
            body: `Flight ${ticket.flightNo} landed at ${dest.airportName} (${dest.airportCode}).`,
            timestamp: Date.now(),
            read: false,
          },
          ...prev.notifications,
        ].slice(0, 30),
      };
    });
    return dest.id;
  }, [markInteraction, state.boardingPasses, state.currentCountry]);

  // Reset phone
  const resetPhone = useCallback(() => {
    musicEngine.stop();
    setMusicPlaying(false);
    setActiveCall(null);
    setTimer({ totalSeconds: 300, remainingSeconds: 300, running: false });
    setOverlay(null);
    const fresh = createInitialState();
    setState(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  }, []);

  return {
    state,
    setState,
    overlay,
    setOverlay,
    installingProgress,
    volumeHudVisible,
    badges,
    // Music
    musicTrackIndex,
    setMusicTrackIndex,
    musicPlaying,
    setMusicPlaying,
    musicElapsed,
    setMusicElapsed,
    // Call
    activeCall,
    setActiveCall,
    startCall,
    endCall,
    // Timer
    timer,
    setTimer,
    // Actions
    markInteraction,
    pressPowerButton,
    wakeScreen,
    unlockPhone,
    lockPhone,
    openApp,
    goHome,
    closeRecentApp,
    adjustVolume,
    updateSettings,
    installApp,
    uninstallApp,
    moveHomeApp,
    dismissNotification,
    clearAllNotifications,
    openNotification,
    pushNotification,
    receiveNpcMessage,
    sendMessage,
    markThreadRead,
    addContact,
    deleteContact,
    sendEmail,
    updateEmail,
    deleteEmail,
    addGalleryMedia,
    deleteGalleryMedia,
    saveNote,
    deleteNote,
    addEvent,
    deleteEvent,
    toggleAlarm,
    addAlarm,
    deleteAlarm,
    updateHighScore,
    togglePulseLike,
    addPulsePost,
    toggleHabit,
    addHabit,
    deleteFile,
    bookFlightTicket,
    boardFlightWithTicket,
    resetPhone,
  };
}

export type PhoneOSController = ReturnType<typeof usePhoneOS>;
