import * as signalR from "@microsoft/signalr";

export type NotificationCreatedPayload = {
  id?: number;
  Id?: number;
  title?: string;
  Title?: string;
  body?: string;
  Body?: string;
  eventType?: string;
  EventType?: string;
  category?: string;
  Category?: string;
  projectId?: number | null;
  ProjectId?: number | null;
  createdAt?: string;
  CreatedAt?: string;
  readAt?: string | null;
  ReadAt?: string | null;
};

type CreatedListener = (payload: NotificationCreatedPayload) => void;
type ReconnectListener = () => void;

const messageListeners = new Set<CreatedListener>();
const reconnectListeners = new Set<ReconnectListener>();

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function getNotificationsHubUrl(): string {
  const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5262/api").replace(
    /\/$/,
    "",
  );
  const origin = apiBase.replace(/\/api$/i, "");
  return `${origin}/hubs/notifications`;
}

function broadcastMessage(payload: NotificationCreatedPayload): void {
  messageListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* ignore listener errors */
    }
  });
}

function broadcastReconnect(): void {
  reconnectListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore listener errors */
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
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(getNotificationsHubUrl(), {
      accessTokenFactory: () => (localStorage.getItem("token") ?? "").trim(),
    })
    .withAutomaticReconnect()
    .build();

  conn.on("NotificationCreated", (payload: NotificationCreatedPayload) => {
    broadcastMessage(payload);
  });

  conn.onreconnected(() => {
    broadcastReconnect();
  });

  conn.onclose(() => {
    if (messageListeners.size > 0 || reconnectListeners.size > 0) {
      scheduleStartRetry(3000);
    }
  });

  return conn;
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
  }

  const conn = connection;
  startPromise = conn
    .start()
    .then(() => {
      broadcastReconnect();
    })
    .catch(() => {
      scheduleStartRetry(3000);
    })
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

export function subscribeNotificationsHubReconnected(listener: ReconnectListener): () => void {
  reconnectListeners.add(listener);
  void ensureNotificationsHub();
  return () => {
    reconnectListeners.delete(listener);
    void stopHubIfIdle();
  };
}

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
  const id = payload.id ?? payload.Id;
  if (typeof id !== "number") return null;

  return {
    id,
    title: payload.title ?? payload.Title ?? "",
    body: payload.body ?? payload.Body ?? "",
    eventType: payload.eventType ?? payload.EventType ?? "",
    category: payload.category ?? payload.Category ?? "",
    projectId:
      payload.projectId !== undefined
        ? payload.projectId
        : payload.ProjectId !== undefined
          ? payload.ProjectId
          : null,
    createdAt: payload.createdAt ?? payload.CreatedAt ?? new Date().toISOString(),
    readAt: payload.readAt ?? payload.ReadAt ?? null,
  };
}
