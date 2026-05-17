import type { CompanyTalentSearchResult } from '../../../api/companyApi'

export type PersistedTalentSearchState = {
  title: string
  description: string
  skills: string[]
  preferredMajor: string
  engagementType: string
  duration: string
  result: CompanyTalentSearchResult | null
}

const PREFIX = 'skillswap_company_talent_search'

function storageKey(): string {
  const userId = localStorage.getItem('userId') ?? 'anonymous'
  return `${PREFIX}_${userId}`
}

export function loadTalentSearchState(): PersistedTalentSearchState | null {
  try {
    const raw = sessionStorage.getItem(storageKey())
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedTalentSearchState
    if (!parsed || typeof parsed !== 'object') return null
    return {
      title: parsed.title ?? '',
      description: parsed.description ?? '',
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      preferredMajor: parsed.preferredMajor ?? '',
      engagementType: parsed.engagementType ?? '',
      duration: parsed.duration ?? '',
      result: parsed.result ?? null,
    }
  } catch {
    return null
  }
}

export function saveTalentSearchState(state: PersistedTalentSearchState): void {
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify(state))
  } catch {
    /* quota or private mode */
  }
}

export function clearTalentSearchState(): void {
  try {
    sessionStorage.removeItem(storageKey())
  } catch {
    /* ignore */
  }
}

export function getInitialTalentSearchState(): PersistedTalentSearchState {
  return (
    loadTalentSearchState() ?? {
      title: '',
      description: '',
      skills: [],
      preferredMajor: '',
      engagementType: '',
      duration: '',
      result: null,
    }
  )
}
