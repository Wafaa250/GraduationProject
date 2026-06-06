import { getItem, setItem } from "@/utils/authStorage";

const PINNED_KEY = "messagesPinnedIds";
const MUTED_KEY = "messagesMutedIds";

async function loadIdSet(key: string): Promise<Set<number>> {
  const raw = await getItem(key);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is number => typeof id === "number"));
  } catch {
    return new Set();
  }
}

async function saveIdSet(key: string, ids: Set<number>): Promise<void> {
  await setItem(key, JSON.stringify([...ids]));
}

export async function loadPinnedConversationIds(): Promise<Set<number>> {
  return loadIdSet(PINNED_KEY);
}

export async function loadMutedConversationIds(): Promise<Set<number>> {
  return loadIdSet(MUTED_KEY);
}

export async function togglePinnedConversationId(id: number): Promise<Set<number>> {
  const pinned = await loadPinnedConversationIds();
  if (pinned.has(id)) pinned.delete(id);
  else pinned.add(id);
  await saveIdSet(PINNED_KEY, pinned);
  return pinned;
}

export async function toggleMutedConversationId(id: number): Promise<Set<number>> {
  const muted = await loadMutedConversationIds();
  if (muted.has(id)) muted.delete(id);
  else muted.add(id);
  await saveIdSet(MUTED_KEY, muted);
  return muted;
}
