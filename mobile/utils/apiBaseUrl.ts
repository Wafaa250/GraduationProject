import Constants from 'expo-constants'
import { Platform } from 'react-native'

const API_PORT = 5262

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (trimmed.toLowerCase().endsWith('/api')) return trimmed
  return `${trimmed}/api`
}

function webApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return `http://localhost:${API_PORT}/api`
  }

  const { hostname } = window.location

  return `http://${hostname}:${API_PORT}/api`
}

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()

  if (fromEnv) {
    const url = normalizeApiBaseUrl(fromEnv)
    console.log('API URL (env):', url)
    return url
  }

  if (Platform.OS === 'web') {
    const url = webApiBaseUrl()
    console.log('API URL (web):', url)
    return url
  }

  const url = `http://localhost:${API_PORT}/api`
  console.log('API URL (fallback):', url)
  return url
}