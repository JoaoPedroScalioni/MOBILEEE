import * as Location from 'expo-location';

export interface LocationResult {
  latitude: number;
  longitude: number;
  isFallback: boolean;
  status: 'granted' | 'denied' | 'timeout' | 'fallback';
  timestamp?: number;
}

// Coordenadas padrão da região cafeeira (Lavras / Sul de Minas)
export const COORDENADAS_PADRAO_FAZENDA = {
  latitude: -21.2488,
  longitude: -44.9998,
};

/**
 * Obtém a localização de forma segura e não-bloqueante:
 * 1. Tenta obter a última posição conhecida instantaneamente do cache do sistema.
 * 2. Em paralelo com timeout, tenta obter a posição atual por GPS.
 * 3. Se o GPS demorar mais que o timeout ou estiver sem sinal/indisponível, retorna a última conhecida ou o fallback da fazenda.
 * Nunca trava a tela nem lança exceção não tratada.
 */
export async function obterLocalizacaoSegura(timeoutMs = 4000): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({
      status: 'denied' as const,
    }));

    if (status !== 'granted') {
      return {
        ...COORDENADAS_PADRAO_FAZENDA,
        isFallback: true,
        status: 'denied',
      };
    }

    // 1. Tentar última posição conhecida (retorno quase instantâneo)
    const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);

    // 2. Tentar posição atual com limite de tempo (timeout)
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
    const currentPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).catch(() => null);

    const current = await Promise.race([currentPromise, timeoutPromise]);

    if (current?.coords) {
      return {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        isFallback: false,
        status: 'granted',
        timestamp: current.timestamp,
      };
    }

    if (lastKnown?.coords) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
        isFallback: false,
        status: 'granted',
        timestamp: lastKnown.timestamp,
      };
    }

    // 3. Fallback seguro caso não haja sinal de satélite no momento
    return {
      ...COORDENADAS_PADRAO_FAZENDA,
      isFallback: true,
      status: 'timeout',
    };
  } catch (error) {
    console.warn('Erro ao obter localização segura:', error);
    return {
      ...COORDENADAS_PADRAO_FAZENDA,
      isFallback: true,
      status: 'fallback',
    };
  }
}
