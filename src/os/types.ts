import { CountryId } from './countries';

export type AppId =
  // Communication
  | 'phone'
  | 'messages'
  | 'contacts'
  | 'mail'
  // Entertainment
  | 'music'
  | 'gallery'
  | 'camera'
  | 'youtube'
  | 'browser'
  // Productivity
  | 'calendar'
  | 'notes'
  | 'calculator'
  | 'clock'
  | 'weather'
  // System
  | 'settings'
  | 'appstore'
  | 'files'
  | 'maps'
  | 'airport'
  // Downloadable Games
  | 'game_snake'
  | 'game_flappy'
  | 'game_tictactoe'
  | 'game_chess'
  | 'game_racing'
  | 'game_2048'
  | 'game_brick'
  // Downloadable Apps
  | 'app_pulse'
  | 'app_focus'
  | 'app_flashcards'
  | 'app_habits'
  | 'app_unitconv';

export type AppStoreCategory =
  | 'Games'
  | 'Social Media'
  | 'Entertainment'
  | 'Productivity'
  | 'Education'
  | 'Lifestyle'
  | 'Utilities';

export interface AppDefinition {
  id: AppId;
  name: string;
  shortName?: string;
  category: AppStoreCategory | 'Communication' | 'System';
  preinstalled: boolean;
  iconBg: string;
  iconColor: string;
  iconSymbol: string;
  sizeMB: number;
  version: string;
  developer: string;
  rating: number;
  description: string;
  highlights: string[];
}

export interface WallpaperOption {
  id: string;
  name: string;
  type: 'image' | 'gradient';
  src: string;
  previewBg: string;
}

export interface NotificationItem {
  id: string;
  appId: AppId;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  avatarColor: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

export interface MessageThread {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  unread: number;
  messages: ChatMessage[];
}

export interface EmailItem {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  body: string;
  time: string;
  folder: 'inbox' | 'sent';
  unread: boolean;
  starred: boolean;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  color: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface GalleryMedia {
  id: string;
  type: 'photo' | 'video';
  src: string;
  title: string;
  createdAt: number;
  fromCamera?: boolean;
}

export interface AlarmItem {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
}

export interface FileEntry {
  id: string;
  name: string;
  folder: 'Documents' | 'Downloads' | 'Captures' | 'System';
  size: string;
  kind: 'text' | 'image' | 'video' | 'archive';
  content?: string;
  mediaSrc?: string;
  updatedAt: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  coverGradient: string;
  notes: number[];
  tempoMs: number;
}

export type LanguageCode = 'en' | 'es' | 'fr' | 'de';
export type IconShape = 'rounded' | 'squircle' | 'circle';
export type ThemeAccent = 'cobalt' | 'emerald' | 'amber' | 'rose';
export type RingtoneName = 'Apex Chime' | 'Pulse Wave' | 'Velvet Bell' | 'Horizon';
export type NotificationToneName = 'Droplet' | 'Crystal' | 'Soft Tap' | 'Beacon';

export interface PhoneSettings {
  deviceName: string;
  language: LanguageCode;
  brightness: number; // 25..100
  darkMode: boolean;
  wallpaperId: string;
  screenTimeoutSec: number; // 15 | 30 | 60 | 0 (never)
  volume: number; // 0..100
  muted: boolean;
  ringtone: RingtoneName;
  notificationSound: NotificationToneName;
  wifi: boolean;
  bluetooth: boolean;
  airplaneMode: boolean;
  iconShape: IconShape;
  themeAccent: ThemeAccent;
  batteryLevel: number;
  batterySaver: boolean;
}

export type SystemOverlay =
  | null
  | 'notifications'
  | 'controlCenter'
  | 'appSwitcher'
  | 'search';

export interface ActiveCallState {
  contactName: string;
  phone: string;
  startedAt: number;
  muted: boolean;
  speaker: boolean;
}

export interface ActiveTimerState {
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
}

export interface BoardingPass {
  id: string;
  flightNo: string;
  fromCode: string;
  toCode: string;
  fromCountry: CountryId;
  toCountry: CountryId;
  gate: string;
  seat: string;
  issuedAt: number;
  status: 'ready' | 'used';
}

export interface PhoneOSState {
  isLocked: boolean;
  isScreenOn: boolean;
  flashlightOn: boolean;
  activeApp: AppId | null;
  recentApps: AppId[];
  installedApps: AppId[];
  dockApps: AppId[];
  settings: PhoneSettings;
  notifications: NotificationItem[];
  contacts: Contact[];
  threads: MessageThread[];
  emails: EmailItem[];
  events: CalendarEvent[];
  notes: NoteItem[];
  gallery: GalleryMedia[];
  alarms: AlarmItem[];
  files: FileEntry[];
  callHistory: { id: string; name: string; number: string; type: 'outgoing' | 'incoming' | 'missed'; time: string }[];
  gameHighScores: Record<string, number>;
  pulsePosts: { id: string; author: string; handle: string; content: string; likes: number; liked: boolean; time: string }[];
  habits: { id: string; title: string; streak: number; completedToday: boolean }[];
  currentCountry: CountryId;
  visitedCountries: CountryId[];
  boardingPasses: BoardingPass[];
}
