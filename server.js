// server.js
const { PORT, NODE_ENV } = require('./backend/config/env');
require('./backend/cron/notificador');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const usuarioRoutes = require('./backend/routes/usuarioRoutes');
const agendamentoRoutes = require('./backend/routes/agendamentoRoutes'); 
const cursoRoutes = require('./backend/routes/cursoRoutes'); 
const disponibilidadeRoutes = require('./backend/routes/disponibilidadeRoutes');

const app = express();

// Proteção de Cabeçalhos HTTP com Helmet (MIME Sniffing, Frameguard, Referrer, etc.)
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

// Limitador de Taxa Geral para a API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // Limite por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas requisições originadas deste IP. Tente novamente mais tarde.' }
});
app.use('/api', apiLimiter);

// Limitador Estrito para Autenticação / Recuperação de Senha
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 tentativas por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas de autenticação. Aguarde alguns minutos antes de tentar novamente.' }
});
app.use('/api/usuarios/login', authLimiter);
app.use('/api/usuarios/recuperar', authLimiter);
app.use('/api/usuarios/redefinir-senha', authLimiter);

// Middlewares
app.use(cors()); // Libera o acesso do Front-end
app.use(express.json()); // Parsing JSON

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota de teste simples
app.get('/api/status', (req, res) => {
    res.json({ mensagem: "Servidor Connect Senac rodando com sucesso!", status: "OK" });
});

// Rotas da API
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/disponibilidades', disponibilidadeRoutes);
app.use('/api/dashboard', require('./backend/routes/dashboardRoutes'));
app.use('/api/admin', require('./backend/routes/adminRoutes'));
app.use('/api/profissional', require('./backend/routes/profissionalRoutes'));
app.use('/api/feedbacks', require('./backend/routes/feedbackRoutes'));

// Rota 404 para endpoints de API não encontrados
app.use('/api', (req, res) => {
    res.status(404).json({ erro: `Endpoint da API não encontrado: ${req.method} ${req.originalUrl}` });
});

// Middleware Global de Tratamento de Erros
app.use((err, req, res, next) => {
    console.error('❌ [ERRO NÃO TRATADO]:', err.stack || err.message);
    res.status(err.status || 500).json({
        erro: NODE_ENV === 'production'
            ? 'Ocorreu um erro interno no servidor.'
            : (err.message || 'Erro interno no servidor.')
    });
});

// Iniciando o servidor se executado diretamente
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}/api/status`);
    });
}

module.exports = app;