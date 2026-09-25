import { Assinatura } from '../../src/domain/value-objects/Assinatura';

describe('Assinatura Value Object', () => {
  it('deve instanciar assinatura válida com base64, autorId e papel', () => {
    const ts = Date.now();
    const ass = new Assinatura('base64imagemfake==', 'usr-123', 'aluno', ts);

    expect(ass.getBase64()).toBe('base64imagemfake==');
    expect(ass.getAutorId()).toBe('usr-123');
    expect(ass.getPapel()).toBe('aluno');
    expect(ass.getTimestamp()).toBe(ts);
  });

  it('deve lançar erro se base64 for vazio', () => {
    expect(() => new Assinatura('', 'usr-1', 'supervisor')).toThrow(
      'A assinatura em base64 não pode ser vazia.'
    );
  });

  it('deve lançar erro se autorId for vazio', () => {
    expect(() => new Assinatura('base64...', '', 'supervisor')).toThrow(
      'O identificador do autor da assinatura é obrigatório.'
    );
  });

  it('deve lançar erro se papel for inválido', () => {
    expect(() => new Assinatura('base64...', 'usr-1', 'outro' as any)).toThrow(
      'O papel do assinante deve ser aluno, supervisor ou coordenador.'
    );
  });

  it('deve verificar igualdade', () => {
    const a1 = new Assinatura('base64', 'u1', 'supervisor', 100);
    const a2 = new Assinatura('base64', 'u1', 'supervisor', 100);
    const a3 = new Assinatura('base64', 'u2', 'supervisor', 100);

    expect(a1.equals(a2)).toBe(true);
    expect(a1.equals(a3)).toBe(false);
  });
});
