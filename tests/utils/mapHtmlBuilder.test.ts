import { gerarHtmlMapaLavoura, MAP_TILE_SERVERS } from '../../src/features/mapas/mapHtmlBuilder';

describe('mapHtmlBuilder', () => {
  it('deve gerar mapa estilo Google Maps autônomo sem depender de CDN externo', () => {
    const html = gerarHtmlMapaLavoura({
      layer: 'satellite',
      userLat: -21.2488,
      userLng: -44.9998,
      trechoAtivo: {
        id: 't-ativo',
        talhao: 'Talhão 01',
        trabalhadorNome: 'Cleiton',
        inicioLat: -21.249,
        inicioLng: -44.999,
        inicioData: Date.now(),
        status: 'em_andamento',
      },
      historicoTrechos: [
        {
          id: 't-1',
          talhao: 'Talhão 02',
          trabalhadorNome: 'Ana',
          inicioLat: -21.25,
          inicioLng: -45.0,
          inicioData: Date.now() - 3600000,
          fimLat: -21.251,
          fimLng: -45.001,
          fimData: Date.now() - 1800000,
          distanciaMetros: 152,
          status: 'concluido',
        },
      ],
      trechoFocadoId: 't-1',
      apontamentos: [
        {
          id: 'ap-1',
          latitude: -21.2495,
          longitude: -44.9995,
          litros: 60,
          dataIso: '2026-11-18T10:00:00.000Z',
        },
      ],
    });

    expect(html).not.toContain('unpkg.com/leaflet');
    expect(html).toContain('mt1.google.com/vt/lyrs=y');
    expect(html).toContain('latLngToWorld');
    expect(html).toContain('worldToLatLng');
    expect(html).toContain('pin-wrap');
    expect(html).toContain('Talhão 01');
    expect(html).toContain('Talhão 02');
    expect(html).toContain('"trechoFocadoId":"t-1"');
    expect(html).toContain('window.setLayer');
    expect(html).toContain('window.fitAll');
    expect(html).toContain('btn-zoom-in');
    expect(MAP_TILE_SERVERS.satellite.url).toContain('lyrs=y');
    expect(MAP_TILE_SERVERS.satellite.fallbackUrl).toContain('arcgisonline.com');
  });
});
