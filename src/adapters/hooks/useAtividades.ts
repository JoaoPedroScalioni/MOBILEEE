import { useCallback, useState } from 'react';
import { PeriodoAvaliacao } from '../../domain/entities/PeriodoAvaliacao';
import { container } from '../../factory/container';
import {
  RegistrarAtividadesDTO,
  RegistrarAtividadesUseCase,
} from '../../usecases/RegistrarAtividadesUseCase';

export type AtividadesStatus = 'idle' | 'salvando' | 'salvo' | 'erro';

export interface UseAtividadesOptions {
  useCase?: RegistrarAtividadesUseCase;
}

export function useAtividades(options?: UseAtividadesOptions) {
  const [status, setStatus] = useState<AtividadesStatus>('idle');
  const [erro, setErro] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoAvaliacao | null>(null);

  const registrarUseCase = options?.useCase ?? container.registrarAtividadesUseCase;

  const salvarAtividades = useCallback(
    async (dto: RegistrarAtividadesDTO): Promise<PeriodoAvaliacao | null> => {
      setStatus('salvando');
      setErro(null);

      try {
        const resultado = await registrarUseCase.execute(dto);
        setPeriodo(resultado);
        setStatus('salvo');
        return resultado;
      } catch (err: any) {
        const mensagem = err?.message || 'Erro inesperado ao registrar atividades.';
        setErro(mensagem);
        setStatus('erro');
        return null;
      }
    },
    [registrarUseCase]
  );

  const resetar = useCallback(() => {
    setStatus('idle');
    setErro(null);
  }, []);

  return {
    status,
    erro,
    periodo,
    salvarAtividades,
    resetar,
  };
}
