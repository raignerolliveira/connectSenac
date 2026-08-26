const request = require('supertest');
const jwt = require('jsonwebtoken');

// Garantir JWT_SECRET para o ambiente de testes
process.env.JWT_SECRET = process.env.JWT_SECRET || 'chave_de_teste_segura_para_jest_123';
const { JWT_SECRET } = require('../backend/config/env');
const app = require('../server');

describe('🛡️ QA Test Suite - Segurança, Autenticação, RBAC & Qualidade', () => {
    let tokenCandidato;
    let tokenAdmin;
    let tokenProfissional;

    beforeAll(() => {
        tokenCandidato = jwt.sign(
            { id: 'usr-cand-mock-1', email: 'candidato@teste.com', perfil: 'candidato' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        tokenAdmin = jwt.sign(
            { id: 'usr-adm-mock-1', email: 'admin@teste.com', perfil: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        tokenProfissional = jwt.sign(
            { id: 'usr-prof-mock-1', email: 'professor@teste.com', perfil: 'profissional' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    it('TC-01: Deve responder 200 OK e status saudável na rota pública /api/status', async () => {
        const res = await request(app).get('/api/status');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
    });

    it('TC-02: Deve incluir cabeçalhos de segurança HTTP configurados pelo Helmet', async () => {
        const res = await request(app).get('/api/status');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('TC-03: Deve barrar requisições em rotas protegidas sem token (401)', async () => {
        const res = await request(app).get('/api/agendamentos/meus');
        expect(res.status).toBe(401);
        expect(res.body.erro).toBeDefined();
    });

    it('TC-04: Deve rejeitar token com assinatura inválida ou adulterada (401)', async () => {
        const tokenFalso = jwt.sign(
            { id: 'usr-fake-123', perfil: 'admin' },
            'chave_completamente_errada_e_invalida'
        );
        const res = await request(app)
            .get('/api/admin/usuarios')
            .set('Authorization', `Bearer ${tokenFalso}`);
        expect(res.status).toBe(401);
        expect(res.body.erro).toMatch(/expirada|inválida|negado/i);
    });

    it('TC-05: Deve barrar token de usuário inexistente no banco de dados (401)', async () => {
        const res = await request(app)
            .post('/api/agendamentos')
            .set('Authorization', `Bearer ${tokenCandidato}`)
            .send({ disponibilidade_id: 'disp-mock-123' });
        expect(res.status).toBe(401);
        expect(res.body.erro).toMatch(/não encontrado|sessão|expirada/i);
    });

    it('TC-06: Deve rejeitar registro de usuário sem consentimento de termos LGPD (400)', async () => {
        const res = await request(app)
            .post('/api/usuarios/registrar')
            .send({
                nome: 'Teste Sem LGPD',
                email: 'semlgpd@teste.com',
                telefone: '71999999999',
                senha: 'senhaforte123',
                confirmar_senha: 'senhaforte123',
                consentimento_termos: false
            });
        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/LGPD|termos/i);
    });

    it('TC-07: Deve rejeitar registro com confirmação de senha divergente (400)', async () => {
        const res = await request(app)
            .post('/api/usuarios/registrar')
            .send({
                nome: 'Teste Senha Divergente',
                email: 'divergente@teste.com',
                telefone: '71999999999',
                senha: 'senhaforte123',
                confirmar_senha: 'outrasenhadiferente',
                consentimento_termos: true
            });
        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/não coincidem|coincidem/i);
    });

    it('TC-08: Deve rejeitar registro com senha menor que 6 caracteres (400)', async () => {
        const res = await request(app)
            .post('/api/usuarios/registrar')
            .send({
                nome: 'Teste Senha Curta',
                email: 'curta@teste.com',
                telefone: '71999999999',
                senha: '123',
                confirmar_senha: '123',
                consentimento_termos: true
            });
        expect(res.status).toBe(400);
        expect(res.body.erro).toMatch(/6 caracteres/i);
    });
});
