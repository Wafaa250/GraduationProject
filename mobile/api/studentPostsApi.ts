import api from "@/api/axiosInstance";

export type StudentPostAttachmentType = "Image" | "File";

export type StudentPost = {
  id: number;
  userId: number;
  authorName: string;
  authorAvatarBase64?: string | null;
  authorSubtitle?: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: StudentPostAttachmentType | null;
  createdAt: string;
  updatedAt: string;
};

export type MobilePostFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export type CreateStudentPostPayload = {
  content: string;
  file?: MobilePostFile | null;
};

export type UpdateStudentPostPayload = {
  content: string;
  file?: MobilePostFile | null;
  removeAttachment?: boolean;
};

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const FILE_EXTENSIONS = new Set([".pdf", ".docx"]);

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function isStudentPostImageFile(name: string, mimeType?: string): boolean {
  if (mimeType?.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(fileExtension(name));
}

export function isStudentPostDocumentFile(name: string, mimeType?: string): boolean {
  if (mimeType === "application/pdf") return true;
  if (mimeType?.includes("wordprocessingml")) return true;
  return FILE_EXTENSIONS.has(fileExtension(name));
}

function normalizePost(raw: Record<string, unknown>): StudentPost {
  const attachmentType = (raw.attachmentType ?? raw.AttachmentType) as string | null | undefined;
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    authorName: String(raw.authorName ?? raw.AuthorName ?? "Student"),
    authorAvatarBase64: (raw.authorAvatarBase64 ?? raw.AuthorAvatarBase64) as
      | string
      | null
      | undefined,
    authorSubtitle: (raw.authorSubtitle ?? raw.AuthorSubtitle) as string | null | undefined,
    content: String(raw.content ?? raw.Content ?? ""),
    attachmentUrl: (raw.attachmentUrl ?? raw.AttachmentUrl) as string | null | undefined,
    attachmentType:
      attachmentType === "Image" || attachmentType === "File" ? attachmentType : null,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.UpdatedAt ?? new Date().toISOString()),
  };
}

export async function createStudentPost(payload: CreateStudentPostPayload): Promise<StudentPost> {
  const form = new FormData();
  form.append("content", payload.content);

  if (payload.file) {
    form.append("file", {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.mimeType,
    } as unknown as Blob);
  }

  const { data } = await api.post<Record<string, unknown>>("/student-posts", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizePost(data);
}

export async function updateStudentPost(
  postId: number,
  payload: UpdateStudentPostPayload,
): Promise<StudentPost> {
  const form = new FormData();
  form.append("content", payload.content);
  if (payload.file) {
    form.append("file", {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.mimeType,
    } as unknown as Blob);
  }
  if (payload.removeAttachment) form.append("removeAttachment", "true");

  const { data } = await api.put<Record<string, unknown>>(`/student-posts/${postId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizePost(data);
}

export async function deleteStudentPost(postId: number): Promise<void> {
  await api.delete(`/student-posts/${postId}`);
}
