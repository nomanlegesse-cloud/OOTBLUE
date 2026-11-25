import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import express from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { WebSocket, WebSocketServer } from 'ws';
import {
  COUNTRY_CONTEXT_SUMMARIES,
  NpcCatalogItem,
  WORLD_NPCS,
  WorldCountryId,
} from './src/shared/npcCatalog.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type CountryId = WorldCountryId;

interface RemotePlayerState {
  id: string;
  name: string;
  color: number;
  country: CountryId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  moving: boolean;
  drivingKind: 'car' | 'boat' | null;
  updatedAt: number;
}

interface ChatMessageItem {
  id: string;
  playerId: string;
  name: string;
  country: CountryId;
  text: string;
  timestamp: number;
}

interface NpcTurnItem {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const VALID_COUNTRIES = new Set<CountryId>(['ootblue', 'japan', 'france', 'egypt', 'brazil']);
const AVATAR_COLORS = [0x0284c7, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xf43f5e, 0x06b6d4, 0xec4899];

function clampNum(v: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.max(min, Math.min(max, n));
}

function safeCountry(c: unknown): CountryId {
  return typeof c === 'string' && VALID_COUNTRIES.has(c as CountryId)
    ? (c as CountryId)
    : 'ootblue';
}

function safeName(n: unknown, fallback: string): string {
  if (typeof n !== 'string') return fallback;
  const cleaned = n.replace(/[\r\n\t<>]/g, '').trim().slice(0, 24);
  return cleaned || fallback;
}

function safeText(v: unknown, maxLen: number): string {
  if (typeof v !== 'string') return '';
  return v.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function safeSessionId(v: unknown): string {
  if (typeof v !== 'string') return 'default';
  const cleaned = v.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  return cleaned || 'default';
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  const players = new Map<string, RemotePlayerState>();
  const sockets = new Map<string, WebSocket>();
  const chatHistory: ChatMessageItem[] = [];
  let nextPlayerSeq = 1;

  // In-memory NPC registry & per-session conversation history
  const npcRegistry = new Map<string, NpcCatalogItem>(
    WORLD_NPCS.map((npc) => [
      npc.id,
      {
        ...npc,
        appearance: { ...npc.appearance },
        lines: npc.lines.map((l) => ({ ...l })),
      },
    ]),
  );
  const npcChatSessions = new Map<string, NpcTurnItem[]>();

  const pruneOldSessions = () => {
    if (npcChatSessions.size <= 400) return;
    const firstKey = npcChatSessions.keys().next().value;
    if (firstKey) npcChatSessions.delete(firstKey);
  };

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      playersOnline: players.size,
      npcCount: npcRegistry.size,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  // List all world NPCs (supports ?role= and ?search= query filters)
  app.get('/api/npcs', (req, res) => {
    const roleFilter = safeText(req.query.role, 60).toLowerCase();
    const searchFilter = safeText(req.query.search, 80).toLowerCase();

    let list = Array.from(npcRegistry.values());
    if (roleFilter) {
      list = list.filter((n) => n.role.toLowerCase().includes(roleFilter));
    }
    if (searchFilter) {
      list = list.filter(
        (n) =>
          n.id.toLowerCase().includes(searchFilter) ||
          n.name.toLowerCase().includes(searchFilter) ||
          n.role.toLowerCase().includes(searchFilter) ||
          n.greeting.toLowerCase().includes(searchFilter),
      );
    }

    res.json({
      ok: true,
      count: list.length,
      npcs: list,
    });
  });

  // Get a single NPC profile by ID
  app.get('/api/npcs/:id', (req, res) => {
    const npcId = safeText(req.params.id, 32).toLowerCase();
    const npc = npcRegistry.get(npcId);
    if (!npc) {
      res.status(404).json({ ok: false, error: `NPC '${npcId}' not found.` });
      return;
    }
    res.json({ ok: true, npc });
  });

  // Update editable NPC fields (role, greeting, personaPrompt) in server memory
  app.patch('/api/npcs/:id', (req, res) => {
    const npcId = safeText(req.params.id, 32).toLowerCase();
    const npc = npcRegistry.get(npcId);
    if (!npc) {
      res.status(404).json({ ok: false, error: `NPC '${npcId}' not found.` });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const updated: NpcCatalogItem = { ...npc };
    let changed = false;

    if (body.role !== undefined) {
      const nextRole = safeText(body.role, 80);
      if (!nextRole) {
        res.status(400).json({ ok: false, error: 'Field "role" must be a non-empty string.' });
        return;
      }
      updated.role = nextRole;
      changed = true;
    }

    if (body.greeting !== undefined) {
      const nextGreeting = safeText(body.greeting, 280);
      if (!nextGreeting) {
        res.status(400).json({ ok: false, error: 'Field "greeting" must be a non-empty string.' });
        return;
      }
      updated.greeting = nextGreeting;
      changed = true;
    }

    if (body.personaPrompt !== undefined) {
      const nextPersona = safeText(body.personaPrompt, 600);
      if (!nextPersona) {
        res
          .status(400)
          .json({ ok: false, error: 'Field "personaPrompt" must be a non-empty string.' });
        return;
      }
      updated.personaPrompt = nextPersona;
      changed = true;
    }

    if (!changed) {
      res.status(400).json({
        ok: false,
        error: 'Provide at least one editable field: role, greeting, or personaPrompt.',
      });
      return;
    }

    npcRegistry.set(npcId, updated);
    res.json({ ok: true, npc: updated });
  });

  // Clear NPC conversation memory for a session
  app.delete('/api/npcs/:id/chat', (req, res) => {
    const npcId = safeText(req.params.id, 32).toLowerCase();
    if (!npcRegistry.has(npcId)) {
      res.status(404).json({ ok: false, error: `NPC '${npcId}' not found.` });
      return;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const sessionId = safeSessionId(req.query.sessionId ?? body.sessionId);
    const sessionKey = `${sessionId}:${npcId}`;
    npcChatSessions.delete(sessionKey);
    res.json({ ok: true, npcId, sessionId, cleared: true });
  });

  // Conversational AI endpoint for any world NPC
  app.post('/api/npcs/:id/chat', async (req, res) => {
    const startedAt = Date.now();
    const npcId = safeText(req.params.id, 32).toLowerCase();
    const npc = npcRegistry.get(npcId);
    if (!npc) {
      res.status(404).json({ ok: false, error: `NPC '${npcId}' not found.` });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const message = safeText(body.message, 400);
    if (!message) {
      res.status(400).json({ ok: false, error: 'Field "message" is required and must be non-empty.' });
      return;
    }

    const countryId = safeCountry(body.country);
    const countryCtx = COUNTRY_CONTEXT_SUMMARIES[countryId];
    const playerName = safeName(body.playerName, 'Traveler');
    const sessionId = safeSessionId(body.sessionId);
    const sessionKey = `${sessionId}:${npcId}`;

    if (body.reset === true) {
      npcChatSessions.delete(sessionKey);
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        ok: false,
        error:
          'GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Settings > Secrets to enable AI NPC replies.',
      });
      return;
    }

    // Use explicit history if supplied, otherwise load server session history
    let priorTurns: NpcTurnItem[] = [];
    if (Array.isArray(body.history)) {
      priorTurns = body.history
        .slice(-8)
        .filter(
          (item): item is { role: 'user' | 'model'; text: string } =>
            Boolean(item) &&
            typeof item === 'object' &&
            (item.role === 'user' || item.role === 'model') &&
            typeof item.text === 'string' &&
            item.text.trim().length > 0,
        )
        .map((item) => ({
          role: item.role,
          text: safeText(item.text, 400),
          timestamp: Date.now(),
        }));
    } else {
      priorTurns = [...(npcChatSessions.get(sessionKey) ?? [])];
    }

    const systemInstruction = [
      `Character Name: ${npc.name}`,
      `Role: ${npc.role}`,
      `Persona: ${npc.personaPrompt}`,
      `Signature Greeting: "${npc.greeting}"`,
      `World Context: You and the player (${playerName}) are currently in ${countryCtx.city}, ${countryCtx.name} (Airport: ${countryCtx.airportName} / ${countryCtx.airportCode}, Landmark: ${countryCtx.landmarkName}, Weather: ${countryCtx.weatherCondition}).`,
      `World Mechanics you know accurately: players walk with WASD, talk with E, press F to drive the Sky Roadster or Trail SUV on roads or pilot the OOTBLUE Speedboat from the east marina slip, rest at Your House to charge their OOTBLUE 1 phone, switch weather in the HUD, customize their avatar in Avatar Studio, and buy flight tickets in the Airport app on their OOTBLUE 1 before clearing Passport Control with Officer Kenji (G).`,
      `Response Rules: Reply completely in character as ${npc.name} in 2 to 4 crisp, helpful sentences. Do not output markdown headers or code blocks.`,
    ].join('\n');

    const contents = [
      ...priorTurns.map((t) => ({
        role: t.role,
        parts: [{ text: t.text }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: message }],
      },
    ];

    try {
      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          break;
        } catch (attemptErr) {
          const msg = attemptErr instanceof Error ? attemptErr.message : '';
          const transient = msg.includes('503') || msg.includes('UNAVAILABLE');
          if (attempt === 0 && transient) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          throw attemptErr;
        }
      }

      const reply = (response?.text ?? '').trim();
      if (!reply) {
        res.status(502).json({
          ok: false,
          error: 'The AI model returned an empty reply. Please try sending your message again.',
        });
        return;
      }

      const nextHistory: NpcTurnItem[] = [
        ...priorTurns,
        { role: 'user' as const, text: message, timestamp: Date.now() },
        { role: 'model' as const, text: reply, timestamp: Date.now() },
      ].slice(-12);

      npcChatSessions.set(sessionKey, nextHistory);
      pruneOldSessions();

      res.json({
        ok: true,
        npcId: npc.id,
        npcName: npc.name,
        role: npc.role,
        country: countryId,
        reply,
        history: nextHistory,
        model: 'gemini-4-hydrogen',
        latencyMs: Date.now() - startedAt,
      });
    } catch (err) {
      let errMsg = err instanceof Error ? err.message : 'Failed to generate NPC reply.';
      try {
        const parsed = JSON.parse(errMsg) as { error?: { message?: string } };
        if (parsed?.error?.message) errMsg = parsed.error.message;
      } catch {
        // Keep plain string message
      }

      const lower = errMsg.toLowerCase();
      let status = 502;
      let friendly = errMsg;

      if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid') || lower.includes('400')) {
        status = 403;
        friendly =
          'Gemini API key was rejected or is invalid. Please check your GEMINI_API_KEY in Settings > Secrets.';
      } else if (lower.includes('429') || lower.includes('resource_exhausted')) {
        status = 429;
        friendly =
          'Gemini API rate limit reached. Please wait a moment and try again.';
      } else if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
        status = 503;
        friendly =
          'The AI model is experiencing temporary high demand. Please retry in a moment.';
      }

      res.status(status).json({
        ok: false,
        error: friendly,
      });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const sendJson = (ws: WebSocket, payload: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  const broadcastAll = (payload: unknown) => {
    const encoded = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  };

  const broadcastExcept = (excludeId: string, payload: unknown) => {
    const encoded = JSON.stringify(payload);
    for (const [id, client] of sockets.entries()) {
      if (id !== excludeId && client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  };

  wss.on('connection', (ws) => {
    const playerId = `p-${Date.now().toString(36)}-${nextPlayerSeq++}`;
    const defaultName = `Traveler ${nextPlayerSeq - 1}`;
    const defaultColor = AVATAR_COLORS[(nextPlayerSeq - 1) % AVATAR_COLORS.length];

    const initialPlayer: RemotePlayerState = {
      id: playerId,
      name: defaultName,
      color: defaultColor,
      country: 'ootblue',
      x: 0,
      y: 0,
      z: 14,
      yaw: Math.PI,
      moving: false,
      drivingKind: null,
      updatedAt: Date.now(),
    };

    players.set(playerId, initialPlayer);
    sockets.set(playerId, ws);

    // Initial full state sync
    sendJson(ws, {
      type: 'welcome',
      playerId,
      players: Array.from(players.values()),
      chat: chatHistory,
    });

    broadcastExcept(playerId, {
      type: 'player:joined',
      player: initialPlayer,
    });

    let alive = true;
    ws.on('pong', () => {
      alive = true;
    });

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(String(raw)) as Record<string, unknown>;
        const current = players.get(playerId);
        if (!current) return;

        if (data.type === 'player:join' || data.type === 'player:move') {
          const updated: RemotePlayerState = {
            ...current,
            name: data.name !== undefined ? safeName(data.name, current.name) : current.name,
            country: data.country !== undefined ? safeCountry(data.country) : current.country,
            x: clampNum(data.x, -140, 140, current.x),
            y: clampNum(data.y, -2, 30, current.y),
            z: clampNum(data.z, -140, 140, current.z),
            yaw: clampNum(data.yaw, -Math.PI * 4, Math.PI * 4, current.yaw),
            moving: Boolean(data.moving),
            drivingKind:
              data.drivingKind === 'car' || data.drivingKind === 'boat'
                ? data.drivingKind
                : null,
            updatedAt: Date.now(),
          };
          players.set(playerId, updated);
          broadcastExcept(playerId, {
            type: 'player:updated',
            player: updated,
          });
        } else if (data.type === 'chat:send') {
          const text = typeof data.text === 'string' ? data.text.replace(/[\r\n\t]/g, ' ').trim().slice(0, 160) : '';
          if (!text) return;
          const msg: ChatMessageItem = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            name: current.name,
            country: current.country,
            text,
            timestamp: Date.now(),
          };
          chatHistory.push(msg);
          if (chatHistory.length > 30) chatHistory.shift();
          broadcastAll({
            type: 'chat:message',
            message: msg,
          });
        }
      } catch {
        // Ignore malformed packets
      }
    });

    const cleanup = () => {
      if (players.has(playerId)) {
        players.delete(playerId);
        sockets.delete(playerId);
        broadcastExcept(playerId, {
          type: 'player:left',
          playerId,
        });
      }
    };

    ws.on('close', cleanup);
    ws.on('error', cleanup);

    const pingInterval = setInterval(() => {
      if (!alive) {
        clearInterval(pingInterval);
        ws.terminate();
        cleanup();
        return;
      }
      alive = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 25000);

    ws.on('close', () => clearInterval(pingInterval));
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ootblue Multiplayer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
