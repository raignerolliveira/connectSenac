// frontend/js/admin.js

const FALLBACK_BASE_URL = 'http://localhost:3000/api';
const API_URL = window.location.protocol === 'file:' ? FALLBACK_BASE_URL : `${window.location.origin}/api`;

// 1. Verificação de Segurança de Borda (Front-end)
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
}

// Lógica de Logout
document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// 2. Lógica para Criar Cursos
const formCurso = document.getElementById('formCurso');
formCurso.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('msgCurso');
    msgDiv.innerHTML = '<span class="text-primary">A salvar curso...</span>';

    const payload = {
        nome: document.getElementById('nomeCurso').value,
        descricao: document.getElementById('descricaoCurso').value,
        motivo_modelo: document.getElementById('motivoCurso').value,
        restricoes: document.getElementById('restricoesCurso').value
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

        const data = await response.json();

        if (response.ok) {
            msgDiv.innerHTML = `<span class="text-success">${data.mensagem}</span>`;
            formCurso.reset();
            carregarCursosNoSelect(); // Atualiza a lista da coluna ao lado!
        } else {
            msgDiv.innerHTML = `<span class="text-danger">${data.erro}</span>`;
        }
    } catch (error) {
        msgDiv.innerHTML = `<span class="text-danger">Erro de conexão com o servidor.</span>`;
    }
});

// 3. Função para carregar Cursos no <select> dinamicamente
async function carregarCursosNoSelect(){
    const select = document.getElementById('selectCurso');
    try {
        const response = await fetch(`${API_URL}/cursos/ativos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cursos = await response.json();

        select.innerHTML = '<option value="" disabled selected>Selecione o curso...</option>';

        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id;
            option.textContent = curso.nome;
            select.appendChild(option);
        });
    } catch (error) {
        select.innerHTML = '<option value="" disabled>Erro ao carregar cursos</option>';
    }
}

// 4. Lógica para Criar Disponibilidade (Vagas)
const formVagas = document.getElementById('formVagas');
formVagas.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('msgVaga');
    msgDiv.innerHTML = '<span class="text-primary">A abrir vagas...</span>';

    const payload = {
        curso_id: document.getElementById('selectCurso').value,
        // O Supabase e o Node esperam a data no formato ISO, o input datetime-local já facilita isso
        data_hora: document.getElementById('dataHora').value,
        vagas_totais: parseInt(document.getElementById('vagasTotais').value)
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

        const data = await response.json();

        if (response.ok) {
            msgDiv.innerHTML = `<span class="text-success">${data.mensagem}</span>`;
            formVagas.reset();
        } else {
            msgDiv.innerHTML = `<span class="text-danger">${data.erro}</span>`;
        }
    } catch (error) {
        msgDiv.innerHTML = `<span class="text-danger">Erro de conexão com o servidor.</span>`;
    }
});

// Inicialização: Carrega os cursos assim que a página abre
carregarCursosNoSelect();

// ==========================================
// MÓDULO: Dashboard Analítico
// ==========================================
async function carregarMetricas() {
    try {
        const response = await fetch(`${API_URL}/dashboard/metricas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();

            // Animação simples de contagem pode ser feita com CSS, aqui inserimos direto o valor
            document.getElementById('metricUsuarios').textContent = data.totalUsuarios;
            document.getElementById('metricAgendados').textContent = data.agendamentos.agendados;
            document.getElementById('metricConcluidos').textContent = data.agendamentos.concluidos;

            // Tratamento visual para a taxa de cancelamento
            const badgeCancelamento = document.getElementById('metricCancelamento');
            badgeCancelamento.textContent = data.taxaCancelamento;

            // Feedback visual: se cancelamento for maior que 20%, fica vermelho alerta
            if(parseFloat(data.taxaCancelamento) > 20.0) {
                badgeCancelamento.classList.add('text-danger');
            }
        }
    } catch (error) {
        console.error("Erro ao carregar os dados do dashboard analítico.");
    }
}

// Chamar a função na inicialização da página
carregarMetricas();