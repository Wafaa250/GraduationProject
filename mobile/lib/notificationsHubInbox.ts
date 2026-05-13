import * as signalR from "@microsoft/signalr";

import { getItem } from "@/utils/authStorage";
import { getNotificationsHubUrl } from "@/utils/notificationsHubUrl";

// =============================================================================
// notificationsHubInbox — shared SignalR connection to /hubs/notifications
//
// This is the mobile mirror of the web SignalR wiring in
// `frontend/src/app/components/notifications/GradProjectNotificationBell.tsx`.
//
// We hit the same hub path as the web client:
//     getNotificationsHubUrl() → `${origin}/hubs/notifications`
//
// We use the same event name the backend emits in
// `GraduationProjectNotificationService.PushRealtimeAsync`:
//     "NotificationCreated"
//
// The connection is a singleton across screens (StudentDashboard,
// Notifications inbox, DoctorDashboard, Profile, course details, etc.) so we
// only open one socket per app session.
//
// Lifecycle parity with web (verbatim from `GradProjectNotificationBell`):
//   1. Build connection with `accessTokenFactory` + `withAutomaticReconnect`.
//   2. Register `connection.on("NotificationCreated", ...)` BEFORE `start()`.
//   3. Register `onreconnecting`, `onreconnected`, `onclose` BEFORE `start()`.
//   4. Call `start()`; on success/reconnect, fan out a "reconnected" event so
//      subscribers can re-fetch their slice of state (web calls
//      `refreshUnread()` in `onreconnected` — mobile screens use the
//      `subscribeHubReconnected` channel for the same purpose).
// =============================================================================

type CreatedListener = (payload: unknown) => void;
type ReconnectListener = () => void;

const messageListeners = new Set<CreatedListener>();
const reconnectListeners = new Set<ReconnectListener>();

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

// ── Diagnostic logging ───────────────────────────────────────────────────────
// Temporary instrumentation requested by the team to verify the realtime
// invitation flow on mobile. We log every incoming SignalR payload with the
// fields that matter for the Team Invitations card:
//   category, eventType, projectId, invitationId.
//
// Remove these `console.log` calls once we've confirmed invitation events are
// arriving on device.
function logIncomingPayload(payload: unknown): void {
  if (!payload || typeof payload !== "object") {
    console.log("[notificationsHub] NotificationCreated (non-object payload)", payload);
    return;
  }

  const p = payload as Record<string, unknown>;
  const category = p.category ?? p.Category ?? null;
  const eventType = p.eventType ?? p.EventType ?? null;
  const projectId = p.projectId ?? p.ProjectId ?? null;
  // Backend embeds the invitation id inside the dedup key (e.g. `gp:invite:<id>:<userId>`).
  // We log both the explicit field (if any future payload carries it) and the
  // dedup key so the receiver can confirm the right invitation triggered the event.
  const invitationId = p.invitationId ?? p.InvitationId ?? null;
  const dedupKey = p.dedupKey ?? p.DedupKey ?? null;
  const id = p.id ?? p.Id ?? null;

  console.log("[notificationsHub] NotificationCreated", {
    id,
    category,
    eventType,
    projectId,
    invitationId,
    dedupKey,
  });
}

function broadcastMessage(payload: unknown): void {
  messageListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.log("[notificationsHub] message listener threw", err);
    }
  });
}

function broadcastReconnect(): void {
  reconnectListeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.log("[notificationsHub] reconnect listener threw", err);
    }
  });
}

function scheduleStartRetry(delayMs: number): void {
  if (retryTimer) return;
  if (messageListeners.size === 0 && reconnectListeners.size === 0) return;
  console.log(`[notificationsHub] scheduling start retry in ${delayMs}ms`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void ensureHub();
  }, delayMs);
}

function buildConnection(): signalR.HubConnection {
  const hubUrl = getNotificationsHubUrl();
  console.log("[notificationsHub] building connection ->", hubUrl);

  const conn = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: async () => ((await getItem("token")) ?? "").trim(),
    })
    .withAutomaticReconnect()
    .build();

  // Register handlers BEFORE start() — same order as the web client.
  conn.on("NotificationCreated", (payload: unknown) => {
    logIncomingPayload(payload);
    broadcastMessage(payload);
  });

  conn.onreconnecting((err) => {
    console.log("[notificationsHub] reconnecting", err?.message ?? "");
  });

  conn.onreconnected((connectionId) => {
    console.log("[notificationsHub] reconnected", connectionId ?? "");
    // Mirrors web's `onreconnected → refreshUnread()` — let subscribers
    // re-fetch their slice of state so the UI reflects anything that
    // happened while we were offline (e.g. invitations that arrived
    // during a flaky network window).
    broadcastReconnect();
  });

  conn.onclose((err) => {
    console.log("[notificationsHub] connection closed", err?.message ?? "");
    // `withAutomaticReconnect()` only reconnects after a successful initial
    // start. If the socket closes permanently (e.g. all reconnect attempts
    // were exhausted, or start() itself failed), we manually retry — only
    // while we still have active subscribers.
    if (messageListeners.size > 0 || reconnectListeners.size > 0) {
      scheduleStartRetry(3000);
    }
  });

  return conn;
}

async function ensureHub(): Promise<void> {
  // Already connected — nothing to do.
  if (connection?.state === signalR.HubConnectionState.Connected) return;

  // A start() is already in flight — coalesce.
  if (startPromise) return startPromise;

  // If the previous connection is sitting in Disconnected (e.g. all the
  // automatic-reconnect attempts failed), drop it and build fresh so the
  // SignalR state machine is in a known good state.
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
      console.log(
        "[notificationsHub] started, state=" + conn.state + ", connectionId=" + (conn.connectionId ?? ""),
      );
      // Initial connect mirrors web's `connection.start().then(refreshUnread)`
      // path — let subscribers do an initial re-fetch so any invitation that
      // landed between login and the first dashboard render shows up.
      broadcastReconnect();
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.log("[notificationsHub] start failed:", msg);
      // The most common cause of an early failure is the auth token not yet
      // being available (e.g. immediately after login). Auto-retry — but
      // only while someone still cares about the connection.
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

/**
 * Subscribe to `NotificationCreated` on the shared notifications hub (singleton).
 * Used for inbox list updates, dashboard bell badge refreshes, and the Team
 * Invitations card live refresh — without duplicating hub wiring across screens.
 */
export function subscribeInboxNotificationCreated(listener: CreatedListener): () => void {
  messageListeners.add(listener);
  void ensureHub();
  return () => {
    messageListeners.delete(listener);
    void stopHubIfIdle();
  };
}

/**
 * Subscribe to hub (re)connect events. Fires once after the initial successful
 * `start()` and again after every successful `onreconnected`. Mirrors the web
 * pattern of calling `refreshUnread()` inside `connection.onreconnected` —
 * mobile screens call this to re-fetch the slice of state they own (e.g. the
 * Team Invitations list) so the UI reflects anything that arrived while the
 * socket was down.
 */
export function subscribeHubReconnected(listener: ReconnectListener): () => void {
  reconnectListeners.add(listener);
  void ensureHub();
  return () => {
    reconnectListeners.delete(listener);
    void stopHubIfIdle();
  };
}
