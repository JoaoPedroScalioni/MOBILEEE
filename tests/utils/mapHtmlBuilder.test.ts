import { gerarHtmlMapaLavoura, MAP_TILE_SERVERS } from '../../src/features/mapas/mapHtmlBuilder';

describe('mapHtmlBuilder', () => {
  it('deve gerar HTML interativo com Leaflet, servidores de tiles e modo offline embutido', () => {
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

    expect(html).toContain('unpkg.com/leaflet@1.9.4/dist/leaflet.js');
    expect(html).toContain('renderOfflineSvg');
    expect(html).toContain('Talhão 01');
    expect(html).toContain('Talhão 02');
    expect(html).toContain('"trechoFocadoId":"t-1"');
    expect(html).toContain('window.setLayer');
    expect(html).toContain('window.fitAll');
    expect(MAP_TILE_SERVERS.satellite.url).toContain('lyrs=y');
  });
});
