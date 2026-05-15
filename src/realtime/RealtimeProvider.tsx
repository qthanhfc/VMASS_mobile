import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { REALTIME_URL, TOKEN_STORAGE_KEY } from '../services/config';

export type RealtimeEvent = {
  eventId: string;
  scope: string;
  action: string;
  schemaVersion: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

type RealtimeContextValue = {
  connected: boolean;
  subscribe: (listener: (event: RealtimeEvent) => void) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const IDENTITY_SYNC_INTERVAL_MS = 15000;
const EVENT_DEDUP_TTL_MS = 10000;

const SCOPED_CHANNELS = [
  'orders',
  'products',
  'inventory',
  'customers',
  'suppliers',
  'promotions',
  'staff',
  'returns',
  'dashboard',
  'bookkeeping',
  'tax',
  'messages',
  'feedback',
] as const;

const LEGACY_ACTION_BRIDGES: Array<{ scope: string; action: string }> = [
  { scope: 'orders', action: 'refresh-recent-order' },
  { scope: 'orders', action: 'refresh-created-order' },
  { scope: 'orders', action: 'refresh-pending-order' },
  { scope: 'orders', action: 'refresh-done-order' },
  { scope: 'inventory', action: 'refresh-stock' },
  { scope: 'dashboard', action: 'refresh-bestseller' },
  { scope: 'messages', action: 'broadcast' },
];

const safeText = (value: unknown) => String(value || '').trim();

const decodeBase64 = (value: string): string | null => {
  try {
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(value);
    }

    const maybeBuffer = (globalThis as { Buffer?: { from: (input: string, encoding: string) => { toString: (enc: string) => string } } }).Buffer;
    if (maybeBuffer && typeof maybeBuffer.from === 'function') {
      return maybeBuffer.from(value, 'base64').toString('utf8');
    }
  } catch {
    return null;
  }

  return null;
};

const parseJwtUserId = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4 || 4)) % 4)}`;
    const payloadText = decodeBase64(padded);
    if (!payloadText) return null;
    const payload = JSON.parse(payloadText);
    return (
      safeText(payload?._id) ||
      safeText(payload?.id) ||
      safeText(payload?.user_id) ||
      safeText(payload?.user?._id) ||
      safeText(payload?.user?.id) ||
      null
    );
  } catch {
    return null;
  }
};

const normalizeRealtimeEvent = (
  raw: unknown,
  fallbackScope?: string,
  fallbackAction?: string,
): RealtimeEvent | null => {
  const nowIso = new Date().toISOString();
  const defaultScope = safeText(fallbackScope);
  const defaultAction = safeText(fallbackAction);

  if (raw && typeof raw === 'object') {
    const source = raw as Partial<RealtimeEvent>;
    const scope = safeText(source.scope) || defaultScope;
    const action = safeText(source.action) || defaultAction;
    if (!scope || !action) return null;

    const payloadValue = source.payload;
    const payload =
      payloadValue && typeof payloadValue === 'object' && !Array.isArray(payloadValue)
        ? (payloadValue as Record<string, unknown>)
        : {};

    return {
      eventId: safeText(source.eventId) || `${Date.now()}-${scope}-${action}-${Math.random().toString(36).slice(2, 8)}`,
      scope,
      action,
      schemaVersion: safeText(source.schemaVersion) || '1.0',
      timestamp: safeText(source.timestamp) || nowIso,
      payload,
    };
  }

  if (!defaultScope || !defaultAction) return null;

  return {
    eventId: `${Date.now()}-${defaultScope}-${defaultAction}-${Math.random().toString(36).slice(2, 8)}`,
    scope: defaultScope,
    action: defaultAction,
    schemaVersion: 'legacy-bridge',
    timestamp: nowIso,
    payload: {},
  };
};

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef(new Set<(event: RealtimeEvent) => void>());
  const roomIdRef = useRef<string | null>(null);
  const recentEventRef = useRef(new Map<string, number>());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(REALTIME_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socketRef.current = socket;

    const emitToListeners = (event: RealtimeEvent) => {
      const now = Date.now();
      for (const [eventId, ts] of recentEventRef.current.entries()) {
        if (now - ts > EVENT_DEDUP_TTL_MS) {
          recentEventRef.current.delete(eventId);
        }
      }

      if (recentEventRef.current.has(event.eventId)) {
        return;
      }
      recentEventRef.current.set(event.eventId, now);

      listenersRef.current.forEach((listener) => listener(event));
    };

    const emitFromRaw = (raw: unknown, fallbackScope?: string, fallbackAction?: string) => {
      const event = normalizeRealtimeEvent(raw, fallbackScope, fallbackAction);
      if (event) emitToListeners(event);
    };

    const syncRoomIdentity = async () => {
      if (!socket.connected) return;
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      const nextRoomId = parseJwtUserId(token);
      const prevRoomId = roomIdRef.current;

      if (prevRoomId && prevRoomId !== nextRoomId) {
        socket.emit('leave room', { room_id: prevRoomId });
        roomIdRef.current = null;
      }

      if (nextRoomId && nextRoomId !== roomIdRef.current) {
        socket.emit('join room', { room_id: nextRoomId });
        roomIdRef.current = nextRoomId;
      }
    };

    socket.on('connect', () => {
      setConnected(true);
      void syncRoomIdentity();
    });
    socket.on('disconnect', () => {
      setConnected(false);
      roomIdRef.current = null;
    });

    socket.on('vmass:data-changed', (event: unknown) => emitFromRaw(event));
    SCOPED_CHANNELS.forEach((scope) => {
      socket.on(`vmass:${scope}`, (event: unknown) => emitFromRaw(event, scope));
    });

    LEGACY_ACTION_BRIDGES.forEach(({ scope, action }) => {
      socket.on(action, () => {
        emitFromRaw(null, scope, action);
      });
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (!socket.connected) {
        socket.connect();
      }
      void syncRoomIdentity();
    });

    const identityTimer = setInterval(() => {
      void syncRoomIdentity();
    }, IDENTITY_SYNC_INTERVAL_MS);

    return () => {
      appStateSubscription.remove();
      clearInterval(identityTimer);
      socket.removeAllListeners();
      socket.disconnect();
      roomIdRef.current = null;
      socketRef.current = null;
    };
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      connected,
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [connected],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used inside RealtimeProvider');
  }
  return context;
}
