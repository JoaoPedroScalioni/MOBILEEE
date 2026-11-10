/**
 * Verifica se uma data/timestamp pertence ao dia de hoje (no fuso horário local do aparelho).
 */
export function isHoje(
  dataInput: Date | string | number,
  referencia: Date = new Date(),
): boolean {
  const d = dataInput instanceof Date ? dataInput : new Date(dataInput);
  if (Number.isNaN(d.getTime())) return false;

  return (
    d.getFullYear() === referencia.getFullYear() &&
    d.getMonth() === referencia.getMonth() &&
    d.getDate() === referencia.getDate()
  );
}

/**
 * Formata data no padrão DD/MM/AAAA.
 */
export function formatarDataCurta(dataInput: Date | string | number): string {
  const d = dataInput instanceof Date ? dataInput : new Date(dataInput);
  if (Number.isNaN(d.getTime())) return '--/--/----';

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata hora no padrão HH:MM.
 */
export function formatarHora(dataInput: Date | string | number): string {
  const d = dataInput instanceof Date ? dataInput : new Date(dataInput);
  if (Number.isNaN(d.getTime())) return '--:--';

  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Formata data e hora completa no padrão "DD/MM/AAAA às HH:MM".
 */
export function formatarDataHora(dataInput: Date | string | number): string {
  return `${formatarDataCurta(dataInput)} às ${formatarHora(dataInput)}`;
}

