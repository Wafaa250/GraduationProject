export type MobileUploadFile = {
  uri: string;
  name: string;
  mimeType: string;
  webFile?: File;
};

export function appendMobileUploadFile(formData: FormData, fieldName: string, file: MobileUploadFile): void {
  if (file.webFile) {
    formData.append(fieldName, file.webFile, file.name);
    return;
  }

  formData.append(fieldName, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
}

export const ROSTER_FILE_ACCEPT =
  ".csv,.xlsx,.docx,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";

export function pickWebRosterFile(): Promise<MobileUploadFile | null> {
  if (typeof document === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ROSTER_FILE_ACCEPT;
    input.style.display = "none";

    const cleanup = () => {
      input.remove();
    };

    input.onchange = () => {
      const selected = input.files?.[0] ?? null;
      cleanup();
      if (!selected) {
        resolve(null);
        return;
      }

      resolve({
        uri: URL.createObjectURL(selected),
        name: selected.name,
        mimeType: selected.type || "application/octet-stream",
        webFile: selected,
      });
    };

    document.body.appendChild(input);
    input.click();
  });
}
