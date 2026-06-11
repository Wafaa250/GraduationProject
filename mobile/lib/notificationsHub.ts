import * as signalR from "@microsoft/signalr";

import { getApiPublicOrigin } from "@/api/axiosInstance";
import type { GraduationNotification } from "@/api/notificationsApi";
import { getItem } from "@/utils/authStorage";

export function getNotificationsHubUrl(): string {
  const origin = getApiPublicOrigin();
  if (!origin) return "http://localhost:5262/hubs/notifications";
  return `${origin.replace(/\/$/, "")}/hubs/notifications`;
}

export type NotificationCreatedPayload = GraduationNotification;

type CreatedListener = (payload: NotificationCreatedPayload) => void;
type ReconnectListener = () => void;

const messageListeners = new Set<CreatedListener>();
const reconnectListeners = new Set<ReconnectListener>();

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function normalizePayload(payload: unknown): NotificationCreatedPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const id = Number(p.id ?? p.Id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    category: String(p.category ?? p.Category ?? ""),
    title: String(p.title ?? p.Title ?? ""),
    body: String(p.body ?? p.Body ?? ""),
    eventType: String(p.eventType ?? p.EventType ?? ""),
    projectId:
      p.projectId != null || p.ProjectId != null
        ? Number(p.projectId ?? p.ProjectId)
        : null,
    dedupKey: (p.dedupKey ?? p.DedupKey ?? null) as string | null,
    createdAt: String(p.createdAt ?? p.CreatedAt ?? new Date().toISOString()),
    readAt: (p.readAt ?? p.ReadAt ?? null) as string | null,
  };
}

function broadcastMessage(payload: unknown): void {
  const normalized = normalizePayload(payload);
  if (!normalized) return;
  messageListeners.forEach((fn) => {
    try {
      fn(normalized);
    } catch {
      /* listener error */
    }
  });
}

function broadcastReconnect(): void {
  reconnectListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* listener error */
    }
  });
}

function scheduleStartRetry(delayMs: number): void {
  if (retryTimer) return;
  if (messageListeners.size === 0 && reconnectListeners.size === 0) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void ensureNotificationsHub();
  }, delayMs);
}

function buildConnection(): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(getNotificationsHubUrl(), {
      accessTokenFactory: async () => (await getItem("token"))?.trim() ?? "",
    })
    .withAutomaticReconnect()
    .build();
}

async function ensureNotificationsHub(): Promise<void> {
  if (connection?.state === signalR.HubConnectionState.Connected) return;
  if (startPromise) return startPromise;

  if (
    connection &&
    connection.state !== signalR.HubConnectionState.Connecting &&
    connection.state !== signalR.HubConnectionState.Reconnecting
  ) {
    try {
      connection.off("NotificationCreated");
      await connection.stop();
    } catch {
      /* ignore */
    }
    connection = null;
  }

  if (!connection) {
    connection = buildConnection();
    connection.on("NotificationCreated", (payload: unknown) => {
      broadcastMessage(payload);
    });
    connection.onreconnected(() => broadcastReconnect());
    connection.onclose(() => {
      if (messageListeners.size > 0 || reconnectListeners.size > 0) {
        scheduleStartRetry(3000);
      }
    });
  }

  const conn = connection;
  startPromise = conn
    .start()
    .then(() => broadcastReconnect())
    .catch(() => scheduleStartRetry(3000))
    .finally(() => {
      startPromise = null;
    });

  return startPromise;
}

async function stopHubIfIdle(): Promise<void> {
  if (messageListeners.size > 0 || reconnectListeners.size > 0) return;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (connection) {
    try {
      connection.off("NotificationCreated");
      await connection.stop();
    } catch {
      /* ignore */
    }
    connection = null;
  }
}

export function subscribeNotificationCreated(listener: CreatedListener): () => void {
  messageListeners.add(listener);
  void ensureNotificationsHub();
  return () => {
    messageListeners.delete(listener);
    void stopHubIfIdle();
  };
}

export function subscribeNotificationsHubReconnect(listener: ReconnectListener): () => void {
  reconnectListeners.add(listener);
  void ensureNotificationsHub();
  return () => {
    reconnectListeners.delete(listener);
    void stopHubIfIdle();
  };
}

export const subscribeNotificationsHubReconnected = subscribeNotificationsHubReconnect;

export function normalizeNotificationCreatedPayload(
  payload: NotificationCreatedPayload,
): {
  id: number;
  title: string;
  body: string;
  eventType: string;
  category: string;
  projectId: number | null;
  createdAt: string;
  readAt: string | null;
} | null {
  const id = payload.id;
  if (typeof id !== "number") return null;

  return {
    id,
    title: payload.title ?? "",
    body: payload.body ?? "",
    eventType: payload.eventType ?? "",
    category: payload.category ?? "",
    projectId: payload.projectId ?? null,
    createdAt: payload.createdAt ?? new Date().toISOString(),
    readAt: payload.readAt ?? null,
  };
}
