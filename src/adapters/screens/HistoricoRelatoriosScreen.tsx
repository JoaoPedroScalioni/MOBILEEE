import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PeriodoAvaliacao } from '../../domain/entities/PeriodoAvaliacao';
import { container } from '../../factory/container';
import { GerarPdfUseCase } from '../../usecases/GerarPdfUseCase';
import { SincronizarFilaUseCase } from '../../usecases/SincronizarFilaUseCase';

export interface HistoricoRelatoriosScreenProps {
  gerarPdfUseCase?: GerarPdfUseCase;
  sincronizarFilaUseCase?: SincronizarFilaUseCase;
  periodosIniciais?: PeriodoAvaliacao[];
}

export function HistoricoRelatoriosScreen({
  gerarPdfUseCase,
  sincronizarFilaUseCase,
  periodosIniciais,
}: HistoricoRelatoriosScreenProps) {
  const pdfUseCase = gerarPdfUseCase ?? container.gerarPdfUseCase;
  const syncUseCase = sincronizarFilaUseCase ?? container.sincronizarFilaUseCase;

  const [periodos, setPeriodos] = useState<PeriodoAvaliacao[]>(periodosIniciais ?? []);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    if (!periodosIniciais) {
      container.periodoAvaliacaoRepository.list().then(setPeriodos);
    }
  }, [periodosIniciais]);

  const handleSincronizar = async () => {
    setLoading(true);
    setMensagem(null);
    try {
      const res = await syncUseCase.execute();
      setMensagem(`Sincronização concluída: ${res.sincronizados} sincronizados.`);
      const listaAtualizada = await container.periodoAvaliacaoRepository.list();
      setPeriodos(listaAtualizada);
    } catch (err: any) {
      setMensagem(`Erro ao sincronizar: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPdf = async (periodoId: string) => {
    setLoading(true);
    setMensagem(null);
    try {
      const doc = await pdfUseCase.execute({ periodoId });
      setMensagem(`PDF gerado com sucesso: ${doc.nomeArquivo}`);
    } catch (err: any) {
      setMensagem(`Não foi possível emitir o PDF: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: PeriodoAvaliacao }) => (
    <View testID={`item-periodo-${item.getId()}`} style={styles.card}>
      <View style={styles.headerCard}>
        <Text style={styles.tituloCard}>Período #{item.getNumeroPeriodo()}</Text>
        <Text style={[styles.badgeStatus, styles[`status_${item.getStatus()}` as keyof typeof styles]]}>
          {item.getStatus().toUpperCase()}
        </Text>
      </View>

      <Text style={styles.detalhesCard}>Estágio: {item.getEstagioId()} | Aluno: {item.getAlunoId()}</Text>
      <Text style={styles.detalhesCard}>
        Sincronização: {item.getStatusSincronizacao()} {item.isAssinaturasSincronizadas() ? '(Assinaturas OK)' : '(Assinaturas pendentes)'}
      </Text>

      <TouchableOpacity
        testID={`btn-gerar-pdf-${item.getId()}`}
        style={styles.botaoPdf}
        onPress={() => handleGerarPdf(item.getId())}
      >
        <Text style={styles.textoBotaoPdf}>Emitir Documento PDF</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <Text style={styles.titulo}>Histórico de Relatórios</Text>
        <TouchableOpacity
          testID="btn-sincronizar"
          style={styles.botaoSync}
          onPress={handleSincronizar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.textoBotaoSync}>Sincronizar Fila</Text>
          )}
        </TouchableOpacity>
      </View>

      {mensagem && (
        <View style={styles.alerta}>
          <Text style={styles.textoAlerta}>{mensagem}</Text>
        </View>
      )}

      {periodos.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.textoVazio}>Nenhum relatório ou período cadastrado no momento.</Text>
        </View>
      ) : (
        <FlatList
          data={periodos}
          keyExtractor={(item) => item.getId()}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A24',
  },
  botaoSync: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  textoBotaoSync: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  alerta: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  textoAlerta: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '500',
  },
  lista: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    flexDirection: 'column',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tituloCard: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  badgeStatus: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  status_rascunho: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
  },
  status_pendente_supervisor: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  status_pendente_assinaturas: {
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
  },
  status_aprovado: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  status_devolvido: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  detalhesCard: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  botaoPdf: {
    marginTop: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  textoBotaoPdf: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  vazio: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  textoVazio: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
