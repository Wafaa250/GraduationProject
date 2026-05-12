import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Auth/session key-value storage.
 * - iOS / Android / Expo Go: `expo-secure-store` (Keychain / Keystore).
 * - Web: `sessionStorage` (SecureStore native module is unavailable in the browser).
 */
const WEB_KEY_PREFIX = "gp.mobile.auth.";

function webStorage(): Storage | null {
    if (typeof globalThis === "undefined") return null;
    const g = globalThis as { sessionStorage?: Storage };
    return g.sessionStorage ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
        const s = webStorage();
        if (!s) return;
        try {
            s.setItem(WEB_KEY_PREFIX + key, value);
        } catch {
            /* quota / private mode */
        }
        return;
    }
    await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
        const s = webStorage();
        if (!s) return null;
        try {
            return s.getItem(WEB_KEY_PREFIX + key);
        } catch {
            return null;
        }
    }
    return SecureStore.getItemAsync(key);
}

export async function removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
        const s = webStorage();
        if (!s) return;
        try {
            s.removeItem(WEB_KEY_PREFIX + key);
        } catch {
            /* ignore */
        }
        return;
    }
    try {
        await SecureStore.deleteItemAsync(key);
    } catch {
        /* missing key is fine */
    }
}

const SESSION_KEYS = ["token", "userId", "role", "name", "email"] as const;

export async function clearSession(): Promise<void> {
    await Promise.all(SESSION_KEYS.map((k) => removeItem(k)));
}
