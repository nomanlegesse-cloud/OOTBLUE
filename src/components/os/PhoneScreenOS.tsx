import React, { useEffect, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  Bluetooth,
  Camera,
  ChevronUp,
  Edit3,
  Flashlight,
  Layers,
  Lock,
  Moon,
  Pause,
  Phone,
  Plane,
  Play,
  Search,
  Settings,
  Signal,
  Sun,
  Timer,
  Trash2,
  Unlock,
  Volume2,
  VolumeX,
  Wifi,
  X,
} from 'lucide-react';
import { APP_CATALOG, MUSIC_TRACKS, OS_STRINGS, WALLPAPERS } from '../../os/catalog';
import { AppId } from '../../os/types';
import { PhoneOSController } from '../../os/usePhoneOS';
import { AirportApp } from '../apps/AirportApp';
import { ContactsApp, MailApp, MessagesApp, PhoneApp } from '../apps/CommunicationApps';
import {
  FlashcardsApp,
  FocusTimerApp,
  HabitsApp,
  PulseSocialApp,
  UnitConverterApp,
} from '../apps/ExtraStoreApps';
import {
  BrickBreakerGame,
  ChessGame,
  FlappyGame,
  Game2048,
  RacingGame,
  SnakeGame,
  TicTacToeGame,
} from '../apps/GamesApps';
import { BrowserApp, CameraApp, GalleryApp, MusicApp, YouTubeApp } from '../apps/MediaApps';
import {
  CalculatorApp,
  CalendarApp,
  ClockApp,
  NotesApp,
  WeatherApp,
} from '../apps/ProductivityApps';
import { AppStoreApp, FilesApp, MapsApp, SettingsApp } from '../apps/SystemApps';
import { AppIcon } from './AppIcon';

interface PhoneScreenOSProps {
  os: PhoneOSController;
  onVisitAirportTerminal?: () => void;
}

export const PhoneScreenOS: React.FC<PhoneScreenOSProps> = ({
  os,
  onVisitAirportTerminal,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [editHome, setEditHome] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = new Date();
      setNow((prev) =>
        prev.getMinutes() === next.getMinutes() && prev.getHours() === next.getHours()
          ? prev
          : next,
      );
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const { state, overlay, setOverlay, badges } = os;
  const s = state.settings;
  const strings = OS_STRINGS[s.language] ?? OS_STRINGS.en;
  const wallpaper = WALLPAPERS.find((w) => w.id === s.wallpaperId) ?? WALLPAPERS[0];

  const timeShort = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateLong = now.toLocaleDateString(
    s.language === 'en' ? 'en-US' : s.language,
    { weekday: 'long', month: 'long', day: 'numeric' },
  );

  // Brightness & Battery Saver effective dim (rendered as opacity overlay for zero filter repaint cost)
  const brightnessFactor = Math.max(0.28, (s.brightness / 100) * (s.batterySaver ? 0.86 : 1));
  const dimOpacity = Math.max(0, 1 - brightnessFactor);

  // Render active app component
  const renderApp = (appId: AppId) => {
    switch (appId) {
      case 'phone':
        return <PhoneApp os={os} />;
      case 'messages':
        return <MessagesApp os={os} />;
      case 'contacts':
        return <ContactsApp os={os} />;
      case 'mail':
        return <MailApp os={os} />;
      case 'music':
        return <MusicApp os={os} />;
      case 'gallery':
        return <GalleryApp os={os} />;
      case 'camera':
        return <CameraApp os={os} />;
      case 'youtube':
        return <YouTubeApp os={os} />;
      case 'browser':
        return <BrowserApp os={os} />;
      case 'calendar':
        return <CalendarApp os={os} />;
      case 'notes':
        return <NotesApp os={os} />;
      case 'calculator':
        return <CalculatorApp os={os} />;
      case 'clock':
        return <ClockApp os={os} />;
      case 'weather':
        return <WeatherApp os={os} />;
      case 'settings':
        return <SettingsApp os={os} />;
      case 'appstore':
        return <AppStoreApp os={os} />;
      case 'files':
        return <FilesApp os={os} />;
      case 'maps':
        return <MapsApp os={os} />;
      case 'airport':
        return (
          <AirportApp
            os={os}
            onVisitAirportTerminal={onVisitAirportTerminal}
          />
        );
      case 'game_snake':
        return <SnakeGame os={os} />;
      case 'game_flappy':
        return <FlappyGame os={os} />;
      case 'game_tictactoe':
        return <TicTacToeGame os={os} />;
      case 'game_chess':
        return <ChessGame os={os} />;
      case 'game_racing':
        return <RacingGame os={os} />;
      case 'game_2048':
        return <Game2048 os={os} />;
      case 'game_brick':
        return <BrickBreakerGame os={os} />;
      case 'app_pulse':
        return <PulseSocialApp os={os} />;
      case 'app_focus':
        return <FocusTimerApp os={os} />;
      case 'app_flashcards':
        return <FlashcardsApp os={os} />;
      case 'app_habits':
        return <HabitsApp os={os} />;
      case 'app_unitconv':
        return <UnitConverterApp os={os} />;
    }
  };

  // Screen Off (OLED black)
  if (!state.isScreenOn) {
    return (
      <div
        onClick={os.wakeScreen}
        className="w-[390px] h-[844px] bg-black text-white/30 flex flex-col items-center justify-center cursor-pointer rounded-[44px] overflow-hidden select-none"
      >
        <p className="text-xs tracking-wide">Tap screen or press Power button to wake</p>
      </div>
    );
  }

  // Dynamic Island content
  const islandActive = os.activeCall || os.musicPlaying || os.timer.running;
  const activeTrack = MUSIC_TRACKS[os.musicTrackIndex];

  // Search filter
  const searchResults = Object.values(APP_CATALOG).filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isLightApp =
    !state.isLocked && state.activeApp !== null && !s.darkMode && state.activeApp !== 'camera';

  return (
    <div
      onPointerDown={os.markInteraction}
      className="w-[390px] h-[844px] relative rounded-[44px] overflow-hidden select-none flex flex-col bg-black text-white"
    >
      {dimOpacity > 0.01 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-50"
          style={{ opacity: dimOpacity }}
        />
      )}
      {/* Wallpaper Backdrop (visible on Lock Screen & Home Screen) */}
      {(state.isLocked || state.activeApp === null) && (
        <div className="absolute inset-0 pointer-events-none">
          {wallpaper.type === 'image' ? (
            <img
              src={wallpaper.src}
              alt={wallpaper.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full" style={{ background: wallpaper.src }} />
          )}
          <div className="absolute inset-0 bg-black/25" />
        </div>
      )}

      {/* Flashlight Full-Screen Overlay */}
      {state.flashlightOn && (
        <div
          onClick={() => os.setState((prev) => ({ ...prev, flashlightOn: false }))}
          className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center text-slate-900 cursor-pointer"
        >
          <Flashlight className="w-10 h-10 mb-2" />
          <p className="text-sm font-bold">Flashlight Active</p>
          <p className="text-xs opacity-60 mt-1">Tap anywhere to turn off</p>
        </div>
      )}

      {/* ---------------- STATUS BAR & DYNAMIC ISLAND ---------------- */}
      <div
        className={`relative z-30 h-12 px-6 pt-2 flex items-center justify-between shrink-0 ${
          isLightApp ? 'text-slate-900 bg-slate-50' : 'text-white'
        }`}
      >
        {/* Left: Time + Notification Center Trigger */}
        <button
          onClick={() =>
            setOverlay((o) => (o === 'notifications' ? null : 'notifications'))
          }
          className="flex items-center gap-1.5 text-[13px] font-semibold font-mono tabular-nums hover:opacity-80"
          title="Open Notification Center"
        >
          <span>{timeShort}</span>
          {state.notifications.some((n) => !n.read) && (
            <Bell className="w-3 h-3 text-sky-400" />
          )}
        </button>

        {/* Center: Dynamic Island */}
        <button
          onClick={() => {
            if (os.activeCall) os.openApp('phone');
            else if (os.musicPlaying) os.openApp('music');
            else if (os.timer.running) os.openApp('clock');
            else setOverlay((o) => (o === 'controlCenter' ? null : 'controlCenter'));
          }}
          className={`h-7 rounded-full bg-black text-white border border-white/10 flex items-center justify-center transition-all duration-200 px-3 ${
            islandActive ? 'w-36 gap-2' : 'w-24'
          }`}
        >
          {os.activeCall ? (
            <>
              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-medium truncate">{os.activeCall.contactName}</span>
            </>
          ) : os.musicPlaying ? (
            <>
              <Play className="w-3 h-3 text-rose-400 fill-rose-400 shrink-0" />
              <span className="text-[10px] font-medium truncate">{activeTrack.title}</span>
            </>
          ) : os.timer.running ? (
            <>
              <Timer className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[10px] font-mono tabular-nums">
                {Math.floor(os.timer.remainingSeconds / 60)}:
                {String(os.timer.remainingSeconds % 60).padStart(2, '0')}
              </span>
            </>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/80 ml-auto" />
          )}
        </button>

        {/* Right: Signal, Wi-Fi, Battery + Control Center Trigger */}
        <button
          onClick={() =>
            setOverlay((o) => (o === 'controlCenter' ? null : 'controlCenter'))
          }
          className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums hover:opacity-80"
          title="Open Control Center"
        >
          {s.airplaneMode ? (
            <Plane className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <>
              <Signal className="w-3.5 h-3.5" />
              {s.wifi && <Wifi className="w-3.5 h-3.5" />}
            </>
          )}
          <span className={s.batterySaver ? 'text-amber-400 font-semibold' : ''}>
            {s.batteryLevel}%
          </span>
        </button>
      </div>

      {/* ---------------- MAIN SCREEN CONTENT ---------------- */}
      <div className="flex-1 relative z-10 overflow-hidden flex flex-col">
        {state.isLocked ? (
          /* LOCK SCREEN */
          <div
            onClick={os.unlockPhone}
            className="flex-1 flex flex-col justify-between px-5 pt-6 pb-5 cursor-pointer"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 text-xs text-white/75 mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>{s.deviceName}</span>
              </div>
              <div className="text-6xl font-bold font-mono tabular-nums tracking-tight text-white drop-shadow">
                {timeShort}
              </div>
              <p className="text-sm text-white/85 mt-1 font-medium">{dateLong}</p>
            </div>

            {/* Lock Screen Notifications */}
            <div className="my-auto max-h-[340px] overflow-y-auto phone-scroll space-y-2 py-2">
              {state.notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    os.openNotification(notif);
                  }}
                  className="p-3 rounded-2xl bg-slate-950/75 border border-white/15 flex items-start gap-2.5 cursor-pointer hover:bg-slate-900/90 transition"
                >
                  <AppIcon appId={notif.appId} shape={s.iconShape} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                      <span className="text-[10px] text-white/50">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/75 line-clamp-2 mt-0.5">{notif.body}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      os.dismissNotification(notif.id);
                    }}
                    className="p-1 text-white/40 hover:text-white"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Lock Screen Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    os.setState((p) => ({ ...p, flashlightOn: !p.flashlightOn }));
                  }}
                  className="w-11 h-11 rounded-full bg-black/50 border border-white/15 flex items-center justify-center text-white hover:bg-black/70"
                  aria-label="Toggle flashlight"
                >
                  <Flashlight className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    os.unlockPhone();
                  }}
                  className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  {strings.lockPrompt}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    os.openApp('camera');
                  }}
                  className="w-11 h-11 rounded-full bg-black/50 border border-white/15 flex items-center justify-center text-white hover:bg-black/70"
                  aria-label="Quick launch camera"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : state.activeApp ? (
          /* ACTIVE APP VIEW */
          <div key={state.activeApp} className="flex-1 overflow-hidden animate-app-open">
            {renderApp(state.activeApp)}
          </div>
        ) : (
          /* HOME SCREEN */
          <div className="flex-1 flex flex-col justify-between px-5 pt-2 pb-3 overflow-hidden">
            {/* Search & Home Edit Header */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setOverlay('search')}
                className="flex-1 px-3.5 py-2 rounded-2xl bg-black/45 border border-white/15 text-white/75 text-xs flex items-center gap-2 hover:bg-black/60 transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="truncate">{strings.searchPlaceholder}</span>
              </button>
              <button
                onClick={() => setEditHome((v) => !v)}
                className={`p-2 rounded-2xl border transition ${
                  editHome
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : 'bg-black/45 border-white/15 text-white/75 hover:text-white'
                }`}
                title="Customize / Uninstall Home Apps"
                aria-label="Edit home screen"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* App Grid */}
            <div className="flex-1 overflow-y-auto phone-scroll pr-0.5">
              <div className="grid grid-cols-4 gap-x-2 gap-y-4 pb-3">
                {state.installedApps.map((appId) => {
                  const app = APP_CATALOG[appId];
                  if (!app) return null;
                  return (
                    <div key={appId} className="flex flex-col items-center gap-1 relative">
                      <button
                        onClick={() => {
                          if (!editHome) os.openApp(appId);
                        }}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <AppIcon
                          appId={appId}
                          shape={s.iconShape}
                          badge={badges[appId] ?? 0}
                        />
                        <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] truncate max-w-[74px]">
                          {app.shortName || app.name}
                        </span>
                      </button>

                      {editHome && !app.preinstalled && (
                        <button
                          onClick={() => os.uninstallApp(appId)}
                          className="absolute -top-1.5 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow"
                          aria-label={`Uninstall ${app.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Home Dock */}
            <div className="mt-2 p-2.5 rounded-[26px] bg-black/50 border border-white/15 flex items-center justify-around shrink-0">
              {state.dockApps.map((appId) => (
                <button
                  key={appId}
                  onClick={() => os.openApp(appId)}
                  className="flex flex-col items-center"
                  aria-label={APP_CATALOG[appId].name}
                >
                  <AppIcon
                    appId={appId}
                    shape={s.iconShape}
                    badge={badges[appId] ?? 0}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------------- SYSTEM OVERLAYS ---------------- */}
      {/* 1. Notification Center */}
      {overlay === 'notifications' && (
        <div className="absolute inset-x-0 top-12 bottom-10 bg-slate-950/95 z-40 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">{strings.notificationsTitle}</h2>
            <div className="flex items-center gap-2">
              {state.notifications.length > 0 && (
                <button
                  onClick={os.clearAllNotifications}
                  className="text-xs text-sky-400 font-medium"
                >
                  {strings.clearAll}
                </button>
              )}
              <button onClick={() => setOverlay(null)} className="p-1 rounded-lg bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto phone-scroll space-y-2">
            {state.notifications.length === 0 && (
              <p className="text-center text-xs text-slate-400 mt-14">{strings.noNotifications}</p>
            )}
            {state.notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => os.openNotification(n)}
                className="p-3 rounded-2xl bg-slate-900 border border-white/10 flex items-start gap-2.5 cursor-pointer"
              >
                <AppIcon appId={n.appId} shape={s.iconShape} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{n.title}</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">{n.body}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    os.dismissNotification(n.id);
                  }}
                  className="p-1 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Control Center */}
      {overlay === 'controlCenter' && (
        <div className="absolute inset-x-0 top-12 bottom-10 bg-slate-950/95 z-40 p-4 flex flex-col gap-3.5 overflow-y-auto phone-scroll">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">{strings.controlCenter}</h2>
            <button onClick={() => setOverlay(null)} className="p-1 rounded-lg bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => os.updateSettings({ wifi: !s.wifi, airplaneMode: false })}
              className={`p-3 rounded-2xl flex items-center gap-2.5 text-left ${
                s.wifi && !s.airplaneMode ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-semibold">{strings.wifi}</span>
            </button>
            <button
              onClick={() => os.updateSettings({ bluetooth: !s.bluetooth, airplaneMode: false })}
              className={`p-3 rounded-2xl flex items-center gap-2.5 text-left ${
                s.bluetooth && !s.airplaneMode ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Bluetooth className="w-4 h-4" />
              <span className="text-xs font-semibold">{strings.bluetooth}</span>
            </button>
            <button
              onClick={() => os.updateSettings({ airplaneMode: !s.airplaneMode })}
              className={`p-3 rounded-2xl flex items-center gap-2.5 text-left ${
                s.airplaneMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span className="text-xs font-semibold">{strings.airplane}</span>
            </button>
            <button
              onClick={() => os.updateSettings({ darkMode: !s.darkMode })}
              className={`p-3 rounded-2xl flex items-center gap-2.5 text-left ${
                s.darkMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-950'
              }`}
            >
              {s.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span className="text-xs font-semibold">{strings.darkMode}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Brightness
                </span>
                <span className="font-mono tabular-nums">{s.brightness}%</span>
              </div>
              <input
                type="range"
                min={25}
                max={100}
                value={s.brightness}
                onChange={(e) => os.updateSettings({ brightness: Number(e.target.value) })}
                className="w-full accent-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5">
                  {s.muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
                  Volume
                </span>
                <span className="font-mono tabular-nums">{s.muted ? 'Muted' : `${s.volume}%`}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={s.muted ? 0 : s.volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  os.updateSettings({ volume: v, muted: v === 0 });
                }}
                className="w-full accent-sky-500"
              />
            </div>
          </div>

          {/* Now Playing Mini Widget */}
          <div className="p-3.5 rounded-2xl bg-slate-900 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{activeTrack.title}</p>
              <p className="text-[11px] text-slate-400 truncate">{activeTrack.artist}</p>
            </div>
            <button
              onClick={() => os.setMusicPlaying((p) => !p)}
              className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0"
            >
              {os.musicPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => os.updateSettings({ batterySaver: !s.batterySaver })}
              className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
                s.batterySaver ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-200'
              }`}
            >
              <BatteryCharging className="w-4 h-4" />
              {strings.batterySaver}
            </button>
            <button
              onClick={() => os.openApp('settings')}
              className="p-3 rounded-2xl bg-slate-900 text-slate-200 flex items-center gap-2 text-xs font-semibold"
            >
              <Settings className="w-4 h-4" />
              {strings.settings}
            </button>
          </div>
        </div>
      )}

      {/* 3. App Switcher */}
      {overlay === 'appSwitcher' && (
        <div className="absolute inset-x-0 top-12 bottom-10 bg-slate-950/95 z-40 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">{strings.recentApps}</h2>
            <button onClick={() => setOverlay(null)} className="p-1 rounded-lg bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto phone-scroll space-y-2.5">
            {state.recentApps.length === 0 && (
              <p className="text-center text-xs text-slate-400 mt-16">{strings.noRecentApps}</p>
            )}
            {state.recentApps.map((appId) => {
              const app = APP_CATALOG[appId];
              if (!app) return null;
              return (
                <div
                  key={appId}
                  onClick={() => os.openApp(appId)}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <AppIcon appId={appId} shape={s.iconShape} size="sm" />
                    <div>
                      <p className="text-xs font-bold">{app.name}</p>
                      <p className="text-[11px] text-slate-400">{app.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      os.closeRecentApp(appId);
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400"
                    aria-label={`Close ${app.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Spotlight Search */}
      {overlay === 'search' && (
        <div className="absolute inset-x-0 top-12 bottom-10 bg-slate-950/95 z-40 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-white/15">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={strings.searchPlaceholder}
                className="flex-1 bg-transparent text-xs outline-none text-white"
              />
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setOverlay(null);
              }}
              className="text-xs text-sky-400 font-medium px-2"
            >
              Cancel
            </button>
          </div>
          <div className="flex-1 overflow-y-auto phone-scroll space-y-2">
            {searchResults.map((app) => {
              const isInstalled =
                state.installedApps.includes(app.id) || state.dockApps.includes(app.id);
              return (
                <button
                  key={app.id}
                  onClick={() => {
                    setSearchQuery('');
                    if (isInstalled) os.openApp(app.id);
                    else os.openApp('appstore');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <AppIcon appId={app.id} shape={s.iconShape} size="sm" />
                    <div>
                      <p className="text-xs font-semibold">{app.name}</p>
                      <p className="text-[10px] text-slate-400">{app.category}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-sky-400 font-medium">
                    {isInstalled ? 'Open' : 'App Store'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- VOLUME HUD ---------------- */}
      {os.volumeHudVisible && (
        <div className="absolute left-3 top-28 z-50 w-9 py-3 rounded-2xl bg-slate-900/95 border border-white/15 flex flex-col items-center gap-2 shadow-xl">
          <span className="text-[10px] font-mono tabular-nums">
            {s.muted ? 0 : s.volume}
          </span>
          <div className="w-1.5 h-24 rounded-full bg-slate-700 overflow-hidden flex flex-col justify-end">
            <div
              className="w-full bg-white rounded-full transition-all"
              style={{ height: `${s.muted ? 0 : s.volume}%` }}
            />
          </div>
          {s.muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </div>
      )}

      {/* ---------------- BOTTOM NAVIGATION BAR ---------------- */}
      {!state.isLocked && (
        <div
          className={`relative z-30 h-9 px-6 flex items-center justify-between shrink-0 ${
            isLightApp ? 'bg-slate-50 text-slate-700 border-t border-slate-200' : 'bg-black/80 text-white/75'
          }`}
        >
          <button
            onClick={() =>
              setOverlay((o) => (o === 'appSwitcher' ? null : 'appSwitcher'))
            }
            className="p-1.5 rounded-lg hover:bg-white/10"
            title="App Switcher"
            aria-label="Open App Switcher"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={os.goHome}
            className="flex-1 flex items-center justify-center py-2 group"
            title="Home"
            aria-label="Go Home"
          >
            <div
              className={`w-28 h-1 rounded-full transition group-hover:scale-x-105 ${
                isLightApp ? 'bg-slate-400' : 'bg-white/80'
              }`}
            />
          </button>

          <button
            onClick={os.lockPhone}
            className="p-1.5 rounded-lg hover:bg-white/10"
            title="Lock Screen"
            aria-label="Lock Phone"
          >
            <ChevronUp className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
};
