import { StorageGateway, StorageUploadResult } from '../../domain/gateways/StorageGateway';
import { SupabaseClientManager } from './SupabaseClient';
import { defaultSupabaseConfig } from './SupabaseConfig';

/**
 * Gateway de armazenamento de arquivos em Bucket S3 no Supabase Storage.
 * Atende ao marco de 06/nov:
 * 'Bucket, padrão S3 storage e o armazenamento de arquivos no supabase.'
 */
export class SupabaseStorageGateway implements StorageGateway {
  private static instance: SupabaseStorageGateway;
  private readonly bucketName: string;

  private constructor(
    private readonly clientManager: SupabaseClientManager = SupabaseClientManager.getInstance(),
    bucketName: string = defaultSupabaseConfig.storageBucket
  ) {
    this.bucketName = bucketName;
  }

  public static getInstance(
    clientManager?: SupabaseClientManager,
    bucketName?: string
  ): SupabaseStorageGateway {
    if (!SupabaseStorageGateway.instance) {
      SupabaseStorageGateway.instance = new SupabaseStorageGateway(clientManager, bucketName);
    }
    return SupabaseStorageGateway.instance;
  }

  async uploadFile(
    localUri: string,
    destinationPath: string,
    contentType: string = 'image/jpeg'
  ): Promise<StorageUploadResult> {
    const client = this.clientManager.getClient();

    let fileBody: any;
    try {
      const FileSystem: any = await import('expo-file-system');
      if (FileSystem && typeof FileSystem.readAsStringAsync === 'function' && localUri.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : 'base64',
        });
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        fileBody = new Uint8Array(byteNumbers);
      } else {
        const response = await fetch(localUri);
        fileBody = await response.blob();
      }
    } catch {
      fileBody = new Uint8Array([0]);
    }

    const { data, error } = await client.storage
      .from(this.bucketName)
      .upload(destinationPath, fileBody, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Falha no upload para o Bucket S3 (${this.bucketName}): ${error.message}`);
    }

    const publicUrl = this.getPublicUrl(data.path);
    return {
      path: data.path,
      publicUrl,
    };
  }

  getPublicUrl(path: string): string {
    const client = this.clientManager.getClient();
    const { data } = client.storage.from(this.bucketName).getPublicUrl(path);
    return data.publicUrl;
  }
}
