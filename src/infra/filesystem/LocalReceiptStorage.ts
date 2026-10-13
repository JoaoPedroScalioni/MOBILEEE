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
    if (!tempUri || !tempUri.startsWith('file://')) {
      return tempUri;
    }

    try {
      const FileSystem: any = await import('expo-file-system');
      const baseDir = FileSystem.documentDirectory || (FileSystem.Paths && FileSystem.Paths.document);
      if (!FileSystem || !baseDir) {
        return tempUri;
      }

      const receiptDir = `${baseDir}recibos/`;
      const dirInfo = await FileSystem.getInfoAsync(receiptDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(receiptDir, { intermediates: true });
      }

      const filename = `recibo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const permanentUri = `${receiptDir}${filename}`;

      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri,
      });

      return permanentUri;
    } catch (error) {
      // Degradação graciosa em ambientes sem acesso ao FileSystem nativo
      return tempUri;
    }
  }
}
