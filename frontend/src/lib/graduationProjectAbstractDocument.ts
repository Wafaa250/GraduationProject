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

const MAX_ABSTRACT_FILE_BYTES = 5 * 1024 * 1024;

type EmbeddedAbstractFilePayload = {
  v: number;
  fileName: string;
  mimeType: string;
  base64: string;
  uploadedAt: string;
};

export type ParsedAbstractDocument = {
  displayText: string;
  attachment: {
    fileName: string;
    mimeType: string;
    dataUrl: string;
    uploadedAt: string;
  } | null;
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file."));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

/** Strip embedded file marker; return user-visible abstract text only. */
export function getAbstractDisplayText(abstract?: string | null): string {
  return parseAbstractDocument(abstract).displayText;
}

export function parseAbstractDocument(abstract?: string | null): ParsedAbstractDocument {
  const raw = abstract?.trim() ?? "";
  if (!raw) return { displayText: "", attachment: null };

  const match = raw.match(EMBEDDED_FILE_PATTERN);
  if (!match) return { displayText: raw, attachment: null };

  let attachment: ParsedAbstractDocument["attachment"] = null;
  try {
    const payload = JSON.parse(match[1]!) as EmbeddedAbstractFilePayload;
    if (payload?.base64 && payload.fileName) {
      const mimeType = payload.mimeType || guessMimeType(payload.fileName);
      attachment = {
        fileName: payload.fileName,
        mimeType,
        dataUrl: `data:${mimeType};base64,${payload.base64}`,
        uploadedAt: payload.uploadedAt || new Date().toISOString(),
      };
    }
  } catch {
    attachment = null;
  }

  const displayText = raw.replace(EMBEDDED_FILE_PATTERN, "").trim();
  return { displayText, attachment };
}

/** Build abstract field for POST/PUT — embeds file in abstract when no backend file API exists. */
export async function buildAbstractFieldForSave(
  summary: string,
  file: File | null,
): Promise<string | null> {
  const text = summary.trim();

  if (!file) {
    return text || null;
  }

  if (file.size > MAX_ABSTRACT_FILE_BYTES) {
    throw new Error("Abstract file must be 5 MB or smaller.");
  }

  const base64 = await fileToBase64(file);
  const marker = `[[SKILLSWAP_GP_FILE:${JSON.stringify({
    v: 1,
    fileName: file.name,
    mimeType: file.type || guessMimeType(file.name),
    base64,
    uploadedAt: new Date().toISOString(),
  } satisfies EmbeddedAbstractFilePayload)}]]`;

  return text ? `${text}\n\n${marker}` : marker;
}

/** Resolve downloadable abstract document from API metadata or embedded abstract text. */
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
