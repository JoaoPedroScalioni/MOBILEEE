import { StorageGateway, StorageUploadResult } from '../../domain/gateways/StorageGateway';
import { SupabaseClientManager } from './SupabaseClient';
import { defaultSupabaseConfig } from './SupabaseConfig';

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const len = clean.length;
  if (len === 0) return new Uint8Array(0);

  let placeHolders = 0;
  if (clean.charAt(len - 1) === '=') placeHolders++;
  if (clean.charAt(len - 2) === '=') placeHolders++;

  const byteLength = (len * 3) / 4 - placeHolders;
  const bytes = new Uint8Array(byteLength);

  let cur = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[clean.charCodeAt(i)];
    const b = lookup[clean.charCodeAt(i + 1)];
    const c = lookup[clean.charCodeAt(i + 2)];
    const d = lookup[clean.charCodeAt(i + 3)];

    bytes[cur++] = (a << 2) | (b >> 4);
    if (cur < byteLength) bytes[cur++] = ((b & 15) << 4) | (c >> 2);
    if (cur < byteLength) bytes[cur++] = ((c & 3) << 6) | (d & 63);
  }
  return bytes;
}

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
    let bytesLength = 0;

    // 1. Tenta carregar via expo-file-system/legacy ou expo-file-system
    try {
      let FileSystem: any;
      try {
        FileSystem = await import('expo-file-system/legacy');
      } catch {
        FileSystem = await import('expo-file-system');
      }

      if (FileSystem && typeof FileSystem.readAsStringAsync === 'function' && (localUri.startsWith('file://') || localUri.startsWith('/'))) {
        const base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: 'base64',
        });
        if (base64 && base64.length > 50) {
          fileBody = decodeBase64ToUint8Array(base64);
          bytesLength = fileBody.length;
        }
      } else if (FileSystem && FileSystem.File) {
        const fileInstance = new FileSystem.File(localUri);
        const arrayBuf = await fileInstance.arrayBuffer();
        if (arrayBuf && arrayBuf.byteLength > 50) {
          fileBody = new Uint8Array(arrayBuf);
          bytesLength = fileBody.length;
        }
      }
    } catch {
      // Continua para tentar fallbacks
    }

    // 2. Fallback via fetch / blob
    if (!fileBody || bytesLength === 0) {
      try {
        const response = await fetch(localUri);
        const blob = await response.blob();
        if (blob && blob.size > 50) {
          fileBody = blob;
          bytesLength = blob.size;
        }
      } catch {
        // Ignora
      }
    }

    // 3. Fallback via FormData nativo do React Native
    if (!fileBody || bytesLength === 0) {
      const formData = new FormData();
      formData.append('', {
        uri: localUri,
        name: destinationPath.split('/').pop() || 'recibo.jpg',
        type: contentType,
      } as any);
      fileBody = formData;
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
