import { resolveApiFileUrl } from "@/api/axiosInstance";

export type GradProjectAbstractFileMeta = {
  fileName: string;
  uploadedAt: string;
  downloadUrl: string;
};

export type AbstractFileProjectSource = {
  abstract?: string | null;
  abstractFileName?: string | null;
  abstractFilePath?: string | null;
  abstractFileUploadedAt?: string | null;
  updatedAt?: string;
};

const EMBEDDED_FILE_PATTERN = /\[\[SKILLSWAP_GP_FILE:([\s\S]*?)\]\]/;

type EmbeddedAbstractFilePayload = {
  v: number;
  fileName: string;
  mimeType: string;
  base64: string;
  uploadedAt: string;
};

function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  return "application/octet-stream";
}

export function getAbstractDisplayText(abstract?: string | null): string {
  const raw = abstract?.trim() ?? "";
  if (!raw) return "";
  return raw.replace(EMBEDDED_FILE_PATTERN, "").trim();
}

function parseAbstractDocument(abstract?: string | null): {
  displayText: string;
  attachment: { fileName: string; dataUrl: string; uploadedAt: string } | null;
} {
  const raw = abstract?.trim() ?? "";
  if (!raw) return { displayText: "", attachment: null };

  const match = raw.match(EMBEDDED_FILE_PATTERN);
  if (!match) return { displayText: raw, attachment: null };

  let attachment: { fileName: string; dataUrl: string; uploadedAt: string } | null = null;
  try {
    const payload = JSON.parse(match[1]!) as EmbeddedAbstractFilePayload;
    if (payload?.base64 && payload.fileName) {
      const mimeType = payload.mimeType || guessMimeType(payload.fileName);
      attachment = {
        fileName: payload.fileName,
        dataUrl: `data:${mimeType};base64,${payload.base64}`,
        uploadedAt: payload.uploadedAt || new Date().toISOString(),
      };
    }
  } catch {
    attachment = null;
  }

  return { displayText: raw.replace(EMBEDDED_FILE_PATTERN, "").trim(), attachment };
}

export function resolveGraduationProjectAbstractFile(
  project: AbstractFileProjectSource,
): GradProjectAbstractFileMeta | null {
  const apiPath = project.abstractFilePath?.trim();
  const apiName = project.abstractFileName?.trim();
  if (apiName && apiPath) {
    const downloadUrl = resolveApiFileUrl(apiPath);
    if (downloadUrl) {
      return {
        fileName: apiName,
        uploadedAt:
          project.abstractFileUploadedAt?.trim() ||
          project.updatedAt ||
          new Date().toISOString(),
        downloadUrl,
      };
    }
  }

  const embedded = parseAbstractDocument(project.abstract).attachment;
  if (!embedded) return null;

  return {
    fileName: embedded.fileName,
    uploadedAt: embedded.uploadedAt,
    downloadUrl: embedded.dataUrl,
  };
}
