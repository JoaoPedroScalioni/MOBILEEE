import {
  formatarDataCurta,
  formatarDataHora,
  formatarHora,
  isHoje,
} from '../../src/shared/utils/dateHelper';
import {
  calcularDistanciaMetros,
  carregarTrechosColheita,
  formatarDuracao,
  salvarTrechosColheita,
} from '../../src/features/mapas/trechosStorage';

describe('dateHelper (organização Hoje vs. Arquivados e formatação)', () => {
  it('deve identificar corretamente se uma data pertence ao dia de hoje', () => {
    const referencia = new Date(2026, 10, 10, 14, 30); // 10/11/2026 14:30
    const mesmoDia = new Date(2026, 10, 10, 8, 15);
    const diaAnterior = new Date(2026, 10, 9, 23, 59);

    expect(isHoje(mesmoDia, referencia)).toBe(true);
    expect(isHoje(diaAnterior, referencia)).toBe(false);
    expect(isHoje('data-invalida', referencia)).toBe(false);
  });

  it('deve formatar data curta, hora e dataHora completa em pt-BR', () => {
    const data = new Date(2026, 10, 10, 9, 5); // 10/11/2026 às 09:05
    expect(formatarDataCurta(data)).toBe('10/11/2026');
    expect(formatarHora(data)).toBe('09:05');
    expect(formatarDataHora(data)).toBe('10/11/2026 às 09:05');
  });
});

describe('trechosStorage (cálculo Haversine, duração e persistência de pontos)', () => {
  it('deve calcular a distância em metros entre dois pontos GPS usando Haversine', () => {
    const lat1 = -21.2458;
    const lon1 = -45.0005;
    const lat2 = -21.2448;
    const lon2 = -45.0005;

    const metros = calcularDistanciaMetros(lat1, lon1, lat2, lon2);
    expect(metros).toBeGreaterThan(100);
    expect(metros).toBeLessThan(120);
  });

  it('deve formatar durações curtas e longas de colheita', () => {
    expect(formatarDuracao(1000, 31000)).toBe('30s');
    expect(formatarDuracao(0, 45 * 60 * 1000)).toBe('45 min');
    expect(formatarDuracao(0, 135 * 60 * 1000)).toBe('2h 15min');
  });

  it('deve salvar e carregar o estado dos pontos da colheita', async () => {
    await salvarTrechosColheita({
      trechoAtivo: {
        id: 't-1',
        talhao: 'Talhão 01',
        trabalhadorNome: 'Cleiton (TRAB-01)',
        inicioLat: -21.245,
        inicioLng: -45.001,
        inicioData: Date.now(),
        status: 'em_andamento',
      },
      historico: [],
    });

    const estado = await carregarTrechosColheita();
    expect(estado.trechoAtivo?.talhao).toBe('Talhão 01');
  });
});

