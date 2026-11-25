import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Hand,
  Maximize2,
  Minimize2,
  Move3d,
  Power,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CameraPreset,
  ChassisFinish,
  Phone3DViewport,
} from './components/Phone3DViewport';
import { World3DViewport } from './components/World3DViewport';
import { PhoneScreenOS } from './components/os/PhoneScreenOS';
import { useMultiplayer } from './hooks/useMultiplayer';
import { usePhoneOS } from './os/usePhoneOS';

export default function App() {
  const os = usePhoneOS();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [activeView, setActiveView] = useState<'world' | 'phone'>('world');
  const [phoneRenderMode, setPhoneRenderMode] = useState<'3d' | 'flat'>('3d');
  const playerStateRef = useRef({
    x: 0,
    z: 14,
    yaw: Math.PI,
    camYaw: 0,
    tokensCollected: [] as string[],
  });
  const multiplayer = useMultiplayer(
    os.state.settings.deviceName,
    os.state.currentCountry,
    playerStateRef.current,
  );

  const [interactionMode, setInteractionMode] = useState<'interact' | 'orbit'>('interact');
  const [chassisFinish, setChassisFinish] = useState<ChassisFinish>('ootblue');
  const [dockExpanded, setDockExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [presetTrigger, setPresetTrigger] = useState<{ preset: CameraPreset; seq: number } | null>(
    null,
  );
  const [zoomTrigger, setZoomTrigger] = useState<{ delta: number; seq: number } | null>(null);
  const [rotateTrigger, setRotateTrigger] = useState<{
    dAzimuth: number;
    dPolar: number;
    seq: number;
  } | null>(null);

  const triggerPreset = (preset: CameraPreset) => {
    setPhoneRenderMode('3d');
    setPresetTrigger((prev) => ({ preset, seq: (prev?.seq ?? 0) + 1 }));
  };

  const triggerZoom = (delta: number) => {
    setPhoneRenderMode('3d');
    setZoomTrigger((prev) => ({ delta, seq: (prev?.seq ?? 0) + 1 }));
  };

  const triggerRotate = (dAzimuth: number, dPolar = 0) => {
    setPhoneRenderMode('3d');
    setRotateTrigger((prev) => ({ dAzimuth, dPolar, seq: (prev?.seq ?? 0) + 1 }));
  };

  const openPhoneView = () => {
    os.wakeScreen();
    setActiveView('phone');
  };

  const handleBoardTicket = (ticketId: string) => {
    const destCountry = os.boardFlightWithTicket(ticketId);
    if (!destCountry) return;
    // Spawn right outside the destination airport arrival terminal in open boulevard view
    playerStateRef.current.x = 74;
    playerStateRef.current.z = -18;
    playerStateRef.current.yaw = -Math.PI / 2;
    playerStateRef.current.camYaw = -Math.PI * 0.12;
    multiplayer.sendMove({
      x: 74,
      y: 0,
      z: -18,
      yaw: -Math.PI / 2,
      moving: false,
      drivingKind: null,
      force: true,
    });
    setActiveView('world');
  };

  const handleOpenAirportApp = () => {
    os.openApp('airport');
    setActiveView('phone');
  };

  const handleVisitAirportTerminal = () => {
    playerStateRef.current.x = 74;
    playerStateRef.current.z = -18;
    playerStateRef.current.yaw = Math.PI / 2;
    playerStateRef.current.camYaw = -Math.PI / 2;
    multiplayer.sendMove({
      x: 74,
      y: 0,
      z: -18,
      yaw: Math.PI / 2,
      moving: false,
      drivingKind: null,
      force: true,
    });
    setActiveView('world');
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (rootRef.current ?? document.documentElement).requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore fullscreen denial in restricted iframes
    }
  };

  const finishes: { id: ChassisFinish; label: string; swatch: string }[] = [
    { id: 'ootblue', label: 'OOTBLUE Sky', swatch: 'bg-[#38bdf8]' },
    { id: 'obsidian', label: 'Obsidian', swatch: 'bg-[#252b36]' },
    { id: 'natural', label: 'Titanium', swatch: 'bg-[#8e8d8a]' },
    { id: 'bronze', label: 'Bronze', swatch: 'bg-[#7a5d4b]' },
  ];

  return (
    <div
      ref={rootRef}
      className="w-screen h-screen bg-[#07090e] text-slate-100 relative overflow-hidden"
    >
      {activeView === 'world' ? (
        <>
          <World3DViewport
            key={os.state.currentCountry}
            os={os}
            currentCountry={os.state.currentCountry}
            multiplayer={multiplayer}
            onBoardTicket={handleBoardTicket}
            onOpenAirportApp={handleOpenAirportApp}
            onOpenPhone={openPhoneView}
            playerStateRef={playerStateRef}
          />

          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-5 sm:top-14 z-20 w-9 h-9 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/15 text-white flex items-center justify-center transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </>
      ) : (
        <>
          {/* Full-Viewport 3D OOTBLUE 1 Canvas */}
          {phoneRenderMode === '3d' ? (
            <Phone3DViewport
              os={os}
              interactionMode={interactionMode}
              chassisFinish={chassisFinish}
              presetTrigger={presetTrigger}
              zoomTrigger={zoomTrigger}
              rotateTrigger={rotateTrigger}
              onVisitAirportTerminal={handleVisitAirportTerminal}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#070b14] pb-20 pt-10 px-4">
              <div
                className="p-2.5 rounded-[52px] shadow-2xl border border-white/20 scale-[0.68] sm:scale-[0.78] lg:scale-[0.88] origin-center"
                style={{
                  background:
                    chassisFinish === 'ootblue'
                      ? 'linear-gradient(155deg, #35aff8, #8bd8ff)'
                      : chassisFinish === 'natural'
                        ? '#8e8d8a'
                        : chassisFinish === 'bronze'
                          ? '#6e5646'
                          : '#242a34',
                }}
              >
                <div className="p-1.5 rounded-[46px] bg-[#06070a]">
                  <PhoneScreenOS
                    os={os}
                    onVisitAirportTerminal={handleVisitAirportTerminal}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Minimal Top-Left Header */}
          <header className="pointer-events-none absolute top-4 left-5 z-20 flex flex-col gap-0.5">
            <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
              OOTBLUE 1
            </h1>
            <p className="text-xs text-slate-400">
              {phoneRenderMode === 'flat'
                ? 'Direct 2D view · Click screen to use OS'
                : interactionMode === 'interact'
                  ? 'Click screen to use OS · Drag background or rails to orbit'
                  : 'Orbit 3D mode active · Drag anywhere to rotate phone'}
            </p>
          </header>

          {/* Top-Right Actions: Back to World, Sleep/Wake, Fullscreen */}
          <div className="absolute top-4 right-5 z-20 flex items-center gap-2">
            <button
              onClick={() => setActiveView('world')}
              className="h-9 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-lg shadow-sky-950/40 transition"
              title="Return to Ootblue Plaza"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to World</span>
            </button>
            <button
              onClick={os.pressPowerButton}
              className="h-9 px-3 rounded-xl bg-[#0e131d]/95 hover:bg-[#172030] border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
              title="Press Power Button"
            >
              <Power className="w-3.5 h-3.5 text-sky-400" />
              <span>{os.state.isScreenOn ? 'Sleep' : 'Wake'}</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-[#0e131d]/95 hover:bg-[#172030] border border-white/10 text-slate-200 flex items-center justify-center transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Collapsible Bottom Control Dock */}
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center max-w-[95vw]"
            style={{
              transform: `translate(-50%, ${dockExpanded ? '0px' : 'calc(100% - 34px)'})`,
              transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <button
              onClick={() => setDockExpanded((v) => !v)}
              className="px-3.5 py-1 rounded-t-xl bg-[#0e131d]/95 border border-b-0 border-white/10 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              {dockExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              <span>{dockExpanded ? 'Hide Controls' : 'Show Controls'}</span>
            </button>

            <div className="px-3 py-2 rounded-2xl bg-[#0d111a]/95 border border-white/12 shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {/* Touch vs Orbit Mode */}
              <div className="flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => {
                    setPhoneRenderMode('3d');
                    setInteractionMode('interact');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition ${
                    phoneRenderMode === '3d' && interactionMode === 'interact'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Touch 3D</span>
                </button>
                <button
                  onClick={() => {
                    setPhoneRenderMode('3d');
                    setInteractionMode('orbit');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition ${
                    phoneRenderMode === '3d' && interactionMode === 'orbit'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Move3d className="w-3.5 h-3.5" />
                  <span>Orbit 3D</span>
                </button>
                <button
                  onClick={() => setPhoneRenderMode((m) => (m === 'flat' ? '3d' : 'flat'))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition ${
                    phoneRenderMode === 'flat'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Flat 2D</span>
                </button>
              </div>

              <div className="hidden sm:block h-5 w-px bg-white/10" />

              {/* Rotate & Zoom Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => triggerRotate(-Math.PI / 6)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 transition"
                  title="Rotate Left"
                  aria-label="Rotate Left"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => triggerRotate(Math.PI / 6)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 transition"
                  title="Rotate Right"
                  aria-label="Rotate Right"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => triggerZoom(-0.75)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 transition"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => triggerZoom(0.75)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 transition"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="hidden sm:block h-5 w-px bg-white/10" />

              {/* Camera View Presets */}
              <div className="flex items-center gap-1">
                {(
                  [
                    ['front', 'Front'],
                    ['hero', 'Angle'],
                    ['back', 'Rear'],
                    ['side', 'Side'],
                  ] as [CameraPreset, string][]
                ).map(([preset, label]) => (
                  <button
                    key={preset}
                    onClick={() => triggerPreset(preset)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-medium text-slate-300 hover:text-white whitespace-nowrap shrink-0 transition"
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => triggerPreset('hero')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white whitespace-nowrap shrink-0 transition"
                >
                  Reset View
                </button>
              </div>

              <div className="hidden sm:block h-5 w-px bg-white/10" />

              {/* Chassis Finish Swatches */}
              <div className="flex items-center gap-1.5" aria-label="Phone Finish">
                {finishes.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setChassisFinish(f.id)}
                    title={`${f.label} Finish`}
                    aria-label={`${f.label} Finish`}
                    className={`w-5 h-5 rounded-full ${f.swatch} border transition ${
                      chassisFinish === f.id
                        ? 'border-white scale-110 ring-2 ring-sky-500/60'
                        : 'border-white/25 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
