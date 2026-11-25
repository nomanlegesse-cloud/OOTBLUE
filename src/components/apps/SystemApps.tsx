import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BatteryCharging,
  Bluetooth,
  Check,
  ChevronRight,
  Compass,
  Download,
  FileText,
  Folder,
  Image as ImageIcon,
  Layers,
  MapPin,
  Minus,
  Moon,
  Navigation,
  Palette,
  Plane,
  Plus,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Smartphone,
  Star,
  Sun,
  Trash2,
  Volume2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { APP_CATALOG, WALLPAPERS } from '../../os/catalog';
import { playNotificationSound, playRingtonePreview } from '../../os/sound';
import {
  AppId,
  AppStoreCategory,
  IconShape,
  LanguageCode,
  NotificationToneName,
  RingtoneName,
  ThemeAccent,
} from '../../os/types';
import { PhoneOSController } from '../../os/usePhoneOS';
import { AppIcon } from '../os/AppIcon';

/* ---------------- SETTINGS APP ---------------- */
type SettingsSection =
  | null
  | 'general'
  | 'display'
  | 'sound'
  | 'connectivity'
  | 'personalization'
  | 'battery';

export const SettingsApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [section, setSection] = useState<SettingsSection>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const s = os.state.settings;
  const dark = s.darkMode;

  const cardClass = dark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 shadow-sm';

  if (section) {
    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="px-3 py-3 flex items-center gap-2 border-b border-slate-500/15">
          <button
            onClick={() => {
              setSection(null);
              setConfirmReset(false);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-500/15"
            aria-label="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-bold capitalize">{section}</h2>
        </div>

        <div className="flex-1 overflow-y-auto phone-scroll p-3.5 space-y-3">
          {section === 'general' && (
            <>
              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <label className="text-[11px] opacity-60 block">Device Name</label>
                <input
                  value={s.deviceName}
                  onChange={(e) => os.updateSettings({ deviceName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}
                />
              </div>

              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <label className="text-[11px] opacity-60 block">OS Language</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ['en', 'English'],
                      ['es', 'Español'],
                      ['fr', 'Français'],
                      ['de', 'Deutsch'],
                    ] as [LanguageCode, string][]
                  ).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => os.updateSettings({ language: code })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium text-left flex items-center justify-between ${
                        s.language === code ? 'bg-sky-600 text-white' : 'bg-slate-500/15'
                      }`}
                    >
                      <span>{label}</span>
                      {s.language === code && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl space-y-2 text-xs ${cardClass}`}>
                <p className="font-semibold">Device Information</p>
                <div className="flex justify-between opacity-75">
                  <span>OS Build</span>
                  <span className="font-mono">AetherOS 4.0.2</span>
                </div>
                <div className="flex justify-between opacity-75">
                  <span>Installed Apps</span>
                  <span className="font-mono tabular-nums">{os.state.installedApps.length}</span>
                </div>
                <div className="flex justify-between opacity-75">
                  <span>Storage Used</span>
                  <span className="font-mono tabular-nums">
                    {os.state.installedApps.reduce((acc, id) => acc + APP_CATALOG[id].sizeMB, 240)} MB
                  </span>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl ${cardClass}`}>
                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="w-full py-2 rounded-xl bg-red-600/15 text-red-400 text-xs font-semibold hover:bg-red-600/25"
                  >
                    Reset Phone to Factory Defaults
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-red-400">
                      This clears all installed apps, photos, notes, and custom settings.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 py-2 rounded-xl bg-slate-500/20 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          os.resetPhone();
                          setConfirmReset(false);
                          setSection(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
                      >
                        Confirm Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {section === 'display' && (
            <>
              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Brightness</span>
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

              <div className={`p-3.5 rounded-2xl flex items-center justify-between ${cardClass}`}>
                <div>
                  <p className="text-xs font-semibold">Appearance</p>
                  <p className="text-[11px] opacity-60">{s.darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                </div>
                <button
                  onClick={() => os.updateSettings({ darkMode: !s.darkMode })}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {s.darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  Switch
                </button>
              </div>

              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <p className="text-xs font-semibold">Screen Auto-Lock Timeout</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 30, 60, 0].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => os.updateSettings({ screenTimeoutSec: sec })}
                      className={`py-1.5 rounded-xl text-xs font-mono ${
                        s.screenTimeoutSec === sec ? 'bg-sky-600 text-white' : 'bg-slate-500/15'
                      }`}
                    >
                      {sec === 0 ? 'Never' : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <p className="text-xs font-semibold">Wallpaper</p>
                <div className="grid grid-cols-3 gap-2">
                  {WALLPAPERS.map((wp) => (
                    <button
                      key={wp.id}
                      onClick={() => os.updateSettings({ wallpaperId: wp.id })}
                      className={`aspect-[9/14] rounded-xl overflow-hidden border-2 relative ${
                        s.wallpaperId === wp.id ? 'border-sky-500' : 'border-transparent'
                      }`}
                    >
                      {wp.type === 'image' ? (
                        <img src={wp.src} alt={wp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full" style={{ background: wp.previewBg }} />
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] py-0.5 truncate px-1">
                        {wp.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {section === 'sound' && (
            <>
              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">System Volume</span>
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

              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <p className="text-xs font-semibold">Ringtone</p>
                {(['Apex Chime', 'Pulse Wave', 'Velvet Bell', 'Horizon'] as RingtoneName[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => {
                      os.updateSettings({ ringtone: tone });
                      playRingtonePreview(tone, s.volume, s.muted);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                      s.ringtone === tone ? 'bg-sky-600 text-white' : 'bg-slate-500/10'
                    }`}
                  >
                    <span>{tone}</span>
                    {s.ringtone === tone && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <p className="text-xs font-semibold">Notification Sound</p>
                {(['Droplet', 'Crystal', 'Soft Tap', 'Beacon'] as NotificationToneName[]).map((nt) => (
                  <button
                    key={nt}
                    onClick={() => {
                      os.updateSettings({ notificationSound: nt });
                      playNotificationSound(nt, s.volume, s.muted);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                      s.notificationSound === nt ? 'bg-sky-600 text-white' : 'bg-slate-500/10'
                    }`}
                  >
                    <span>{nt}</span>
                    {s.notificationSound === nt && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {section === 'connectivity' && (
            <div className={`p-3.5 rounded-2xl space-y-3 ${cardClass}`}>
              {[
                {
                  label: 'Airplane Mode',
                  sub: 'Disables Wi-Fi & cellular radios',
                  val: s.airplaneMode,
                  onToggle: () => os.updateSettings({ airplaneMode: !s.airplaneMode }),
                },
                {
                  label: 'Wi-Fi',
                  sub: s.wifi && !s.airplaneMode ? 'Connected · Aether-5G' : 'Off',
                  val: s.wifi && !s.airplaneMode,
                  onToggle: () => os.updateSettings({ wifi: !s.wifi, airplaneMode: false }),
                },
                {
                  label: 'Bluetooth',
                  sub: s.bluetooth && !s.airplaneMode ? 'Discoverable' : 'Off',
                  val: s.bluetooth && !s.airplaneMode,
                  onToggle: () => os.updateSettings({ bluetooth: !s.bluetooth, airplaneMode: false }),
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">{row.label}</p>
                    <p className="text-[11px] opacity-60">{row.sub}</p>
                  </div>
                  <button
                    onClick={row.onToggle}
                    className={`w-11 h-6 rounded-full p-0.5 transition ${row.val ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        row.val ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {section === 'personalization' && (
            <>
              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <p className="text-xs font-semibold">Icon Shape</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['squircle', 'rounded', 'circle'] as IconShape[]).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => os.updateSettings({ iconShape: shape })}
                      className={`py-2 rounded-xl text-xs capitalize font-medium ${
                        s.iconShape === shape ? 'bg-sky-600 text-white' : 'bg-slate-500/15'
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <p className="text-xs font-semibold">Accent Theme</p>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      ['cobalt', 'bg-sky-600'],
                      ['emerald', 'bg-emerald-600'],
                      ['amber', 'bg-amber-500'],
                      ['rose', 'bg-rose-600'],
                    ] as [ThemeAccent, string][]
                  ).map(([accent, color]) => (
                    <button
                      key={accent}
                      onClick={() => os.updateSettings({ themeAccent: accent })}
                      className={`py-2 rounded-xl flex items-center justify-center border-2 ${
                        s.themeAccent === accent ? 'border-white' : 'border-transparent'
                      } ${color} text-white text-[11px] capitalize font-semibold`}
                    >
                      {accent}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <p className="text-xs font-semibold">Rearrange Home Screen Apps</p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto phone-scroll pr-1">
                  {os.state.installedApps.map((id, idx) => (
                    <div
                      key={id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-500/10 text-xs"
                    >
                      <span className="truncate">{APP_CATALOG[id].name}</span>
                      <div className="flex gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => os.moveHomeApp(id, -1)}
                          className="p-1 rounded bg-slate-500/20 disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={idx === os.state.installedApps.length - 1}
                          onClick={() => os.moveHomeApp(id, 1)}
                          className="p-1 rounded bg-slate-500/20 disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {section === 'battery' && (
            <>
              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-mono tabular-nums font-bold">{s.batteryLevel}%</p>
                    <p className="text-[11px] opacity-60">Healthy · Peak Performance</p>
                  </div>
                  <BatteryCharging className="w-7 h-7 text-emerald-500" />
                </div>
                <div className="h-2.5 rounded-full bg-slate-500/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.batterySaver ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${s.batteryLevel}%` }}
                  />
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl flex items-center justify-between ${cardClass}`}>
                <div>
                  <p className="text-xs font-semibold">Battery Saver Mode</p>
                  <p className="text-[11px] opacity-60">Reduces background power draw</p>
                </div>
                <button
                  onClick={() => os.updateSettings({ batterySaver: !s.batterySaver })}
                  className={`w-11 h-6 rounded-full p-0.5 transition ${s.batterySaver ? 'bg-amber-500' : 'bg-slate-600'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      s.batterySaver ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className={`p-3.5 rounded-2xl space-y-2 ${cardClass}`}>
                <p className="text-xs font-semibold">Battery Usage by App</p>
                {[
                  { name: 'Camera', pct: 31 },
                  { name: 'App Store', pct: 22 },
                  { name: 'YouTube', pct: 19 },
                  { name: 'Messages', pct: 16 },
                  { name: 'Music', pct: 12 },
                ].map((u) => (
                  <div key={u.name} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>{u.name}</span>
                      <span className="font-mono tabular-nums">{u.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-500/15 overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${u.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const menu = [
    { id: 'general', label: 'General', sub: `${s.deviceName} · Reset`, icon: Smartphone, color: 'bg-slate-600' },
    { id: 'display', label: 'Display', sub: `Brightness ${s.brightness}% · Wallpaper`, icon: Sun, color: 'bg-sky-600' },
    { id: 'sound', label: 'Sound', sub: `Volume ${s.muted ? 'Muted' : `${s.volume}%`} · Tones`, icon: Volume2, color: 'bg-rose-600' },
    { id: 'connectivity', label: 'Connectivity', sub: s.airplaneMode ? 'Airplane Mode' : 'Wi-Fi · Bluetooth', icon: Wifi, color: 'bg-blue-600' },
    { id: 'personalization', label: 'Personalization', sub: 'Icons · Accent · Home Layout', icon: Palette, color: 'bg-violet-600' },
    { id: 'battery', label: 'Battery', sub: `${s.batteryLevel}% · Usage`, icon: BatteryCharging, color: 'bg-emerald-600' },
  ] as const;

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <SettingsIcon className="w-5 h-5 text-slate-400" />
        <h1 className="text-lg font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll px-3.5 pb-4 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${cardClass} hover:opacity-90`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${item.color} text-white flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[11px] opacity-60">{item.sub}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- APP STORE ---------------- */
const STORE_CATEGORIES: ('All' | AppStoreCategory)[] = [
  'All',
  'Games',
  'Social Media',
  'Entertainment',
  'Productivity',
  'Education',
  'Lifestyle',
  'Utilities',
];

export const AppStoreApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [category, setCategory] = useState<'All' | AppStoreCategory>('All');
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState<AppId | null>(null);
  const dark = os.state.settings.darkMode;

  const storeApps = useMemo(() => {
    return Object.values(APP_CATALOG).filter((app) => {
      if (app.preinstalled && app.category === 'System') return false;
      const matchesCat = category === 'All' || app.category === category;
      const matchesSearch =
        app.name.toLowerCase().includes(query.toLowerCase()) ||
        app.description.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [category, query]);

  if (os.state.settings.airplaneMode) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-6 text-center ${dark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
        <WifiOff className="w-9 h-9 text-slate-400 mb-3" />
        <p className="text-sm font-semibold">Cannot Connect to App Store</p>
        <p className="text-xs opacity-60 mt-1">Turn off Airplane Mode to browse and install apps.</p>
      </div>
    );
  }

  if (detailId) {
    const app = APP_CATALOG[detailId];
    const isInstalled = os.state.installedApps.includes(app.id) || os.state.dockApps.includes(app.id);
    const progress = os.installingProgress[app.id];

    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="px-3 py-3 flex items-center gap-2 border-b border-slate-500/15">
          <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-slate-500/15">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold truncate">{app.name}</span>
        </div>

        <div className="flex-1 overflow-y-auto phone-scroll p-4 space-y-4">
          <div className="flex items-center gap-3.5">
            <AppIcon appId={app.id} shape={os.state.settings.iconShape} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold truncate">{app.name}</h2>
              <p className="text-xs opacity-60 truncate">{app.developer}</p>
              <div className="flex items-center gap-2 text-[11px] opacity-70 mt-1">
                <span>{app.category}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {app.rating}
                </span>
                <span>·</span>
                <span className="font-mono">{app.sizeMB} MB</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {progress !== undefined ? (
              <div className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600/20 border border-sky-500/40">
                <div className="flex justify-between text-[11px] font-mono mb-1 text-sky-400">
                  <span>Installing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : isInstalled ? (
              <>
                <button
                  onClick={() => os.openApp(app.id)}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  Open
                </button>
                {!app.preinstalled && (
                  <button
                    onClick={() => os.uninstallApp(app.id)}
                    className="px-4 py-2.5 rounded-xl bg-red-600/15 text-red-400 text-xs font-semibold"
                  >
                    Uninstall
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => os.installApp(app.id)}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download & Install
              </button>
            )}
          </div>

          {/* Interactive Visual Preview Strip */}
          <div className={`p-3.5 rounded-2xl ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
            <p className="text-[11px] font-semibold opacity-60 mb-2">Preview</p>
            <div className={`rounded-xl p-4 ${app.iconBg} ${app.iconColor} flex flex-col justify-between h-32`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{app.name}</span>
                <span className="text-[10px] opacity-75 font-mono">v{app.version}</span>
              </div>
              <div className="space-y-1">
                {app.highlights.map((h) => (
                  <p key={h} className="text-[11px] opacity-90">• {h}</p>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1">About this app</p>
            <p className="text-xs opacity-75 leading-relaxed">{app.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-lg font-bold">App Store</h1>
        <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl ${dark ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}>
          <Search className="w-3.5 h-3.5 opacity-50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games & apps..."
            className="flex-1 bg-transparent text-xs outline-none"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto phone-scroll shrink-0">
        {STORE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition ${
              category === cat
                ? 'bg-sky-600 text-white'
                : dark
                  ? 'bg-slate-900 text-slate-300'
                  : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll px-3 pb-4 space-y-2">
        {storeApps.map((app) => {
          const isInstalled = os.state.installedApps.includes(app.id) || os.state.dockApps.includes(app.id);
          const progress = os.installingProgress[app.id];
          return (
            <div
              key={app.id}
              onClick={() => setDetailId(app.id)}
              className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition ${
                dark ? 'bg-slate-900 hover:bg-slate-800/90' : 'bg-white shadow-sm hover:bg-slate-100'
              }`}
            >
              <AppIcon appId={app.id} shape={os.state.settings.iconShape} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{app.name}</p>
                <p className="text-[11px] opacity-60 truncate">
                  {app.category} · {app.rating} ★ · {app.sizeMB} MB
                </p>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                {progress !== undefined ? (
                  <div className="w-16 text-center">
                    <span className="text-[10px] font-mono text-sky-400">{progress}%</span>
                    <div className="h-1 rounded-full bg-slate-700 mt-1 overflow-hidden">
                      <div className="h-full bg-sky-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : isInstalled ? (
                  <button
                    onClick={() => os.openApp(app.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-500/20 text-sky-400 text-[11px] font-semibold"
                  >
                    Open
                  </button>
                ) : (
                  <button
                    onClick={() => os.installApp(app.id)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-semibold"
                  >
                    Get
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- FILES APP ---------------- */
export const FilesApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [folder, setFolder] = useState<'All' | 'Documents' | 'Downloads' | 'Captures'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dark = os.state.settings.darkMode;

  const list = os.state.files.filter((f) => folder === 'All' || f.folder === folder);
  const selected = os.state.files.find((f) => f.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="px-3 py-3 flex items-center justify-between border-b border-slate-500/15">
          <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-slate-500/15">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold truncate max-w-[190px]">{selected.name}</span>
          <button
            onClick={() => {
              os.deleteFile(selected.id);
              setSelectedId(null);
            }}
            className="p-1.5 rounded-lg text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto phone-scroll">
          {selected.kind === 'image' && selected.mediaSrc && (
            <img src={selected.mediaSrc} alt={selected.name} className="w-full rounded-xl" referrerPolicy="no-referrer" />
          )}
          {selected.kind === 'video' && selected.mediaSrc && (
            <video src={selected.mediaSrc} controls className="w-full rounded-xl" />
          )}
          {selected.kind === 'text' && (
            <pre className="text-xs whitespace-pre-wrap leading-relaxed font-sans">{selected.content}</pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-lg font-bold">Files</h1>
        <div className="flex gap-1.5 mt-2 overflow-x-auto phone-scroll">
          {(['All', 'Documents', 'Downloads', 'Captures'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${
                folder === f ? 'bg-sky-600 text-white' : 'bg-slate-500/15 opacity-75'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto phone-scroll px-3 pb-4 space-y-2">
        {list.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedId(f.id)}
            className={`w-full p-3 rounded-xl flex items-center gap-3 text-left ${
              dark ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white shadow-sm'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center shrink-0">
              {f.kind === 'image' ? (
                <ImageIcon className="w-4 h-4" />
              ) : f.kind === 'text' ? (
                <FileText className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{f.name}</p>
              <p className="text-[11px] opacity-60">{f.folder} · {f.size}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- MAPS APP ---------------- */
const MAP_PLACES = [
  { id: 'p1', name: 'Aether Design Lab', x: 180, y: 210, dist: '1.2 km', eta: '4 min' },
  { id: 'p2', name: 'Harbor Pier Observatory', x: 280, y: 120, dist: '3.6 km', eta: '11 min' },
  { id: 'p3', name: 'Central Transit Hub', x: 105, y: 310, dist: '2.4 km', eta: '8 min' },
  { id: 'p4', name: 'botanical Conservatory', x: 255, y: 335, dist: '4.1 km', eta: '14 min' },
];

export const MapsApp: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string>('p1');
  const [navigating, setNavigating] = useState(false);
  const dark = os.state.settings.darkMode;

  const selected = MAP_PLACES.find((p) => p.id === selectedId) ?? MAP_PLACES[0];

  return (
    <div className={`h-full flex flex-col relative ${dark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      {/* Search Bar */}
      <div className="p-3 z-10">
        <div className={`px-3 py-2 rounded-xl flex items-center gap-2 shadow ${dark ? 'bg-slate-900/95 border border-white/10' : 'bg-white'}`}>
          <MapPin className="w-4 h-4 text-teal-500" />
          <span className="text-xs font-medium flex-1 truncate">{selected.name}</span>
          <span className="text-[11px] font-mono text-teal-400">{selected.eta}</span>
        </div>
      </div>

      {/* Interactive Vector Map Canvas */}
      <div className="flex-1 relative overflow-hidden mx-3 rounded-2xl border border-slate-500/20">
        <svg
          viewBox="0 0 360 440"
          className={`w-full h-full ${dark ? 'bg-[#0c1320]' : 'bg-[#e6edf5]'}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: 'transform 160ms ease-out',
          }}
        >
          {/* Water & Parks */}
          <path d="M 230 0 L 360 0 L 360 155 Q 290 135 230 0 Z" fill={dark ? '#0d263b' : '#b7d7f0'} />
          <rect x="210" y="290" width="95" height="90" rx="14" fill={dark ? '#112a24' : '#c9e6d3'} />
          {/* Street Grid */}
          {[70, 140, 210, 280, 350].map((y) => (
            <line
              key={`h-${y}`}
              x1="0"
              y1={y}
              x2="360"
              y2={y}
              stroke={dark ? '#1e293b' : '#cbd5e1'}
              strokeWidth="8"
            />
          ))}
          {[60, 125, 195, 265, 325].map((x) => (
            <line
              key={`v-${x}`}
              x1={x}
              y1="0"
              x2={x}
              y2="440"
              stroke={dark ? '#1e293b' : '#cbd5e1'}
              strokeWidth="8"
            />
          ))}
          {/* Route Path */}
          <path
            d={`M 180 220 L ${selected.x} 220 L ${selected.x} ${selected.y}`}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={navigating ? '0' : '8 6'}
          />
          {/* User Location */}
          <circle cx="180" cy="220" r="9" fill="#0ea5e9" stroke="#ffffff" strokeWidth="3" />
          {/* Landmarks */}
          {MAP_PLACES.map((p) => (
            <g key={p.id} onClick={() => setSelectedId(p.id)} className="cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={p.id === selectedId ? 10 : 7}
                fill={p.id === selectedId ? '#14b8a6' : '#f59e0b'}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          ))}
        </svg>

        {/* Pan & Zoom Controls */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(2, Number((z + 0.25).toFixed(2))))}
            className="w-8 h-8 rounded-lg bg-slate-900/85 text-white flex items-center justify-center border border-white/10"
            aria-label="Zoom in map"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.25).toFixed(2))))}
            className="w-8 h-8 rounded-lg bg-slate-900/85 text-white flex items-center justify-center border border-white/10"
            aria-label="Zoom out map"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="w-8 h-8 rounded-lg bg-slate-900/85 text-white flex items-center justify-center border border-white/10"
            aria-label="Center map"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Places Drawer */}
      <div className="p-3 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto phone-scroll">
          {MAP_PLACES.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap ${
                p.id === selectedId
                  ? 'bg-teal-600 text-white'
                  : dark
                    ? 'bg-slate-900 text-slate-300'
                    : 'bg-white text-slate-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setNavigating((n) => !n)}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
            navigating ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          {navigating ? `Stop Route (${selected.dist})` : `Start Route · ${selected.dist} (${selected.eta})`}
        </button>
      </div>
    </div>
  );
};
