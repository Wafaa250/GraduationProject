import * as signalR from "@microsoft/signalr";

import { getItem } from "@/utils/authStorage";
import { getNotificationsHubUrl } from "@/utils/notificationsHubUrl";

type CreatedListener = (payload: unknown) => void;

const listeners = new Set<CreatedListener>();
let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;

function broadcast(payload: unknown) {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

async function ensureHub(): Promise<void> {
  if (connection?.state === signalR.HubConnectionState.Connected) return;
  if (startPromise) return startPromise;

  const conn = new signalR.HubConnectionBuilder()
    .withUrl(getNotificationsHubUrl(), {
      accessTokenFactory: async () => ((await getItem("token")) ?? "").trim(),
    })
    .withAutomaticReconnect()
    .build();

  conn.on("NotificationCreated", (payload: unknown) => {
    broadcast(payload);
  });

  connection = conn;
  startPromise = conn
    .start()
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      startPromise = null;
    });

  return startPromise;
}

async function stopHubIfIdle(): Promise<void> {
  if (listeners.size > 0) return;
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

/**
 * Subscribe to `NotificationCreated` on the shared notifications hub (singleton).
 * Used for inbox list updates and dashboard bell badge refreshes without duplicating hub wiring.
 */
export function subscribeInboxNotificationCreated(listener: CreatedListener): () => void {
  listeners.add(listener);
  void ensureHub();
  return () => {
    listeners.delete(listener);
    void stopHubIfIdle();
  };
}
