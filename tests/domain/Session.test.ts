import { Session } from '../../src/domain/entities/Session';
import { User } from '../../src/domain/entities/User';

const AGORA = 1_720_000_000_000;

function makeUser() {
    return new User('u1', 'Pesquisador CEFET', 'pesquisador@ecofield.app');
}

describe('Session Entity', () => {
    it('cria uma sessão válida com token, usuário e expiração', () => {
        const session = new Session('token-abc', makeUser(), AGORA + 60_000);
        expect(session.token).toBe('token-abc');
        expect(session.user.email).toBe('pesquisador@ecofield.app');
        expect(session.isValid(AGORA)).toBe(true);
    });

    it('rejeita token vazio', () => {
        expect(() => new Session('   ', makeUser(), AGORA + 60_000)).toThrow('Token de sessão inválido');
    });

    it('rejeita expiração inválida', () => {
        expect(() => new Session('token-abc', makeUser(), 0)).toThrow('Expiração de sessão inválida');
    });

    it('considera a sessão inválida quando expirada', () => {
        const session = new Session('token-abc', makeUser(), AGORA - 1000);
        expect(session.isValid(AGORA)).toBe(false);
    });
});

describe('User Entity', () => {
    it('cria um usuário válido', () => {
        const user = makeUser();
        expect(user.id).toBe('u1');
        expect(user.name).toBe('Pesquisador CEFET');
    });

    it('rejeita e-mail inválido', () => {
        expect(() => new User('u1', 'Nome', 'nao-e-email')).toThrow('E-mail inválido');
    });

    it('rejeita nome vazio', () => {
        expect(() => new User('u1', '  ', 'pesquisador@ecofield.app')).toThrow('Nome de usuário inválido');
    });

    it('rejeita id vazio', () => {
        expect(() => new User(' ', 'Nome', 'pesquisador@ecofield.app')).toThrow('Id de usuário inválido');
    });
});