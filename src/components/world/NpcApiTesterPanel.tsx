import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Play,
  Terminal,
  X,
} from 'lucide-react';
import { NpcCatalogItem, WorldCountryId } from '../../shared/npcCatalog';

type ApiPresetId = 'list' | 'get' | 'chat' | 'patch' | 'delete_chat';

interface ApiPreset {
  id: ApiPresetId;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  label: string;
  description: string;
  needsNpcId: boolean;
}

const API_PRESETS: ApiPreset[] = [
  {
    id: 'list',
    method: 'GET',
    label: 'List NPCs',
    description: 'Fetch all world NPCs from the server registry (supports ?search=).',
    needsNpcId: false,
  },
  {
    id: 'get',
    method: 'GET',
    label: 'Inspect NPC',
    description: 'Fetch one NPC profile, coordinates, quick lines, and persona.',
    needsNpcId: true,
  },
  {
    id: 'chat',
    method: 'POST',
    label: 'AI Chat',
    description: 'Send a freeform player message and receive a Gemini AI character reply.',
    needsNpcId: true,
  },
  {
    id: 'patch',
    method: 'PATCH',
    label: 'Edit Persona',
    description: 'Update an NPC greeting, role, or AI persona prompt live on the server.',
    needsNpcId: true,
  },
  {
    id: 'delete_chat',
    method: 'DELETE',
    label: 'Reset Chat',
    description: 'Clear server-side conversation memory for this NPC and session.',
    needsNpcId: true,
  },
];

interface NpcApiTesterPanelProps {
  npcs: NpcCatalogItem[];
  currentCountry: WorldCountryId;
  playerName: string;
  sessionId: string;
  onNpcCatalogUpdated: () => Promise<void> | void;
  onClose: () => void;
}

export const NpcApiTesterPanel: React.FC<NpcApiTesterPanelProps> = ({
  npcs,
  currentCountry,
  playerName,
  sessionId,
  onNpcCatalogUpdated,
  onClose,
}) => {
  const [presetId, setPresetId] = useState<ApiPresetId>('chat');
  const [selectedNpcId, setSelectedNpcId] = useState<string>(npcs[0]?.id ?? 'maya');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [responseText, setResponseText] = useState<string>(
    '{\n  "hint": "Click Send Request to call the live NPC API"\n}',
  );
  const [copiedCurl, setCopiedCurl] = useState(false);

  const activePreset = useMemo(
    () => API_PRESETS.find((p) => p.id === presetId) ?? API_PRESETS[0],
    [presetId],
  );

  const selectedNpc = useMemo(
    () => npcs.find((n) => n.id === selectedNpcId) ?? npcs[0],
    [npcs, selectedNpcId],
  );

  useEffect(() => {
    if (presetId === 'chat') {
      setRequestBody(
        JSON.stringify(
          {
            message: 'What is the coolest thing to do nearby?',
            country: currentCountry,
            playerName,
            sessionId,
          },
          null,
          2,
        ),
      );
    } else if (presetId === 'patch' && selectedNpc) {
      setRequestBody(
        JSON.stringify(
          {
            role: selectedNpc.role,
            greeting: selectedNpc.greeting,
            personaPrompt: selectedNpc.personaPrompt,
          },
          null,
          2,
        ),
      );
    } else {
      setRequestBody('');
    }
  }, [presetId, selectedNpcId, currentCountry, playerName, sessionId, selectedNpc]);

  const targetPath = useMemo(() => {
    if (presetId === 'list') {
      const q = searchQuery.trim();
      return q ? `/api/npcs?search=${encodeURIComponent(q)}` : '/api/npcs';
    }
    if (presetId === 'get') return `/api/npcs/${selectedNpcId}`;
    if (presetId === 'chat') return `/api/npcs/${selectedNpcId}/chat`;
    if (presetId === 'patch') return `/api/npcs/${selectedNpcId}`;
    return `/api/npcs/${selectedNpcId}/chat?sessionId=${encodeURIComponent(sessionId)}`;
  }, [presetId, selectedNpcId, searchQuery, sessionId]);

  const curlSnippet = useMemo(() => {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    if (activePreset.method === 'GET' || activePreset.method === 'DELETE') {
      return `curl -X ${activePreset.method} "${baseUrl}${targetPath}"`;
    }
    const compactBody = requestBody.replace(/\s+/g, ' ').trim();
    return `curl -X ${activePreset.method} "${baseUrl}${targetPath}" -H "Content-Type: application/json" -d '${compactBody.replace(/'/g, "'\\''")}'`;
  }, [activePreset.method, targetPath, requestBody]);

  const handleSend = async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const init: RequestInit = {
        method: activePreset.method,
        headers: {},
      };
      if (activePreset.method === 'POST' || activePreset.method === 'PATCH') {
        try {
          JSON.parse(requestBody);
        } catch {
          setStatusCode(400);
          setStatusOk(false);
          setLatencyMs(0);
          setResponseText(
            JSON.stringify({ ok: false, error: 'Request JSON body is not valid JSON.' }, null, 2),
          );
          setLoading(false);
          return;
        }
        init.headers = { 'Content-Type': 'application/json' };
        init.body = requestBody;
      }

      const res = await fetch(targetPath, init);
      const elapsed = Math.round(performance.now() - t0);
      setStatusCode(res.status);
      setStatusOk(res.ok);
      setLatencyMs(elapsed);

      const rawText = await res.text();
      try {
        const parsed = JSON.parse(rawText);
        setResponseText(JSON.stringify(parsed, null, 2));
      } catch {
        setResponseText(rawText);
      }

      if (res.ok && presetId === 'patch') {
        await onNpcCatalogUpdated();
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - t0);
      setStatusCode(0);
      setStatusOk(false);
      setLatencyMs(elapsed);
      setResponseText(
        JSON.stringify(
          {
            ok: false,
            error: err instanceof Error ? err.message : 'Network error calling NPC API',
          },
          null,
          2,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlSnippet);
      setCopiedCurl(true);
      window.setTimeout(() => setCopiedCurl(false), 1800);
    } catch {
      // Ignore clipboard rejection in restricted contexts
    }
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      className="absolute top-16 right-5 z-30 w-[min(420px,92vw)] max-h-[calc(100vh-140px)] overflow-y-auto bg-slate-950/95 text-white rounded-2xl border border-white/15 p-4 shadow-2xl space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight">NPC API Explorer</h2>
            <p className="text-[11px] text-slate-400">
              Live REST + Gemini AI endpoints
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
          aria-label="Close NPC API explorer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Endpoint Selector Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
        {API_PRESETS.map((preset) => {
          const active = preset.id === presetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setPresetId(preset.id)}
              className={`px-1.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 transition ${
                active
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-300 leading-snug">{activePreset.description}</p>

      {/* Endpoint URL Bar & NPC Picker */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-900 border border-white/10 font-mono text-[11px]">
          <span className="font-bold text-sky-400 shrink-0">{activePreset.method}</span>
          <span className="text-slate-200 truncate">{targetPath}</span>
        </div>

        {activePreset.needsNpcId ? (
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Target NPC</span>
            <select
              value={selectedNpcId}
              onChange={(e) => setSelectedNpcId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white outline-none focus:border-sky-400"
            >
              {npcs.map((npc) => (
                <option key={npc.id} value={npc.id}>
                  {npc.name} ({npc.id}) · {npc.role}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-slate-400">
              Optional Search Filter (?search=)
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. airport, pier, barista"
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white outline-none focus:border-sky-400"
            />
          </label>
        )}

        {(activePreset.method === 'POST' || activePreset.method === 'PATCH') && (
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-slate-400">JSON Request Body</span>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={5}
              spellCheck={false}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-white/15 font-mono text-[11px] leading-relaxed text-slate-100 outline-none focus:border-sky-400 resize-y"
            />
          </label>
        )}
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="flex-1 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{loading ? 'Sending...' : 'Send Request'}</span>
        </button>
        <button
          type="button"
          onClick={handleCopyCurl}
          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
          title="Copy cURL command"
        >
          {copiedCurl ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>Copy cURL</span>
            </>
          )}
        </button>
      </div>

      {/* Response Viewer */}
      <div className="space-y-1.5 pt-1 border-t border-white/10">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Response</span>
          </span>
          <div className="flex items-center gap-2 font-mono tabular-nums">
            {statusCode !== null && (
              <span
                className={`flex items-center gap-1 font-semibold ${
                  statusOk ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {statusOk ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{statusCode === 0 ? 'ERR' : `HTTP ${statusCode}`}</span>
              </span>
            )}
            {latencyMs !== null && (
              <span className="text-slate-400">{latencyMs} ms</span>
            )}
          </div>
        </div>
        <pre className="max-h-52 overflow-auto p-2.5 rounded-xl bg-slate-900 border border-white/10 font-mono text-[11px] leading-relaxed text-sky-100 whitespace-pre-wrap break-words">
          {responseText}
        </pre>
      </div>
    </div>
  );
};
