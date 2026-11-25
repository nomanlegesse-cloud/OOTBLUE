import React from 'react';
import {
  Bird,
  BookOpen,
  Calculator,
  Calendar,
  Camera,
  Car,
  CheckCircle2,
  Clock,
  CloudSun,
  Crown,
  FileText,
  Folder,
  Gamepad2,
  Globe,
  Grid3x3,
  Hash,
  Heart,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageSquare,
  Music,
  Phone,
  PlaneTakeoff,
  Play,
  Settings,
  ShoppingBag,
  Sliders,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { APP_CATALOG } from '../../os/catalog';
import { AppId, IconShape } from '../../os/types';

interface AppIconProps {
  appId: AppId;
  shape: IconShape;
  size?: 'sm' | 'md' | 'lg';
  badge?: number;
}

const SYMBOL_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  phone: Phone,
  message: MessageSquare,
  users: Users,
  mail: Mail,
  music: Music,
  image: ImageIcon,
  camera: Camera,
  play: Play,
  globe: Globe,
  calendar: Calendar,
  filetext: FileText,
  calculator: Calculator,
  clock: Clock,
  cloudsun: CloudSun,
  settings: Settings,
  store: ShoppingBag,
  folder: Folder,
  mappin: MapPin,
  airport: PlaneTakeoff,
  gamepad: Gamepad2,
  bird: Bird,
  grid: Grid3x3,
  crown: Crown,
  car: Car,
  hash: Hash,
  zap: Zap,
  heart: Heart,
  target: Target,
  book: BookOpen,
  check: CheckCircle2,
  sliders: Sliders,
};

export const AppIcon: React.FC<AppIconProps> = ({
  appId,
  shape,
  size = 'md',
  badge = 0,
}) => {
  const app = APP_CATALOG[appId];
  const IconComp = SYMBOL_MAP[app.iconSymbol] ?? Settings;

  const radiusClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'squircle'
        ? 'rounded-[15px]'
        : 'rounded-xl';

  const dimClass =
    size === 'sm'
      ? 'w-9 h-9'
      : size === 'lg'
        ? 'w-14 h-14'
        : 'w-[54px] h-[54px]';

  const iconClass =
    size === 'sm'
      ? 'w-4 h-4'
      : size === 'lg'
        ? 'w-7 h-7'
        : 'w-6 h-6';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <div
        className={`${dimClass} ${radiusClass} ${app.iconBg} ${app.iconColor} flex items-center justify-center shadow-md shadow-black/30 ring-1 ring-white/15 transition-transform duration-150 active:scale-90`}
      >
        <IconComp className={iconClass} />
      </div>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow ring-2 ring-black/50 tabular-nums">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  );
};
