import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

const SESSION_KEYS = ["token", "userId", "role", "name", "email"] as const;

export async function clearSession(): Promise<void> {
  await Promise.all(SESSION_KEYS.map((k) => removeItem(k)));
}
