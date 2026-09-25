export enum StatusPeriodo {
  RASCUNHO = 'rascunho',
  PENDENTE_SUPERVISOR = 'pendente_supervisor',
  PENDENTE_ASSINATURAS = 'pendente_assinaturas',
  APROVADO = 'aprovado',
  DEVOLVIDO = 'devolvido',
}

export function isStatusPeriodoValido(valor: string): valor is StatusPeriodo {
  return Object.values(StatusPeriodo).includes(valor as StatusPeriodo);
}
