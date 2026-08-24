# [CONTEXTO PARA I.A.] Documentação Técnica - Connect Senac

**Atenção I.A.:** Leia este documento inteiramente antes de sugerir qualquer alteração. Ele contém as regras de negócio, a arquitetura de software e as convenções de código do sistema Connect Senac.

## 1. Visão Geral do Projeto
* **Nome:** Connect Senac
* **Status:** Aplicação Finalizada e Estabilizada
* **Objetivo:** Sistema de agendamento web responsivo para serviços práticos do SENAC (ex.: estética, cabeleireiro, massoterapia), conectando modelos/candidatos, docentes e coordenação para controle de absenteísmo e otimização de turmas.
* **Ambiente de Hospedagem:** Render / Vercel / Servidor Node.js compatível.

## 2. Stack Tecnológica Base
* **Back-end:** Node.js (v20 LTS), Express.js (v5.x).
* **Front-end:** HTML5, CSS3, JavaScript (Vanilla - ES6+), Bootstrap 5 (via CDN). Sem frameworks pesados de compilação.
* **Banco de Dados:** Supabase (PostgreSQL) via @supabase/supabase-js.
* **Segurança:** Autenticação Stateless via jsonwebtoken (JWT), criptografia com crypt, controle de acessos RBAC e verificação de bloqueio em tempo real.
* **Tarefas em Segundo Plano:** 
ode-cron para disparo e monitoramento de notificações de agendamentos.
* **Arquitetura:** Monólito unificado. O Front-end é servido estaticamente pelo próprio Express via pp.use(express.static(path.join(__dirname, 'frontend')));.

## 3. Estrutura de Diretórios (Padrão MVC no Back-end)
`	ext
connect-senac/
├── backend/
│   ├── config/
│   │   └── database.js (Conexão Supabase / PostgreSQL)
│   ├── controllers/
│   │   ├── adminController.js (Gestão de usuários, moderação, criação de colaboradores, pautas)
│   │   ├── agendamentoController.js (Criar, cancelar com regra de 2h, listar do usuário)
│   │   ├── cursoController.js (Vitrine ativa, cadastro, edição e soft-delete de cursos)
│   │   ├── dashboardController.js (Métricas, taxas de cancelamento e ocupação)
│   │   ├── disponibilidadeController.js (Abertura de horários/vagas por curso)
│   │   ├── feedbackController.js (Criação de avaliações, listagem por curso e histórico)
│   │   ├── profissionalController.js (Pauta do professor, presença e cancelamento com liberação de vaga)
│   │   └── usuarioController.js (Login, registro LGPD, recuperação e redefinição de senha)
│   ├── cron/
│   │   └── notificador.js (Varredura periódica de lembretes)
│   ├── middlewares/
│   │   ├── authMiddleware.js (Verificação de token Bearer JWT e bloqueio)
│   │   └── rbacMiddleware.js (Controle de perfis: candidato, profissional, coordenador, admin)
│   └── routes/
│       ├── adminRoutes.js (/api/admin)
│       ├── agendamentoRoutes.js (/api/agendamentos)
│       ├── cursoRoutes.js (/api/cursos)
│       ├── dashboardRoutes.js (/api/dashboard)
│       ├── disponibilidadeRoutes.js (/api/disponibilidades)
│       ├── feedbackRoutes.js (/api/feedbacks)
│       ├── profissionalRoutes.js (/api/profissional)
│       └── usuarioRoutes.js (/api/usuarios)
├── frontend/
│   ├── index.html (Login e redirecionamento por perfil)
│   ├── cadastro.html (Registro com LGPD e máscara de telefone)
│   ├── esqueci-senha.html (Solicitação de recuperação de senha)
│   ├── redefinir-senha.html (Definição de nova senha com token)
│   ├── painel.html (Área do Candidato/Modelo: vitrine, agendamentos e feedbacks)
│   ├── profissional.html (Área do Professor: pautas de presença e WhatsApp)
│   ├── admin.html (Central da Coordenação e Administração)
│   └── js/
│       ├── admin.js
│       ├── auth.js
│       ├── painel.js
│       └── profissional.js
├── .env (Variáveis locais)
├── .env.example (Template de configuração de ambiente)
├── server.js (Ponto de entrada, configuração Express, CORS e Middlewares de erro)
└── package.json
`

## 4. Regras de Negócio Ativas (CRÍTICO)

1. **LGPD no Cadastro:** O registro de usuários exige consentimento_termos (obrigatório) e consentimento_imagem (opcional).
2. **Regra de Overbooking:** Não é permitido o cadastro em horários esgotados (agas_ocupadas >= vagas_totais) nem duplicidade para o mesmo usuário no mesmo horário.
3. **Restrição de Cancelamento pelo Candidato:** O endpoint PUT /api/agendamentos/:id/cancelar bloqueia cancelamentos com menos de **2 horas de antecedência** da hora agendada.
4. **Liberação Automática de Vagas:** Ao cancelar agendamentos (seja pelo candidato, professor ou admin), o campo agas_ocupadas da disponibilidade é decrementado de forma consistente.
5. **Feedbacks e Avaliações:** Avaliações de 1 a 5 estrelas só podem ser submetidas para agendamentos com status concluido.

## 5. Convenções de Código e Integração

1. **Rotas de API Dinâmicas (Front-end):**
   `javascript
   const API_URL = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : ${window.location.origin}/api;
   `
2. **Segurança em Requisições:** Rotas protegidas utilizam cabeçalho Authorization: Bearer <token>.
3. **Tratamento Centralizado de Erros:** Respostas JSON consistentes com { erro: 'mensagem' }.
