import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Compass,
  Globe,
  MapPin,
  Plane,
  PlaneTakeoff,
  ShieldCheck,
  Ticket,
  WifiOff,
} from 'lucide-react';
import { COUNTRIES, COUNTRY_MAP, CountryDestination } from '../../os/countries';
import { playTapSound } from '../../os/sound';
import { BoardingPass } from '../../os/types';
import { PhoneOSController } from '../../os/usePhoneOS';

interface AirportAppProps {
  os: PhoneOSController;
  onVisitAirportTerminal?: () => void;
}

type AirportTab = 'fly' | 'passes' | 'passport';

export const AirportApp: React.FC<AirportAppProps> = ({
  os,
  onVisitAirportTerminal,
}) => {
  const [tab, setTab] = useState<AirportTab>('fly');
  const [recentTicket, setRecentTicket] = useState<BoardingPass | null>(null);

  const dark = os.state.settings.darkMode;
  const airplaneMode = os.state.settings.airplaneMode;
  const current = COUNTRY_MAP[os.state.currentCountry] ?? COUNTRY_MAP.ootblue;

  const readyTicketsFromHere = os.state.boardingPasses.filter(
    (bp) => bp.status === 'ready' && bp.fromCountry === current.id,
  );

  const handleBookTicket = (dest: CountryDestination) => {
    if (airplaneMode) return;
    playTapSound(os.state.settings.volume, os.state.settings.muted);
    const issued = os.bookFlightTicket(dest.id);
    if (issued) {
      setRecentTicket(issued);
    }
  };

  const totalDistanceKm = os.state.boardingPasses
    .filter((bp) => bp.status === 'used')
    .reduce((acc, bp) => {
      const d = COUNTRY_MAP[bp.toCountry]?.distanceKm ?? 0;
      return acc + (d > 0 ? d : 4500);
    }, 0);

  const cardClass = dark
    ? 'bg-slate-900 border border-white/10 text-white'
    : 'bg-white border border-slate-200 text-slate-900 shadow-sm';

  return (
    <div
      className={`h-full flex flex-col ${
        dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Airport App Header */}
      <div className="px-4 pt-2 pb-2.5 border-b border-slate-500/15 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center">
            <PlaneTakeoff className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">OOTBLUE Air</h1>
            <p className="text-[10px] opacity-60 leading-tight">
              Now at {current.airportCode} · {current.name}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30">
          {os.state.visitedCountries.length}/{COUNTRIES.length} VISITED
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="px-3.5 pt-2.5 pb-1 shrink-0">
        <div
          className={`grid grid-cols-3 p-1 rounded-xl text-[11px] font-semibold ${
            dark ? 'bg-slate-900' : 'bg-slate-200/80'
          }`}
        >
          {(
            [
              ['fly', 'Flights', Plane],
              ['passes', `Tickets (${readyTicketsFromHere.length})`, Ticket],
              ['passport', 'Passport', Globe],
            ] as [AirportTab, string, React.ComponentType<{ className?: string }>][]
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
                tab === id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Issued Banner (Must Check Passport at Airport NPC) */}
      {recentTicket && (
        <div className="mx-3.5 mt-2 p-3.5 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white shadow-lg shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4" /> Ticket Ready · {recentTicket.flightNo}
            </span>
            <span className="font-mono">
              {recentTicket.fromCode} → {recentTicket.toCode}
            </span>
          </div>
          <p className="text-[11px] text-sky-100 leading-relaxed">
            Bring your <strong>Passport</strong> &amp; this ticket to{' '}
            <strong>Officer Kenji</strong> at the Airport Gate to board!
          </p>
          <div className="flex gap-2">
            {onVisitAirportTerminal && (
              <button
                onClick={() => {
                  setRecentTicket(null);
                  onVisitAirportTerminal();
                }}
                className="flex-1 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-sky-50 transition"
              >
                Go to Passport Control in 3D
              </button>
            )}
            <button
              onClick={() => setRecentTicket(null)}
              className="px-3 py-2 rounded-xl bg-black/25 hover:bg-black/35 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Scroll Area */}
      <div className="flex-1 overflow-y-auto phone-scroll p-3.5 space-y-3">
        {tab === 'fly' && (
          <>
            {/* Airplane Mode Guard */}
            {airplaneMode && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/35 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <WifiOff className="w-4 h-4 shrink-0" />
                  <span>Airplane Mode is On</span>
                </div>
                <p className="text-[11px] opacity-85">
                  Turn off Airplane Mode to book new international flight tickets.
                </p>
                <button
                  onClick={() => os.updateSettings({ airplaneMode: false, wifi: true })}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-bold"
                >
                  Disable Airplane Mode
                </button>
              </div>
            )}

            {/* Current Location + Checkpoint Rule */}
            <div className={`p-3.5 rounded-2xl ${cardClass}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    Current Location · Passport Active
                  </span>
                  <h2 className="text-sm font-bold mt-0.5">
                    {current.city} · {current.name}
                  </h2>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    {current.airportName} ({current.airportCode}) · {current.localTempC}°C{' '}
                    {current.weatherCondition}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-sky-500/15 text-sky-400 font-mono text-xs font-bold shrink-0">
                  {current.airportCode}
                </span>
              </div>

              <div className="mt-2.5 p-2 rounded-xl bg-sky-500/10 border border-sky-400/20 text-[11px] opacity-90 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Step 1: Get a flight ticket below. Step 2: Present your Passport &amp; Ticket at
                  the 3D Airport Passport Control desk to depart!
                </span>
              </div>

              {onVisitAirportTerminal && (
                <button
                  onClick={onVisitAirportTerminal}
                  className="mt-2.5 w-full py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-400/30 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Go to Airport Passport Control in 3D</span>
                </button>
              )}
            </div>

            {/* Available International Departures */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Book Flight Tickets
                </h3>
                <span className="text-[10px] opacity-55">Direct Non-Stop</span>
              </div>

              {COUNTRIES.filter((c) => c.id !== current.id).map((dest) => {
                const visited = os.state.visitedCountries.includes(dest.id);
                const readyTicket = readyTicketsFromHere.find((bp) => bp.toCountry === dest.id);
                return (
                  <div key={dest.id} className={`p-3.5 rounded-2xl space-y-2.5 ${cardClass}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-500/20">
                            {dest.flagLabel}
                          </span>
                          <h4 className="text-sm font-bold truncate">{dest.name}</h4>
                          {visited && (
                            <CheckCircle2
                              className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                              aria-label="Visited"
                            />
                          )}
                        </div>
                        <p className="text-[11px] opacity-75 mt-0.5">
                          {dest.city} · {dest.airportName} ({dest.airportCode})
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-sky-400 shrink-0">
                        {dest.gate}
                      </span>
                    </div>

                    <p className="text-[11px] opacity-75 leading-relaxed">{dest.tagline}</p>

                    <div className="flex items-center justify-between text-[10px] opacity-70 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Compass className="w-3 h-3 text-sky-400" />
                        {dest.landmarkName}
                      </span>
                      <span className="font-mono tabular-nums">
                        {dest.flightDuration} · {dest.localTempC}°C
                      </span>
                    </div>

                    {readyTicket ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ticket Ready ({readyTicket.flightNo})</span>
                        </div>
                        {onVisitAirportTerminal && (
                          <button
                            onClick={onVisitAirportTerminal}
                            className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition"
                          >
                            Board
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        disabled={airplaneMode}
                        onClick={() => handleBookTicket(dest)}
                        className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          airplaneMode
                            ? 'bg-slate-500/20 opacity-50 cursor-not-allowed'
                            : 'bg-sky-600 hover:bg-sky-500 text-white'
                        }`}
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>
                          Get Ticket {current.airportCode} → {dest.airportCode}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'passes' && (
          <div className="space-y-2.5">
            {os.state.boardingPasses.length === 0 ? (
              <div className={`p-6 rounded-2xl text-center space-y-2 ${cardClass}`}>
                <Ticket className="w-8 h-8 mx-auto text-sky-400 opacity-75" />
                <p className="text-xs font-semibold">No Flight Tickets Yet</p>
                <p className="text-[11px] opacity-65">
                  Get a flight ticket in the Flights tab, then present it with your Passport at the
                  Airport Gate!
                </p>
              </div>
            ) : (
              os.state.boardingPasses.map((bp) => {
                const dest = COUNTRY_MAP[bp.toCountry];
                const isReadyHere = bp.status === 'ready' && bp.fromCountry === current.id;
                return (
                  <div
                    key={bp.id}
                    className={`p-3.5 rounded-2xl space-y-2.5 ${cardClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-sky-400">
                          {bp.flightNo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            bp.status === 'ready'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/35'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                          }`}
                        >
                          {bp.status === 'ready' ? 'READY TO BOARD' : 'STAMPED · FLOWN'}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-60">
                        {new Date(bp.issuedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-y border-dashed border-slate-500/25">
                      <div>
                        <p className="text-lg font-mono font-bold">{bp.fromCode}</p>
                        <p className="text-[10px] opacity-60">Departure</p>
                      </div>
                      <Plane className="w-4 h-4 text-sky-400" />
                      <div className="text-right">
                        <p className="text-lg font-mono font-bold">{bp.toCode}</p>
                        <p className="text-[10px] opacity-60">{dest?.name ?? bp.toCountry}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>
                        <span className="opacity-60">Gate </span>
                        <strong className="font-mono">{bp.gate}</strong>
                      </span>
                      <span>
                        <span className="opacity-60">Seat </span>
                        <strong className="font-mono">{bp.seat}</strong>
                      </span>
                      {isReadyHere && onVisitAirportTerminal && (
                        <button
                          onClick={onVisitAirportTerminal}
                          className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                        >
                          Go to Airport Gate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'passport' && (
          <div className="space-y-3">
            {/* Official Citizen Passport Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border border-sky-400/35 text-white shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-sky-300">
                      Official Travel Document
                    </p>
                    <h2 className="text-sm font-bold">OOTBLUE Citizen Passport</h2>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
                  ALWAYS VALID
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                <div>
                  <p className="text-slate-400 text-[10px]">Holder</p>
                  <p className="font-semibold truncate">{os.state.settings.deviceName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Passport No.</p>
                  <p className="font-mono font-bold text-sky-300">OBL-849201</p>
                </div>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl flex items-center justify-between ${cardClass}`}>
              <div>
                <p className="text-[11px] opacity-65">Passport Stamps</p>
                <p className="text-base font-bold mt-0.5">
                  {os.state.visitedCountries.length} of {COUNTRIES.length} Countries
                </p>
                <p className="text-[11px] text-sky-400 font-mono tabular-nums mt-0.5">
                  {totalDistanceKm.toLocaleString()} km flown
                </p>
              </div>
              <Award className="w-9 h-9 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {COUNTRIES.map((c) => {
                const stamped = os.state.visitedCountries.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[104px] ${
                      stamped
                        ? dark
                          ? 'bg-slate-900 border-sky-400/35'
                          : 'bg-white border-sky-300 shadow-sm'
                        : 'bg-slate-500/5 border-dashed border-slate-500/25 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sky-400">
                        {c.airportCode}
                      </span>
                      {stamped && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-bold leading-tight">{c.name}</p>
                      <p className="text-[10px] opacity-65 mt-0.5 line-clamp-2">
                        {stamped ? c.landmarkName : 'Fly here to earn stamp'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
