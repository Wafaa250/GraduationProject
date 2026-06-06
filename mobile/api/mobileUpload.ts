export type MobileUploadFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export function appendMobileUploadFile(formData: FormData, fieldName: string, file: MobileUploadFile): void {
  formData.append(fieldName, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
}
