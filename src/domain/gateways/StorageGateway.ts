export interface StorageUploadResult {
  path: string;
  publicUrl?: string;
}

export interface StorageGateway {
  uploadFile(localUri: string, destinationPath: string, contentType?: string): Promise<StorageUploadResult>;
  getPublicUrl(path: string): string;
}
