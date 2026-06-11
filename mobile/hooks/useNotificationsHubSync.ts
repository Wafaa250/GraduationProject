import { useEffect } from "react";

import type { GraduationNotification } from "@/api/notificationsApi";
import {
  subscribeNotificationCreated,
  subscribeNotificationsHubReconnect,
} from "@/lib/notificationsHub";

type Options = {
  enabled?: boolean;
  onCreated?: (notification: GraduationNotification) => void;
  onReconnect?: () => void;
};

/** Subscribe to SignalR notification events and refresh callbacks (parity with web inbox hub). */
export function useNotificationsHubSync({
  enabled = true,
  onCreated,
  onReconnect,
}: Options): void {
  useEffect(() => {
    if (!enabled) return;

    const unsubCreated = subscribeNotificationCreated((payload) => {
      onCreated?.(payload);
    });
    const unsubReconnect = subscribeNotificationsHubReconnect(() => {
      onReconnect?.();
    });

    return () => {
      unsubCreated();
      unsubReconnect();
    };
  }, [enabled, onCreated, onReconnect]);
}
