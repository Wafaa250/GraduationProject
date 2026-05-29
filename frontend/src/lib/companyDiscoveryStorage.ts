const compareKey = (requestId: number) => `cw-compare-recs-${requestId}`;

export function getCompareStudentIds(requestId: number): number[] {
  try {
    const raw = localStorage.getItem(compareKey(requestId));
    if (!raw) return [];
    return (JSON.parse(raw) as number[]).filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}

export function toggleCompareStudent(requestId: number, studentProfileId: number): number[] {
  const list = getCompareStudentIds(requestId);
  const idx = list.indexOf(studentProfileId);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else if (list.length < 4) {
    list.push(studentProfileId);
  }
  localStorage.setItem(compareKey(requestId), JSON.stringify(list));
  return list;
}
