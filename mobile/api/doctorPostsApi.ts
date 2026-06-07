import api from "./axiosInstance";

export type DoctorPostAttachmentType = "Image" | "File";

export type DoctorPost = {
  id: number;
  userId: number;
  authorName: string;
  authorAvatarBase64?: string | null;
  authorSubtitle?: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: DoctorPostAttachmentType | null;
  createdAt: string;
  updatedAt: string;
};

export type MobileDoctorPostFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export type CreateDoctorPostPayload = {
  content: string;
  file?: MobileDoctorPostFile | null;
};

export type UpdateDoctorPostPayload = {
  content: string;
  file?: MobileDoctorPostFile | null;
  removeAttachment?: boolean;
};

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const FILE_EXTENSIONS = new Set([".pdf", ".docx"]);

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function isDoctorPostImageFile(name: string, mimeType?: string): boolean {
  if (mimeType?.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(fileExtension(name));
}

export function isDoctorPostDocumentFile(name: string, mimeType?: string): boolean {
  if (mimeType === "application/pdf") return true;
  if (mimeType?.includes("wordprocessingml")) return true;
  return FILE_EXTENSIONS.has(fileExtension(name));
}

function normalizePost(raw: Record<string, unknown>): DoctorPost {
  const attachmentType = (raw.attachmentType ?? raw.AttachmentType) as string | null | undefined;
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    authorName: String(raw.authorName ?? raw.AuthorName ?? "Doctor"),
    authorAvatarBase64: (raw.authorAvatarBase64 ?? raw.AuthorAvatarBase64) as string | null | undefined,
    authorSubtitle: (raw.authorSubtitle ?? raw.AuthorSubtitle) as string | null | undefined,
    content: String(raw.content ?? raw.Content ?? ""),
    attachmentUrl: (raw.attachmentUrl ?? raw.AttachmentUrl) as string | null | undefined,
    attachmentType:
      attachmentType === "Image" || attachmentType === "File" ? attachmentType : null,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.UpdatedAt ?? new Date().toISOString()),
  };
}

export async function getDoctorPostsFeed(take = 80): Promise<DoctorPost[]> {
  const { data } = await api.get<{ items?: unknown[]; Items?: unknown[] }>("/doctor-posts/feed", {
    params: { take },
  });
  const items = data?.items ?? data?.Items ?? [];
  return Array.isArray(items)
    ? items
        .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
        .map(normalizePost)
    : [];
}

export async function createDoctorPost(payload: CreateDoctorPostPayload): Promise<DoctorPost> {
  const form = new FormData();
  form.append("content", payload.content);

  if (payload.file) {
    form.append("file", {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.mimeType,
    } as unknown as Blob);
  }

  const { data } = await api.post<Record<string, unknown>>("/doctor-posts", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizePost(data);
}

export async function updateDoctorPost(
  postId: number,
  payload: UpdateDoctorPostPayload,
): Promise<DoctorPost> {
  const form = new FormData();
  form.append("content", payload.content);
  if (payload.removeAttachment) form.append("removeAttachment", "true");
  if (payload.file) {
    form.append("file", {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.mimeType,
    } as unknown as Blob);
  }

  const { data } = await api.put<Record<string, unknown>>(`/doctor-posts/${postId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizePost(data);
}

export async function deleteDoctorPost(postId: number): Promise<void> {
  await api.delete(`/doctor-posts/${postId}`);
}
