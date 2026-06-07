import { getItem, setItem } from "@/utils/authStorage";

function compareKey(requestId: number): string {
  return `cw-compare-recs-${requestId}`;
}

export async function getCompareStudentIds(requestId: number): Promise<number[]> {
  try {
    const raw = await getItem(compareKey(requestId));
    if (!raw) return [];
    return (JSON.parse(raw) as number[]).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}

export async function toggleCompareStudent(
  requestId: number,
  studentProfileId: number,
): Promise<number[]> {
  const list = await getCompareStudentIds(requestId);
  const idx = list.indexOf(studentProfileId);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else if (list.length < 4) {
    list.push(studentProfileId);
  }
  await setItem(compareKey(requestId), JSON.stringify(list));
  return list;
}
