import Constants from 'expo-constants'
import { Platform } from 'react-native'

const API_PORT = 5262

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (trimmed.toLowerCase().endsWith('/api')) return trimmed
  return `${trimmed}/api`
}

/** Expo dev server host (e.g. 192.168.x.x) when using Expo Go / LAN — API runs on same machine. */
function devMachineHostFromExpo(): string | null {
  const uri = Constants.expoConfig?.hostUri
  if (!uri || typeof uri !== 'string') return null
  const host = uri.split(':')[0]?.trim()
  if (!host || host === 'localhost' || host === '127.0.0.1') return null
  return host
}

/**
 * REST base URL including `/api`, e.g. `http://localhost:5262/api`.
 * Override with `EXPO_PUBLIC_API_BASE_URL` (with or without trailing `/api`).
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
  if (fromEnv) return normalizeApiBaseUrl(fromEnv)

  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}/api`
  }

  const lan = devMachineHostFromExpo()
  if (lan) {
    return `http://${lan}:${API_PORT}/api`
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api`
  }

  return `http://localhost:${API_PORT}/api`
}
