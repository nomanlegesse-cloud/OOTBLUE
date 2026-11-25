import { useCallback, useEffect, useRef, useState } from 'react';
import { CountryId } from '../os/countries';

export interface RemotePlayerState {
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

export interface WorldChatMessage {
  id: string;
  playerId: string;
  name: string;
  country: CountryId;
  text: string;
  timestamp: number;
}

export function useMultiplayer(
  playerName: string,
  currentCountry: CountryId,
  initialPos: { x: number; z: number; yaw: number },
) {
  const [connected, setConnected] = useState(false);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<RemotePlayerState[]>([]);
  const [chatMessages, setChatMessages] = useState<WorldChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const remotePlayersRef = useRef<Map<string, RemotePlayerState>>(new Map());
  const latestMetaRef = useRef({
    name: playerName,
    country: currentCountry,
    x: initialPos.x,
    y: 0,
    z: initialPos.z,
    yaw: initialPos.yaw,
    moving: false,
    drivingKind: null as 'car' | 'boat' | null,
  });
  latestMetaRef.current.name = playerName;
  latestMetaRef.current.country = currentCountry;

  const lastSentAtRef = useRef(0);

  const syncOnlineList = useCallback(() => {
    setOnlinePlayers(Array.from(remotePlayersRef.current.values()));
  }, []);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: number | null = null;
    let backoffMs = 1000;

    const connect = () => {
      if (disposed) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) {
          ws.close();
          return;
        }
        backoffMs = 1000;
        setConnected(true);
        const m = latestMetaRef.current;
        ws.send(
          JSON.stringify({
            type: 'player:join',
            name: m.name,
            country: m.country,
            x: m.x,
            y: m.y,
            z: m.z,
            yaw: m.yaw,
            moving: false,
            drivingKind: m.drivingKind,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as Record<string, unknown>;
          if (msg.type === 'welcome' && typeof msg.playerId === 'string') {
            selfIdRef.current = msg.playerId;
            setSelfId(msg.playerId);
            remotePlayersRef.current.clear();
            const list = Array.isArray(msg.players) ? (msg.players as RemotePlayerState[]) : [];
            for (const p of list) {
              if (p.id !== msg.playerId) {
                remotePlayersRef.current.set(p.id, p);
              }
            }
            syncOnlineList();
            if (Array.isArray(msg.chat)) {
              setChatMessages(msg.chat as WorldChatMessage[]);
            }
          } else if (msg.type === 'player:joined' && msg.player) {
            const p = msg.player as RemotePlayerState;
            if (p.id !== selfIdRef.current) {
              remotePlayersRef.current.set(p.id, p);
              syncOnlineList();
            }
          } else if (msg.type === 'player:updated' && msg.player) {
            const p = msg.player as RemotePlayerState;
            if (p.id !== selfIdRef.current) {
              const prev = remotePlayersRef.current.get(p.id);
              remotePlayersRef.current.set(p.id, p);
              if (!prev || prev.country !== p.country || prev.name !== p.name) {
                syncOnlineList();
              }
            }
          } else if (msg.type === 'player:left' && typeof msg.playerId === 'string') {
            if (remotePlayersRef.current.delete(msg.playerId)) {
              syncOnlineList();
            }
          } else if (msg.type === 'chat:message' && msg.message) {
            const chatItem = msg.message as WorldChatMessage;
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === chatItem.id)) return prev;
              return [...prev, chatItem].slice(-30);
            });
          }
        } catch {
          // Ignore invalid socket messages
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnected(false);
        wsRef.current = null;
        reconnectTimer = window.setTimeout(connect, backoffMs);
        backoffMs = Math.min(5000, Math.round(backoffMs * 1.5));
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [syncOnlineList]);

  // Immediately push country or name update over open socket
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const m = latestMetaRef.current;
    ws.send(
      JSON.stringify({
        type: 'player:move',
        name: playerName,
        country: currentCountry,
        x: m.x,
        y: m.y,
        z: m.z,
        yaw: m.yaw,
        moving: false,
        drivingKind: m.drivingKind,
      }),
    );
  }, [playerName, currentCountry]);

  const sendMove = useCallback(
    (pos: {
      x: number;
      y: number;
      z: number;
      yaw: number;
      moving: boolean;
      drivingKind: 'car' | 'boat' | null;
      force?: boolean;
    }) => {
      latestMetaRef.current.x = pos.x;
      latestMetaRef.current.y = pos.y;
      latestMetaRef.current.z = pos.z;
      latestMetaRef.current.yaw = pos.yaw;
      latestMetaRef.current.moving = pos.moving;
      latestMetaRef.current.drivingKind = pos.drivingKind;

      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const now = performance.now();
      if (!pos.force && now - lastSentAtRef.current < 50) return;
      lastSentAtRef.current = now;

      ws.send(
        JSON.stringify({
          type: 'player:move',
          name: latestMetaRef.current.name,
          country: latestMetaRef.current.country,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          yaw: pos.yaw,
          moving: pos.moving,
          drivingKind: pos.drivingKind,
        }),
      );
    },
    [],
  );

  const sendChat = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'chat:send', text: trimmed }));
  }, []);

  return {
    connected,
    selfId,
    onlinePlayers,
    remotePlayersRef,
    chatMessages,
    sendMove,
    sendChat,
  };
}

export type MultiplayerController = ReturnType<typeof useMultiplayer>;
