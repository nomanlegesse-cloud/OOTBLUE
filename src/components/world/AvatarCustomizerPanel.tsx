import React from 'react';
import { Backpack, Check, Palette, RotateCcw, Shirt, Sparkles, User, X } from 'lucide-react';
import {
  AVATAR_PRESETS,
  DEFAULT_PLAYER_AVATAR,
  EYE_SWATCHES,
  HAIR_SWATCHES,
  HumanAppearanceOptions,
  OUTFIT_SWATCHES,
  PANTS_SWATCHES,
  SKIN_SWATCHES,
} from './humanModels';

interface AvatarCustomizerPanelProps {
  value: HumanAppearanceOptions;
  onChange: (next: HumanAppearanceOptions) => void;
  onClose: () => void;
}

const HAIR_STYLE_OPTIONS: { id: NonNullable<HumanAppearanceOptions['hairStyle']>; label: string }[] = [
  { id: 'swept', label: 'Swept' },
  { id: 'short', label: 'Short' },
  { id: 'bob', label: 'Bob' },
  { id: 'cap', label: 'Cap' },
];

function toHex(colorNum: number): string {
  return `#${colorNum.toString(16).padStart(6, '0')}`;
}

const SwatchRow: React.FC<{
  label: string;
  colors: number[];
  selected?: number;
  onSelect: (c: number) => void;
}> = ({ label, colors, selected, onSelect }) => (
  <div className="space-y-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {label}
    </span>
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => {
        const active = selected === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect(c)}
            className={`w-6 h-6 rounded-lg border transition flex items-center justify-center ${
              active
                ? 'border-sky-400 ring-2 ring-sky-400/50 scale-110'
                : 'border-white/20 hover:scale-105'
            }`}
            style={{ backgroundColor: toHex(c) }}
            aria-label={`${label} ${toHex(c)}`}
          >
            {active && (
              <Check
                className={`w-3.5 h-3.5 ${
                  c === 0xf8fafc || c === 0xe2e8f0 || c === 0xf7d8c0 ? 'text-slate-900' : 'text-white'
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export const AvatarCustomizerPanel: React.FC<AvatarCustomizerPanelProps> = ({
  value,
  onChange,
  onClose,
}) => {
  const update = (patch: Partial<HumanAppearanceOptions>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute top-16 right-5 z-30 w-[min(340px,92vw)] max-h-[calc(100vh-140px)] overflow-y-auto bg-slate-950/95 text-white rounded-2xl border border-white/15 p-4 shadow-2xl space-y-4"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight">Avatar Studio</h2>
            <p className="text-[11px] text-slate-400">Live 3D character appearance</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_PLAYER_AVATAR)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
            title="Reset to default avatar"
            aria-label="Reset avatar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
            aria-label="Close avatar studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>Style Presets</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange({ ...preset.opts })}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-sky-500 hover:text-slate-950 text-[11px] font-semibold border border-white/10 transition"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hair Style */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Hair &amp; Headwear
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {HAIR_STYLE_OPTIONS.map((opt) => {
            const active = (value.hairStyle ?? 'swept') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ hairStyle: opt.id })}
                className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                  active
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/10'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <SwatchRow
        label="Skin Tone"
        colors={SKIN_SWATCHES}
        selected={value.skinColor}
        onSelect={(skinColor) => update({ skinColor })}
      />

      <SwatchRow
        label="Hair Color"
        colors={HAIR_SWATCHES}
        selected={value.hairColor}
        onSelect={(hairColor) => update({ hairColor })}
      />

      {value.hairStyle === 'cap' && (
        <SwatchRow
          label="Cap Color"
          colors={OUTFIT_SWATCHES}
          selected={value.capColor}
          onSelect={(capColor) => update({ capColor })}
        />
      )}

      <SwatchRow
        label="Eye Color"
        colors={EYE_SWATCHES}
        selected={value.eyeColor}
        onSelect={(eyeColor) => update({ eyeColor })}
      />

      {/* Outfit & Gear */}
      <div className="border-t border-white/10 pt-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => update({ hasJacket: !value.hasJacket })}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
              value.hasJacket
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Jacket: {value.hasJacket ? 'ON' : 'OFF'}</span>
          </button>
          <button
            type="button"
            onClick={() => update({ hasBackpack: !value.hasBackpack })}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
              value.hasBackpack
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Backpack className="w-3.5 h-3.5" />
            <span>Pack: {value.hasBackpack ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {value.hasJacket && (
          <SwatchRow
            label="Jacket Color"
            colors={OUTFIT_SWATCHES}
            selected={value.jacketColor}
            onSelect={(jacketColor) => update({ jacketColor })}
          />
        )}

        <SwatchRow
          label="Shirt Color"
          colors={OUTFIT_SWATCHES}
          selected={value.shirtColor}
          onSelect={(shirtColor) => update({ shirtColor })}
        />

        <SwatchRow
          label="Pants Color"
          colors={PANTS_SWATCHES}
          selected={value.pantsColor}
          onSelect={(pantsColor) => update({ pantsColor })}
        />

        <SwatchRow
          label="Shoes Color"
          colors={OUTFIT_SWATCHES}
          selected={value.shoeColor}
          onSelect={(shoeColor) => update({ shoeColor })}
        />
      </div>

      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Palette className="w-3 h-3 text-sky-400" />
          Drag the world to rotate view
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
        >
          Done
        </button>
      </div>
    </div>
  );
};
