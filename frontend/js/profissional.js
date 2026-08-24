// frontend/js/profissional.js

const FALLBACK_BASE_URL = http://localhost:3000/api;
const API_URL =
  window.location.protocol === file:
    ? FALLBACK_BASE_URL
    : ${window.location.origin}/api;

const token = localStorage.getItem(token);

if (!token) {
  window.location.href = index.html;
}

try {
  const payloadToken = JSON.parse(atob(token.split(.)[1]));
  const nomeProfEl = document.getElementById(nomeProf);
  if (nomeProfEl && payloadToken?.email) {
    nomeProfEl.textContent = payloadToken.email.split(@)[0];
  }
} catch (e) {
  console.error(Erro ao decodificar token:, e);
}

const btnSair = document.getElementById(btnSair);
if (btnSair) {
  btnSair.addEventListener(click, () => {
    localStorage.removeItem(token);
    window.location.href = index.html;
  });
}

async function carregarMinhasTurmas() {
  const accordion = document.getElementById(accordionTurmas);
  if (!accordion) return;

  try {
    const response = await fetch(${API_URL}/profissional/minhas-turmas, {
      headers: { Authorization: Bearer  },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(token);
      window.location.href = index.html;
      return;
    }

    const cursos = await response.json();
    accordion.innerHTML = ";

 if (!Array.isArray(cursos) || cursos.length === 0) {
 accordion.innerHTML =
 '<div class=alert alert-info border-0 shadow-sm>Nenhum curso ativo vinculado ao seu perfil de momento.</div>';
 return;
 }

 cursos.forEach((curso, index) => {
 let horariosHTML = ;

 if (curso.disponibilidades && curso.disponibilidades.length > 0) {
 // Ordenar as disponibilidades por data no Front-end
 curso.disponibilidades.sort(
 (a, b) => new Date(a.data_hora) - new Date(b.data_hora),
 );

 curso.disponibilidades.forEach((disp) => {
 const dataFormatada = new Date(disp.data_hora).toLocaleString(
 pt-BR,
 { dateStyle: short, timeStyle: short },
 );

 // Filtrar agendamentos que não foram cancelados
 const agendamentosAtivos = (disp.agendamentos || []).filter(
 (a) => a.status !== cancelado,
 );

 let tabelaModelos = ;
 if (agendamentosAtivos.length === 0) {
 tabelaModelos = <p class=text-muted small mb-0 mt-2>Nenhum modelo agendado para este horário ainda.</p>;
 } else {
 let linhas = agendamentosAtivos
 .map((ag) => {
 let acoesHTML = ;
 if (ag.status === agendado) {
 acoesHTML = 
 <div class=d-flex gap-1>
 <button class=btn btn-sm btn-outline-success fw-bold w-100 onclick=concluirServico('') title=Confirmar Presença>✅</button>
 <button class=btn btn-sm btn-outline-danger fw-bold w-100 onclick=cancelarAluno('', '') title=Cancelar / Falta>❌</button>
 </div>
 ;
 } else {
 acoesHTML = <span class=badge w-100 py-2 ></span>;
 }

 const nomeUsuario = ag.usuarios?.nome || Modelo;
 const emailUsuario = ag.usuarios?.email || -;
 const telUsuario = ag.usuarios?.telefone || ;
 const telLimpo = telUsuario.replace(/\D/g, );
 const msgProf = encodeURIComponent(Olá , aqui é do Senac referente ao seu agendamento.);

 const whatsappBtn = telLimpo
 ? <a href=https://wa.me/55?text= target=_blank class=btn btn-sm btn-outline-success border-0>📱 Falar no WhatsApp</a>
 : <span class=text-muted small>Sem telefone</span>;

 return 
 <tr>
 <td class=align-middle fw-semibold></td>
 <td class=align-middle text-muted small></td>
 <td class=align-middle></td>
 <td class=align-middle style=width: 150px;></td>
 </tr>
 ;
 })
 .join();

 tabelaModelos = 
 <div class=table-responsive>
 <table class=table table-sm mt-3 border align-middle>
 <thead class=table-light><tr><th>Modelo</th><th>Email</th><th>Contato</th><th class=text-center>Status / Ação</th></tr></thead>
 <tbody></tbody>
 </table>
 </div>;
 }

 horariosHTML += 
 <div class=mb-4 p-3 bg-white border rounded shadow-sm>
 <div class=fw-bold text-dark border-bottom pb-2>📅 Aula: <span class=badge bg-secondary float-end>Ocupação: / </span></div>
 
 </div>
 ;
 });
 }

 const itemOpen = index === 0 ? show : ;
 const btnCollapsed = index === 0 ?  : collapsed;

 accordion.innerHTML += 
 <div class=accordion-item border-0 border-bottom mb-2>
 <h2 class=accordion-header>
 <button class=accordion-button  type=button data-bs-toggle=collapse data-bs-target=#collapse>
 📘 
 </button>
 </h2>
 <div id=collapse class=accordion-collapse collapse  data-bs-parent=#accordionTurmas>
 <div class=accordion-body bg-light>
 
 </div>
 </div>
 </div>
 ;
 });
 } catch (error) {
 console.error(Erro ao carregar turmas:, error);
 accordion.innerHTML =
 '<div class=text-danger p-4 text-center>Erro ao carregar os dados das turmas.</div>';
 }
}

// Função ativada pelo clique do professor para concluir serviço
async function concluirServico(agendamentoId) {
 if (!confirm(O modelo compareceu e o serviço foi realizado com sucesso?)) return;

 try {
 const response = await fetch(
 ${API_URL}/profissional/agendamentos//concluir,
 {
 method: PUT,
 headers: { Authorization: Bearer },
 },
 );

 if (response.ok) {
 carregarMinhasTurmas();
 } else {
 const data = await response.json();
 alert(data.erro || Erro ao concluir agendamento.);
 }
 } catch (error) {
 alert(Erro ao ligar ao servidor.);
 }
}

// Função para cancelar inscrição por falta/desistência
async function cancelarAluno(agendamentoId, nome) {
 if (
 !confirm(
 Deseja remover da pauta? A vaga será reaberta para outro modelo.,
 )
 )
 return;

 try {
 const response = await fetch(
 ${API_URL}/profissional/agendamentos//cancelar,
 {
 method: PUT,
 headers: { Authorization: Bearer },
 },
 );

 if (response.ok) {
 carregarMinhasTurmas();
 } else {
 const data = await response.json();
 alert(data.erro || Erro ao cancelar inscrição.);
 }
 } catch (error) {
 alert(Erro na conexão.);
 }
}

// Inicializar carregamento
document.addEventListener(DOMContentLoaded, () => {
 carregarMinhasTurmas();
});
