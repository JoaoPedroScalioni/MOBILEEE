export class LocalReceiptStorage {
  private static instance: LocalReceiptStorage;

  private constructor() {}

  public static getInstance(): LocalReceiptStorage {
    if (!LocalReceiptStorage.instance) {
      LocalReceiptStorage.instance = new LocalReceiptStorage();
    }
    return LocalReceiptStorage.instance;
  }

  /**
   * Salva a imagem capturada no diretório permanente local do app e devolve o URI permanente.
   * Atende ao marco de 09/out: 'Acessando imagens locais e registrando o endereço no SQLite'.
   */
  async persistReceiptImage(tempUri: string): Promise<string> {
    if (!tempUri) {
      return tempUri;
    }

    try {
      let FileSystem: any = null;
      try {
        FileSystem = await import('expo-file-system/legacy');
      } catch {
        try {
          FileSystem = await import('expo-file-system');
        } catch {
          FileSystem = null;
        }
      }

      const baseDir = FileSystem?.documentDirectory || (FileSystem?.Paths && FileSystem?.Paths.document);
      if (!FileSystem || !baseDir) {
        return tempUri;
      }

      const baseDirStr = typeof baseDir === 'string' ? baseDir : (baseDir.uri || '');
      const receiptDir = `${baseDirStr}recibos/`;

      if (typeof FileSystem.getInfoAsync === 'function') {
        const dirInfo = await FileSystem.getInfoAsync(receiptDir);
        if (!dirInfo.exists && typeof FileSystem.makeDirectoryAsync === 'function') {
          await FileSystem.makeDirectoryAsync(receiptDir, { intermediates: true });
        }
      }

      const filename = `recibo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const permanentUri = `${receiptDir}${filename}`;

      if (typeof FileSystem.copyAsync === 'function') {
        await FileSystem.copyAsync({
          from: tempUri,
          to: permanentUri,
        });
        return permanentUri;
      }

      return tempUri;
    } catch {
      // Degradação graciosa: se der erro ao copiar, usa o tempUri original da câmera/ImagePicker
      return tempUri;
    }
  }
}
