export interface TrechoColheita {
  id: string;
  talhao: string;
  trabalhadorNome: string;
  inicioLat: number;
  inicioLng: number;
  inicioData: number;
  fimLat?: number;
  fimLng?: number;
  fimData?: number;
  distanciaMetros?: number;
  status: 'em_andamento' | 'concluido';
}

export interface TrechosState {
  trechoAtivo: TrechoColheita | null;
  historico: TrechoColheita[];
}

const DEFAULT_STATE: TrechosState = {
  trechoAtivo: null,
  historico: [],
};

let memoryCache: TrechosState = { ...DEFAULT_STATE };

/**
 * Calcula a distância em metros entre duas coordenadas GPS usando a fórmula de Haversine.
 */
export function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Raio da Terra em metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formata a duração entre dois timestamps em texto amigável (ex: "2h 15min" ou "45 min").
 */
export function formatarDuracao(inicioMs: number, fimMs: number): string {
  const diffSeg = Math.max(1, Math.floor((fimMs - inicioMs) / 1000));
  if (diffSeg < 60) return `${diffSeg}s`;
  const totalMin = Math.floor(diffSeg / 60);
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  if (horas === 0) return `${minutos} min`;
  return `${horas}h ${minutos}min`;
}

async function getFileSystem(): Promise<{ fs: any; fileUri: string } | null> {
  try {
    let FileSystem: any = null;
    try {
      FileSystem = await import('expo-file-system/legacy');
    } catch {
      FileSystem = await import('expo-file-system');
    }
    const baseDir =
      FileSystem?.documentDirectory || (FileSystem?.Paths && FileSystem?.Paths.document);
    if (!FileSystem || !baseDir) return null;
    const baseDirStr = typeof baseDir === 'string' ? baseDir : baseDir.uri || '';
    if (!baseDirStr) return null;
    return { fs: FileSystem, fileUri: `${baseDirStr}safracafe_trechos_colheita.json` };
  } catch {
    return null;
  }
}

export async function carregarTrechosColheita(): Promise<TrechosState> {
  const fsInfo = await getFileSystem();
  if (!fsInfo || typeof fsInfo.fs.readAsStringAsync !== 'function') {
    return memoryCache;
  }

  try {
    const info = await fsInfo.fs.getInfoAsync(fsInfo.fileUri);
    if (!info.exists) {
      return memoryCache;
    }
    const raw = await fsInfo.fs.readAsStringAsync(fsInfo.fileUri);
    if (!raw) return memoryCache;
    const parsed = JSON.parse(raw) as TrechosState;
    memoryCache = {
      trechoAtivo: parsed.trechoAtivo || null,
      historico: Array.isArray(parsed.historico) ? parsed.historico : [],
    };
    return memoryCache;
  } catch {
    return memoryCache;
  }
}

export async function salvarTrechosColheita(state: TrechosState): Promise<void> {
  memoryCache = state;
  const fsInfo = await getFileSystem();
  if (fsInfo && typeof fsInfo.fs.writeAsStringAsync === 'function') {
    try {
      await fsInfo.fs.writeAsStringAsync(fsInfo.fileUri, JSON.stringify(state));
    } catch {
      // Fallback silencioso em memória
    }
  }

  // Sincronização em segundo plano com o Supabase (caso online e tabela trechos_colheita disponível)
  sincronizarTrechosComSupabase(state).catch(() => {});
}

async function sincronizarTrechosComSupabase(state: TrechosState): Promise<void> {
  try {
    const { SupabaseClientManager } = await import('@/src/infra/supabase/SupabaseClient');
    const client = SupabaseClientManager.getInstance().getClient();
    const registros: TrechoColheita[] = [];
    if (state.trechoAtivo) {
      registros.push(state.trechoAtivo);
    }
    if (state.historico.length > 0) {
      registros.push(state.historico[0]);
    }
    if (registros.length === 0) return;

    const payload = registros.map((t) => ({
      id: t.id,
      talhao: t.talhao,
      trabalhador_nome: t.trabalhadorNome,
      inicio_lat: t.inicioLat,
      inicio_lng: t.inicioLng,
      inicio_data: t.inicioData,
      fim_lat: t.fimLat ?? null,
      fim_lng: t.fimLng ?? null,
      fim_data: t.fimData ?? null,
      distancia_metros: t.distanciaMetros ?? null,
      status: t.status,
      updated_at: Date.now(),
    }));

    await client.from('trechos_colheita').upsert(payload, { onConflict: 'id' });
  } catch {
    // Ignora silenciosamente se offline ou se a tabela opcional ainda não foi criada
  }
}

