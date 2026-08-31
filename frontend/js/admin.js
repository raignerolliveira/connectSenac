// frontend/js/admin.js
// ─────────────────────────────────────────────────────────
// Connect Senac — Módulo Administrativo & Coordenação
// ─────────────────────────────────────────────────────────

const FALLBACK_BASE_URL = 'http://localhost:3000/api';
const API_URL = window.location.protocol === 'file:' ? FALLBACK_BASE_URL : `${window.location.origin}/api`;

const token = localStorage.getItem('token');
let payloadToken = null;

// Validação de Sessão e Permissões
if (!token) {
    window.location.href = 'index.html';
} else {
    try {
        payloadToken = JSON.parse(atob(token.split('.')[1]));

        // Verificar expiração do token JWT
        if (payloadToken.exp && payloadToken.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }

        // Apenas 'admin' e 'coordenador' podem acessar esta central
        if (payloadToken.perfil !== 'admin' && payloadToken.perfil !== 'coordenador') {
            if (payloadToken.perfil === 'profissional') {
                window.location.href = 'profissional.html';
            } else {
                window.location.href = 'painel.html';
            }
        }

        const userNomeEl = document.getElementById('userNome');
        const userPerfilEl = document.getElementById('userPerfil');
        if (userNomeEl && (payloadToken.nome || payloadToken.email)) {
            userNomeEl.textContent = payloadToken.nome || payloadToken.email.split('@')[0];
        }
        if (userPerfilEl && payloadToken.perfil) {
            userPerfilEl.textContent = payloadToken.perfil.toUpperCase();
        }

        // Esconder aba de criação de colaboradores para quem for apenas Coordenador
        if (payloadToken.perfil === 'coordenador') {
            const equipaTab = document.getElementById('equipa-tab');
            if (equipaTab) equipaTab.style.display = 'none';
        }
    } catch (e) {
        console.error('Erro ao ler token no admin:', e);
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

// Botão de Logout
const btnSair = document.getElementById('btnSair');
if (btnSair) {
    btnSair.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

// Função auxiliar de escape contra XSS
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// 1. CARREGAR MÉTRICAS DO DASHBOARD
// ============================================================================
async function carregarMetricas() {
    try {
        const response = await fetch(`${API_URL}/dashboard/metricas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }

        if (response.ok) {
            const data = await response.json();
            const metricUsuariosEl = document.getElementById('metricUsuarios');
            const metricAgendadosEl = document.getElementById('metricAgendados');
            const metricConcluidosEl = document.getElementById('metricConcluidos');
            const metricCancelamentoEl = document.getElementById('metricCancelamento');

            const totalUsuarios = data.totalUsuarios ?? 0;
            const agendados = data.agendamentos?.agendados ?? 0;
            const concluidos = data.agendamentos?.concluidos ?? 0;
            const taxaCancelamento = data.taxaCancelamento ?? '0%';

            if (typeof window.animateCounter === 'function') {
                if (metricUsuariosEl) window.animateCounter(metricUsuariosEl, totalUsuarios);
                if (metricAgendadosEl) window.animateCounter(metricAgendadosEl, agendados);
                if (metricConcluidosEl) window.animateCounter(metricConcluidosEl, concluidos);
                if (metricCancelamentoEl) window.animateCounter(metricCancelamentoEl, taxaCancelamento);
            } else {
                if (metricUsuariosEl) metricUsuariosEl.textContent = totalUsuarios;
                if (metricAgendadosEl) metricAgendadosEl.textContent = agendados;
                if (metricConcluidosEl) metricConcluidosEl.textContent = concluidos;
                if (metricCancelamentoEl) metricCancelamentoEl.textContent = taxaCancelamento;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    }
}

// ============================================================================
// 2. GESTÃO DE UTILIZADORES & HISTÓRICO (MODERAÇÃO)
// ============================================================================
let baseUtilizadores = [];

async function carregarUtilizadores() {
    const tbody = document.getElementById('tabelaUsuariosBody');
    try {
        const response = await fetch(`${API_URL}/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Falha ao obter lista de utilizadores.');
        }

        baseUtilizadores = await response.json();
        if (!Array.isArray(baseUtilizadores)) baseUtilizadores = [];
        renderizarTabelaUtilizadores(baseUtilizadores);
    } catch (error) {
        console.error('Erro ao carregar utilizadores:', error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-danger text-center py-4">Erro ao ligar ao servidor para carregar utilizadores.</td></tr>';
        }
    }
}

function renderizarTabelaUtilizadores(lista) {
    const tbody = document.getElementById('tabelaUsuariosBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!Array.isArray(lista) || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4"><i class="bi bi-person-x fs-3 d-block mb-2"></i>Nenhum utilizador encontrado com estes filtros.</td></tr>';
        return;
    }

    lista.forEach(user => {
        const nomeUser = escapeHTML(user.nome || 'Sem Nome');
        const emailUser = escapeHTML(user.email || '-');
        const telUser = escapeHTML(user.telefone || '-');
        const cursosUser = escapeHTML(user.cursos_ativos || '-');

        // 1. Mensagem de WhatsApp Dinâmica
        const telLimpo = user.telefone ? String(user.telefone).replace(/\D/g, '') : '';
        const msgZap = encodeURIComponent(`Olá, ${user.nome || 'usuário'}! Aqui é a Coordenação do Connect Senac.`);
        const btnZap = telLimpo
            ? `<a href="https://wa.me/55${telLimpo}?text=${msgZap}" target="_blank" class="btn btn-sm btn-outline-success border-0 px-2" title="Conversar no WhatsApp"><i class="bi bi-whatsapp fs-6"></i></a>`
            : '';

        // 2. Select Dinâmico de Perfis
        let seletorPerfil = `<span class="badge badge-soft-secondary px-2 py-1">${escapeHTML((user.perfil || '').toUpperCase())}</span>`;
        if (payloadToken && payloadToken.perfil === 'admin') {
            seletorPerfil = `
                <select class="form-select form-select-sm border-secondary-subtle" style="min-width: 110px;" onchange="alterarPerfil('${user.id}', this.value)">
                    <option value="candidato" ${user.perfil === 'candidato' ? 'selected' : ''}>Candidato</option>
                    <option value="profissional" ${user.perfil === 'profissional' ? 'selected' : ''}>Professor</option>
                    <option value="coordenador" ${user.perfil === 'coordenador' ? 'selected' : ''}>Coord.</option>
                    <option value="admin" ${user.perfil === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            `;
        }

        // 3. Bloqueio / Moderação (Apenas Admin)
        const btnBloqueio = (payloadToken && payloadToken.perfil === 'admin')
            ? `<button class="btn btn-sm ${user.is_bloqueado ? 'btn-outline-success' : 'btn-outline-warning'} border-0 px-2" onclick="toggleBloqueio('${user.id}', ${Boolean(user.is_bloqueado)})" title="${user.is_bloqueado ? 'Desbloquear Conta' : 'Bloquear Conta'}"><i class="bi ${user.is_bloqueado ? 'bi-unlock-fill' : 'bi-lock-fill'}"></i></button>`
            : '';

        // 4. Excluir Conta
        const podeExcluir = payloadToken && (payloadToken.perfil === 'admin' || (payloadToken.perfil === 'coordenador' && user.perfil === 'candidato'));
        const btnExcluir = podeExcluir
            ? `<button class="btn btn-sm btn-outline-danger border-0 px-2" onclick="excluirUsuario('${user.id}')" title="Excluir Conta"><i class="bi bi-trash-fill"></i></button>`
            : '';

        const row = `
            <tr>
                <td><div class="fw-bold text-dark">${nomeUser}</div></td>
                <td>
                    <div class="small fw-semibold text-secondary">${emailUser}</div>
                    <div class="text-muted small">${telUser}</div>
                </td>
                <td>${seletorPerfil}</td>
                <td><span class="badge badge-soft-primary">${cursosUser}</span></td>
                <td class="text-center fw-bold text-primary">${user.total_agendados || 0}</td>
                <td class="text-center fw-bold text-success">${user.total_concluidos || 0}</td>
                <td class="text-center fw-bold text-danger">${user.total_cancelados || 0}</td>
                <td class="text-end text-nowrap">
                    <div class="d-inline-flex gap-1">
                        ${btnZap}
                        ${btnBloqueio}
                        ${btnExcluir}
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Filtros em Memória
function aplicarFiltrosUsuarios() {
    const termo = (document.getElementById('filtroTextoUser')?.value || '').toLowerCase().trim();
    const perfil = document.getElementById('filtroPerfilUser')?.value || '';

    const listaFiltrada = baseUtilizadores.filter(user => {
        const nome = (user.nome || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const matchTexto = !termo || nome.includes(termo) || email.includes(termo);
        const matchPerfil = !perfil || user.perfil === perfil;
        return matchTexto && matchPerfil;
    });

    renderizarTabelaUtilizadores(listaFiltrada);
}

const inputBusca = document.getElementById('filtroTextoUser');
const selectPerfil = document.getElementById('filtroPerfilUser');
const btnLimpar = document.getElementById('btnLimparFiltros');

if (inputBusca) inputBusca.addEventListener('input', aplicarFiltrosUsuarios);
if (selectPerfil) selectPerfil.addEventListener('change', aplicarFiltrosUsuarios);
if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
        if (inputBusca) inputBusca.value = '';
        if (selectPerfil) selectPerfil.value = '';
        renderizarTabelaUtilizadores(baseUtilizadores);
    });
}

// Alteração de Perfil de Usuário
async function alterarPerfil(idUsuario, novoPerfil) {
    if (!confirm(`Deseja alterar o perfil deste utilizador para ${novoPerfil.toUpperCase()}?`)) {
        carregarUtilizadores();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${idUsuario}/perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ perfil: novoPerfil })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            alert(data.mensagem || 'Perfil atualizado com sucesso!');
            carregarUtilizadores();
        } else {
            alert(data.erro || 'Erro ao alterar o perfil.');
            carregarUtilizadores();
        }
    } catch (error) {
        console.error('Erro ao alterar perfil:', error);
        alert('Erro ao alterar o perfil.');
        carregarUtilizadores();
    }
}

// Bloqueio/Desbloqueio (Moderação)
async function toggleBloqueio(id, statusAtual) {
    const acao = statusAtual ? 'desbloquear' : 'bloquear';
    if (!confirm(`Tem certeza de que deseja ${acao} este utilizador?`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${id}/bloquear`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_bloqueado: !statusAtual })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            carregarUtilizadores();
            carregarMetricas();
        } else {
            alert(data.erro || 'Erro ao alterar estado do utilizador.');
        }
    } catch (error) {
        console.error('Erro ao moderar utilizador:', error);
        alert('Erro de conexão com o servidor.');
    }
}

// Excluir Utilizador
async function excluirUsuario(id) {
    const user = baseUtilizadores.find(u => String(u.id) === String(id));
    const nome = user ? user.nome : 'este utilizador';

    if (!confirm(`Tem certeza absoluta de que deseja excluir permanentemente "${nome}"? Todos os agendamentos vinculados serão apagados.`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/usuarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            carregarUtilizadores();
            carregarMetricas();
        } else {
            alert(data.erro || 'Erro ao excluir utilizador.');
        }
    } catch (error) {
        console.error('Erro ao excluir utilizador:', error);
        alert('Erro na conexão com o servidor.');
    }
}

// ============================================================================
// 3. CRIAR NOVO COLABORADOR (APENAS ADMIN)
// ============================================================================
const colabTelInput = document.getElementById('colabTelefone');
if (colabTelInput) {
    colabTelInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 6) {
            e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        } else if (v.length > 2) {
            e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        } else if (v.length > 0) {
            e.target.value = `(${v}`;
        }
    });
}

const formColaborador = document.getElementById('formColaborador');
if (formColaborador) {
    formColaborador.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('msgColab');
        const senha = document.getElementById('colabSenha')?.value || '';

        if (senha.length < 6) {
            if (msgDiv) msgDiv.innerHTML = '<span class="text-danger">A senha deve ter no mínimo 6 caracteres.</span>';
            return;
        }

        if (msgDiv) msgDiv.innerHTML = '<span class="text-primary">A registar colaborador...</span>';

        const payload = {
            nome: document.getElementById('colabNome')?.value.trim(),
            email: document.getElementById('colabEmail')?.value.trim(),
            telefone: document.getElementById('colabTelefone')?.value.trim(),
            senha: senha,
            perfil: document.getElementById('colabPerfil')?.value
        };

        try {
            const response = await fetch(`${API_URL}/admin/colaboradores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                if (msgDiv) msgDiv.innerHTML = `<span class="text-success">${data.mensagem || 'Colaborador criado com sucesso!'}</span>`;
                formColaborador.reset();
                carregarUtilizadores();
                carregarProfissionaisNoSelect();
            } else {
                if (msgDiv) msgDiv.innerHTML = `<span class="text-danger">${data.erro || 'Erro ao cadastrar colaborador.'}</span>`;
            }
        } catch (error) {
            console.error('Erro ao cadastrar colaborador:', error);
            if (msgDiv) msgDiv.innerHTML = '<span class="text-danger">Erro de ligação com o servidor.</span>';
        }
    });
}

// ============================================
// 4. CADASTRO DE CURSOS E VAGAS
// ============================================
const formCurso = document.getElementById('formCurso');
if (formCurso) {
    formCurso.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('msgCurso');
        if (msgDiv) msgDiv.innerHTML = '<span class="text-primary">A guardar curso...</span>';

        const payload = {
            nome: document.getElementById('nomeCurso')?.value.trim(),
            descricao: document.getElementById('descricaoCurso')?.value.trim(),
            motivo_modelo: document.getElementById('motivoCurso')?.value.trim() || null,
            restricoes: document.getElementById('restricoesCurso')?.value.trim() || null,
            foto_url: document.getElementById('fotoCurso')?.value.trim() || null,
            localizacao: document.getElementById('localCurso')?.value.trim(),
            profissional_id: document.getElementById('selectProfissional')?.value
        };

        try {
            const response = await fetch(`${API_URL}/cursos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                if (msgDiv) msgDiv.innerHTML = `<span class="text-success">${data.mensagem || 'Curso criado com sucesso!'}</span>`;
                formCurso.reset();
                carregarCursosNoSelect();
                carregarCursosAdmin();
                carregarPautasGlobais();
            } else {
                if (msgDiv) msgDiv.innerHTML = `<span class="text-danger">${data.erro || 'Erro ao salvar curso.'}</span>`;
            }
        } catch (error) {
            console.error('Erro ao criar curso:', error);
            if (msgDiv) msgDiv.innerHTML = '<span class="text-danger">Erro de ligação.</span>';
        }
    });
}

async function carregarCursosNoSelect() {
    const select = document.getElementById('selectCurso');
    if (!select) return;
    try {
        const response = await fetch(`${API_URL}/cursos/ativos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cursos = await response.json();

        select.innerHTML = '<option value="" disabled selected>Selecione o curso...</option>';
        if (Array.isArray(cursos) && cursos.length > 0) {
            cursos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.id;
                option.textContent = curso.nome;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="" disabled selected>Nenhum curso ativo disponível</option>';
        }
    } catch (error) {
        console.error('Erro ao carregar cursos no select:', error);
        select.innerHTML = '<option value="" disabled selected>Erro ao carregar cursos</option>';
    }
}

const formVagas = document.getElementById('formVagas');
if (formVagas) {
    formVagas.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('msgVaga');
        if (msgDiv) msgDiv.innerHTML = '<span class="text-primary">A abrir vagas...</span>';

        const cursoId = document.getElementById('selectCurso')?.value;
        const dataHora = document.getElementById('dataHora')?.value;
        const vagasTotais = parseInt(document.getElementById('vagasTotais')?.value, 10);

        if (!cursoId || !dataHora || isNaN(vagasTotais) || vagasTotais <= 0) {
            if (msgDiv) msgDiv.innerHTML = '<span class="text-danger">Preencha todos os campos corretamente.</span>';
            return;
        }

        const payload = {
            curso_id: cursoId,
            data_hora: dataHora,
            vagas_totais: vagasTotais
        };

        try {
            const response = await fetch(`${API_URL}/disponibilidades`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                if (msgDiv) msgDiv.innerHTML = `<span class="text-success">${data.mensagem || 'Horário disponibilizado com sucesso!'}</span>`;
                formVagas.reset();
                carregarMetricas();
                carregarPautasGlobais();
            } else {
                if (msgDiv) msgDiv.innerHTML = `<span class="text-danger">${data.erro || 'Erro ao disponibilizar vagas.'}</span>`;
            }
        } catch (error) {
            console.error('Erro ao disponibilizar vagas:', error);
            if (msgDiv) msgDiv.innerHTML = '<span class="text-danger">Erro de ligação.</span>';
        }
    });
}

let listaProfissionaisMemoria = [];

async function carregarProfissionaisNoSelect() {
    const select = document.getElementById('selectProfissional');
    const selectEdit = document.getElementById('editProfissional');
    if (!select && !selectEdit) return;

    try {
        const response = await fetch(`${API_URL}/admin/profissionais`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profissionais = await response.json();
        listaProfissionaisMemoria = Array.isArray(profissionais) ? profissionais : [];

        const optionsHTML = ['<option value="" disabled selected>Selecione o professor...</option>'];
        if (listaProfissionaisMemoria.length > 0) {
            listaProfissionaisMemoria.forEach(p => {
                optionsHTML.push(`<option value="${p.id}">${escapeHTML(p.nome)}</option>`);
            });
        } else {
            optionsHTML.push('<option value="" disabled>Nenhum professor cadastrado</option>');
        }

        if (select) select.innerHTML = optionsHTML.join('');
        if (selectEdit) selectEdit.innerHTML = optionsHTML.join('');
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
        if (select) select.innerHTML = '<option value="" disabled>Erro ao carregar professores</option>';
        if (selectEdit) selectEdit.innerHTML = '<option value="" disabled>Erro ao carregar professores</option>';
    }
}

// ==========================================
// 5. GESTÃO E MODAL DE CURSOS
// ==========================================
let modalEditarCursoInstance = null;
let catalogoCursosAdminMemoria = [];

function obterInstanciaModalEdicao() {
    const modalEl = document.getElementById('modalEditarCurso');
    if (!modalEl) return null;
    if (window.bootstrap && window.bootstrap.Modal) {
        return window.bootstrap.Modal.getOrCreateInstance(modalEl);
    }
    return null;
}

async function carregarCursosAdmin() {
    const tbody = document.getElementById('tabelaCursosBody');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_URL}/cursos/admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }

        const cursos = await response.json();
        catalogoCursosAdminMemoria = Array.isArray(cursos) ? cursos : [];

        tbody.innerHTML = '';
        if (catalogoCursosAdminMemoria.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4"><i class="bi bi-inbox fs-3 d-block mb-2"></i>Nenhum curso cadastrado no sistema.</td></tr>';
            return;
        }

        catalogoCursosAdminMemoria.forEach(curso => {
            const nomeCurso = escapeHTML(curso.nome || 'Sem Nome');
            const descCurso = escapeHTML(curso.descricao || '');
            const profNome = escapeHTML(curso.usuarios ? curso.usuarios.nome : 'Sem Professor');
            const localCurso = escapeHTML(curso.localizacao || '-');

            const statusBadge = curso.status === 'ativo'
                ? '<span class="badge badge-soft-success px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>Ativo</span>'
                : '<span class="badge badge-soft-secondary px-2 py-1"><i class="bi bi-archive-fill me-1"></i>Arquivado</span>';

            const btnArquivar = curso.status === 'ativo'
                ? `<button class="btn btn-sm btn-outline-danger border-0 px-2" onclick="arquivarCurso('${curso.id}')" title="Arquivar Curso"><i class="bi bi-archive-fill"></i></button>`
                : '';

            const row = `
                <tr>
                    <td>
                        <div class="fw-bold text-dark">${nomeCurso}</div>
                        <div class="small text-muted text-truncate" style="max-width: 260px;">${descCurso}</div>
                    </td>
                    <td><div class="small fw-semibold text-secondary"><i class="bi bi-person-badge text-primary me-1"></i>${profNome}</div></td>
                    <td class="small text-muted"><i class="bi bi-geo-alt text-secondary me-1"></i>${localCurso}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end text-nowrap">
                        <div class="d-inline-flex gap-1">
                            <button class="btn btn-sm btn-soft-primary px-3 fw-bold" onclick="abrirModalEdicaoPorId('${curso.id}')"><i class="bi bi-pencil-square me-1"></i>Editar</button>
                            ${btnArquivar}
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Erro ao carregar cursos admin:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center py-4">Erro ao carregar catálogo de cursos.</td></tr>';
    }
}

async function arquivarCurso(id) {
    const curso = catalogoCursosAdminMemoria.find(c => String(c.id) === String(id));
    const nome = curso ? curso.nome : 'este curso';

    if (!confirm(`Deseja arquivar o curso "${nome}"? Ele sairá da vitrine dos alunos, mas o histórico de agendamentos será mantido.`)) return;

    try {
        const response = await fetch(`${API_URL}/cursos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            carregarCursosAdmin();
            carregarCursosNoSelect();
            carregarPautasGlobais();
        } else {
            alert(data.erro || 'Erro ao arquivar curso.');
        }
    } catch (error) {
        console.error('Erro ao arquivar curso:', error);
        alert('Erro de conexão com o servidor.');
    }
}

function abrirModalEdicaoPorId(cursoId) {
    const curso = catalogoCursosAdminMemoria.find(c => String(c.id) === String(cursoId));
    if (!curso) return;
    abrirModalEdicao(curso);
}

function abrirModalEdicao(curso) {
    const editIdEl = document.getElementById('editCursoId');
    const editNomeEl = document.getElementById('editNome');
    const editDescEl = document.getElementById('editDescricao');
    const editLocalEl = document.getElementById('editLocal');
    const editFotoEl = document.getElementById('editFoto');
    const selectEdit = document.getElementById('editProfissional');
    const msgEdit = document.getElementById('msgEditCurso');

    if (editIdEl) editIdEl.value = curso.id;
    if (editNomeEl) editNomeEl.value = curso.nome || '';
    if (editDescEl) editDescEl.value = curso.descricao || '';
    if (editLocalEl) editLocalEl.value = curso.localizacao || '';
    if (editFotoEl) editFotoEl.value = curso.foto_url || '';
    if (msgEdit) msgEdit.innerHTML = '';

    if (selectEdit) {
        if (listaProfissionaisMemoria.length > 0) {
            selectEdit.innerHTML = '<option value="" disabled>Selecione o professor...</option>' +
                listaProfissionaisMemoria.map(p => `<option value="${p.id}">${escapeHTML(p.nome)}</option>`).join('');
        }
        selectEdit.value = curso.profissional_id || '';
    }

    const modalInstance = obterInstanciaModalEdicao();
    if (modalInstance) modalInstance.show();
}

const formEditarCurso = document.getElementById('formEditarCurso');
if (formEditarCurso) {
    formEditarCurso.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editCursoId')?.value;
        const msgDiv = document.getElementById('msgEditCurso');
        if (msgDiv) msgDiv.innerHTML = '<span class="text-primary">A atualizar curso...</span>';

        const payload = {
            nome: document.getElementById('editNome')?.value.trim(),
            descricao: document.getElementById('editDescricao')?.value.trim(),
            localizacao: document.getElementById('editLocal')?.value.trim(),
            foto_url: document.getElementById('editFoto')?.value.trim() || null,
            profissional_id: document.getElementById('editProfissional')?.value
        };

        try {
            const response = await fetch(`${API_URL}/cursos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                if (msgDiv) msgDiv.innerHTML = `<span class="text-success">${data.mensagem || 'Curso atualizado com sucesso!'}</span>`;
                carregarCursosAdmin();
                carregarCursosNoSelect();
                carregarPautasGlobais();
                setTimeout(() => {
                    const modalInstance = obterInstanciaModalEdicao();
                    if (modalInstance) modalInstance.hide();
                }, 1200);
            } else {
                if (msgDiv) msgDiv.innerHTML = `<span class="text-danger">${data.erro || 'Erro ao atualizar curso.'}</span>`;
            }
        } catch (error) {
            console.error('Erro ao editar curso:', error);
            if (msgDiv) msgDiv.innerHTML = '<span class="text-danger">Erro de conexão.</span>';
        }
    });
}

// ==========================================
// 6. MÓDULO DE PAUTAS GLOBAIS (VISÃO COORDENAÇÃO)
// ==========================================
async function carregarPautasGlobais() {
    const accordion = document.getElementById('accordionPautasGlobais');
    if (!accordion) return;

    try {
        const response = await fetch(`${API_URL}/admin/pautas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }

        const cursos = await response.json();
        accordion.innerHTML = '';

        if (!Array.isArray(cursos) || cursos.length === 0) {
            accordion.innerHTML = '<div class="alert alert-info border-0 rounded-3 p-3 text-center small"><i class="bi bi-info-circle me-1"></i>Nenhuma pauta ativa no momento.</div>';
            return;
        }

        cursos.forEach((curso, index) => {
            let horariosHTML = '';
            const nomeProfessor = escapeHTML(curso.usuarios ? curso.usuarios.nome : 'Sem Docente');

            if (curso.disponibilidades && curso.disponibilidades.length > 0) {
                const dispsOrdenadas = [...curso.disponibilidades].sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

                dispsOrdenadas.forEach(disp => {
                    const dataFormatada = new Date(disp.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                    const agendamentosAtivos = disp.agendamentos ? disp.agendamentos.filter(a => a.status !== 'cancelado') : [];

                    let tabelaModelos = '';
                    if (agendamentosAtivos.length === 0) {
                        tabelaModelos = '<p class="text-muted small mb-0 p-2.5 bg-light rounded-3 text-center"><i class="bi bi-info-circle me-1"></i>Nenhum modelo agendado.</p>';
                    } else {
                        const linhas = agendamentosAtivos.map(ag => {
                            const telLimpo = ag.usuarios && ag.usuarios.telefone ? String(ag.usuarios.telefone).replace(/\D/g, '') : '';
                            const telTexto = escapeHTML(ag.usuarios && ag.usuarios.telefone ? ag.usuarios.telefone : 'Sem telefone');
                            const nomeAluno = escapeHTML(ag.usuarios ? ag.usuarios.nome : 'Modelo');
                            const msgZap = encodeURIComponent(`Olá ${ag.usuarios ? ag.usuarios.nome : 'Modelo'}, aqui é da Coordenação do Senac.`);

                            const whatsappBtn = telLimpo
                                ? `<a href="https://wa.me/55${telLimpo}?text=${msgZap}" target="_blank" class="btn btn-sm btn-outline-success border-0 px-2 py-0 fw-semibold text-nowrap" style="font-size: 0.78rem;" title="WhatsApp"><i class="bi bi-whatsapp me-1"></i>${telTexto}</a>`
                                : '<span class="text-muted small" style="font-size: 0.78rem;">Sem tel</span>';

                            let statusBadge = '';
                            if (ag.status === 'concluido') {
                                statusBadge = '<span class="badge badge-soft-success px-2 py-1" style="font-size: 0.72rem;"><i class="bi bi-patch-check-fill me-1"></i>CONCLUÍDO</span>';
                            } else if (ag.status === 'agendado') {
                                statusBadge = '<span class="badge badge-soft-primary px-2 py-1" style="font-size: 0.72rem;">CONFIRMADO</span>';
                            } else {
                                statusBadge = `<span class="badge badge-soft-secondary px-2 py-1" style="font-size: 0.72rem;">${escapeHTML((ag.status || '').toUpperCase())}</span>`;
                            }

                            return `
                            <tr>
                                <td class="align-middle fw-bold text-dark py-2" style="font-size: 0.84rem;">${nomeAluno}</td>
                                <td class="align-middle py-2">${whatsappBtn}</td>
                                <td class="align-middle text-end py-2">${statusBadge}</td>
                            </tr>
                            `;
                        }).join('');

                        tabelaModelos = `
                            <div class="table-responsive">
                                <table class="table table-hover table-sm mb-0 align-middle">
                                    <thead class="table-light">
                                        <tr style="font-size: 0.74rem; text-transform: uppercase;">
                                            <th>Modelo</th>
                                            <th>Contato</th>
                                            <th class="text-end">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>${linhas}</tbody>
                                </table>
                            </div>`;
                    }

                    horariosHTML += `
                        <div class="schedule-card mb-3 p-3 bg-light rounded-3 border">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="fw-semibold text-dark">
                                    <i class="bi bi-calendar2-event text-primary me-1"></i>
                                    <span>Aula: ${dataFormatada}</span>
                                </div>
                                <span class="badge badge-soft-primary px-2.5 py-1" style="font-size: 0.74rem;">
                                    Vagas: ${disp.vagas_ocupadas || 0} / ${disp.vagas_totais}
                                </span>
                            </div>
                            ${tabelaModelos}
                        </div>
                    `;
                });
            }

            const itemOpen = index === 0 ? 'show' : '';
            const btnCollapsed = index === 0 ? '' : 'collapsed';

            accordion.innerHTML += `
                <div class="accordion-item mb-2 border rounded-3 overflow-hidden">
                    <h2 class="accordion-header">
                        <button class="accordion-button ${btnCollapsed}" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePauta${curso.id}">
                            <i class="bi bi-journal-text text-primary me-2"></i>
                            <span class="me-auto fw-semibold">${escapeHTML(curso.nome)}</span>
                            <span class="badge badge-soft-primary ms-2" style="font-size: 0.72rem;">
                                <i class="bi bi-person-badge me-1"></i>${nomeProfessor}
                            </span>
                        </button>
                    </h2>
                    <div id="collapsePauta${curso.id}" class="accordion-collapse collapse ${itemOpen}" data-bs-parent="#accordionPautasGlobais">
                        <div class="accordion-body">
                            ${horariosHTML || '<p class="text-muted small mb-0 text-center py-2">Sem horários abertos para este curso.</p>'}
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar as pautas globais:', error);
        accordion.innerHTML = '<div class="alert alert-danger rounded-3 text-center small p-3">Erro ao carregar os dados. Verifique a conexão com o servidor.</div>';
    }
}

// Expor funções no escopo global para eventos inline (onclick/onchange)
window.alterarPerfil = alterarPerfil;
window.toggleBloqueio = toggleBloqueio;
window.excluirUsuario = excluirUsuario;
window.arquivarCurso = arquivarCurso;
window.abrirModalEdicaoPorId = abrirModalEdicaoPorId;
window.abrirModalEdicao = abrirModalEdicao;

// Inicialização segura
function inicializarPainelAdmin() {
    if (token) {
        carregarMetricas();
        carregarProfissionaisNoSelect();
        carregarCursosNoSelect();
        carregarUtilizadores();
        carregarCursosAdmin();
        carregarPautasGlobais();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPainelAdmin);
} else {
    inicializarPainelAdmin();
}
