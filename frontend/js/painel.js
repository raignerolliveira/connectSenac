// frontend/js/painel.js

const FALLBACK_BASE_URL = http://localhost:3000/api;
const API_URL =
  window.location.protocol === file:
    ? FALLBACK_BASE_URL
    : ${window.location.origin}/api;

const token = localStorage.getItem(token);
if (!token) window.location.href = index.html;

const btnSair = document.getElementById(btnSair);
if (btnSair) {
  btnSair.addEventListener(click, () => {
    localStorage.removeItem(token);
    window.location.href = index.html;
  });
}

// Instâncias dos Modais do Bootstrap
const modalDetalhesCurso = new bootstrap.Modal(
  document.getElementById(modalDetalhesCurso),
);
const modalAgendamento = new bootstrap.Modal(
  document.getElementById(modalAgendamento),
);
const modalFeedback = new bootstrap.Modal(
  document.getElementById(modalFeedback),
);

// ==========================================
// 1. CARREGAR A VITRINE DE CURSOS
// ==========================================
async function carregarCursos() {
  const divCursos = document.getElementById(listaCursos);
  if (!divCursos) return;

  try {
    const response = await fetch(${API_URL}/cursos/ativos, {
      headers: { Authorization: Bearer  },
    });
    const cursos = await response.json();

    divCursos.innerHTML = ";
 if (!Array.isArray(cursos) || cursos.length === 0) {
 divCursos.innerHTML =
 '<div class=col-12><div class=p-4 bg-light rounded-4 text-center text-muted><i class=bi bi-inbox fs-2 d-block mb-2></i>Nenhum serviço ou curso disponível no momento.</div></div>';
 return;
 }

 cursos.forEach((curso) => {
 const profNome = curso.usuarios ? curso.usuarios.nome : Docente Senac;
 const local = curso.localizacao || SENAC Santo Antônio de Jesus;
 const imagem =
 curso.foto_url ||
 https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80;

 const card = 
 <div class=col-md-6 col-lg-4>
 <div class=course-card onclick='abrirModalDetalhesCurso()' style=cursor: pointer;>
 <div class=course-img-wrapper>
 <img src= alt=>
 <div class=course-badge-overlay>
 <i class=bi bi-geo-alt-fill text-warning me-1></i> 
 </div>
 </div>
 <div class=p-4 d-flex flex-column flex-grow-1>
 <div class=d-flex align-items-center gap-2 mb-2 text-muted small fw-semibold>
 <i class=bi bi-person-badge text-primary></i> 
 </div>
 <h5 class=fw-bold font-heading mb-2 text-dark></h5>
 <p class=text-secondary small flex-grow-1 mb-4 style=line-height: 1.5;>...</p>
 <button class=btn btn-soft-primary w-100 py-2 fw-bold mt-auto>
 <i class=bi bi-info-circle me-1></i> Ver Detalhes & Vagas
 </button>
 </div>
 </div>
 </div>
 ;
 divCursos.innerHTML += card;
 });
 } catch (error) {
 divCursos.innerHTML =
 '<div class=col-12><div class=alert alert-danger rounded-3>Erro ao carregar catálogo de cursos.</div></div>';
 }
}

// ==========================================
// 1.5 MODAL DE DETALHES DO CURSO
// ==========================================
function abrirModalDetalhesCurso(curso) {
 document.getElementById(detalheCursoNome).textContent = curso.nome;
 document.getElementById(detalheCursoProf).textContent = curso.usuarios
 ? curso.usuarios.nome
 : Docente Senac;
 document.getElementById(detalheCursoLocal).textContent =
 curso.localizacao || SENAC;
 document.getElementById(detalheCursoDescricao).textContent =
 curso.descricao;

 document.getElementById(detalheCursoImagem).src =
 curso.foto_url ||
 https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80;

 const blocoRestricoes = document.getElementById(blocoRestricoes);
 if (curso.restricoes && curso.restricoes.trim() !== ) {
 blocoRestricoes.style.display = block;
 document.getElementById(detalheCursoRestricoes).textContent =
 curso.restricoes;
 } else {
 blocoRestricoes.style.display = none;
 }

 const btnHorarios = document.getElementById(btnIrParaHorarios);
 btnHorarios.onclick = () => {
 modalDetalhesCurso.hide();
 setTimeout(() => {
 abrirModalAgendamento(curso.id, curso.nome, curso.descricao);
 }, 400);
 };

 const divAvaliacoes = document.getElementById(detalheCursoAvaliacoes);
 divAvaliacoes.innerHTML = '<div class=text-center text-muted small py-3><div class=spinner-border spinner-border-sm text-primary me-2></div>A carregar avaliações...</div>';

 fetch(${API_URL}/feedbacks/curso/, {
 headers: { Authorization: Bearer },
 })
 .then((res) => res.json())
 .then((feedbacks) => {
 if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
 divAvaliacoes.innerHTML =
 '<div class=text-muted small text-center py-3 bg-light rounded-3>Este curso ainda não tem avaliações. Seja o primeiro modelo a avaliar!</div>';
 return;
 }

 const media = (
 feedbacks.reduce((acc, curr) => acc + curr.nota, 0) / feedbacks.length
 ).toFixed(1);

 let html = <div class=d-flex align-items-center gap-2 mb-3><span class=badge bg-warning text-dark fs-6 px-3 py-1>Nota Média: / 5.0</span> <span class=small text-muted>( avaliações)</span></div>;

 feedbacks.forEach((f) => {
 const estrelas = ⭐.repeat(f.nota);
 const dataFormatada = new Date(f.created_at).toLocaleDateString(pt-BR);
 const comentarioTexto = f.comentario
 ? 
 : '<span class=text-muted fst-italic>Sem comentário escrito.</span>';

 html += 
 <div class=bg-light p-3 rounded-3 mb-2 border-start border-warning border-4>
 <div class=d-flex justify-content-between mb-1>
 <strong class=small text-dark></strong>
 <span class=small text-muted></span>
 </div>
 <div class=mb-1></div>
 <div class=small text-secondary></div>
 </div>
 ;
 });
 divAvaliacoes.innerHTML = html;
 })
 .catch(() => {
 divAvaliacoes.innerHTML = '<div class=text-muted small>Não foi possível carregar as avaliações.</div>';
 });

 modalDetalhesCurso.show();
}

// ==========================================
// 2. FLUXO DE AGENDAMENTO (MODAL E HORÁRIOS)
// ==========================================
async function abrirModalAgendamento(cursoId, cursoNome, cursoDescricao) {
 document.getElementById(modalCursoNome).textContent = cursoNome;
 document.getElementById(modalCursoDescricao).textContent = cursoDescricao;
 document.getElementById(msgAgendamento).innerHTML = ;

 const select = document.getElementById(selectHorarios);
 select.innerHTML =
 '<option value= disabled selected>A procurar horários...</option>';

 const btnConfirmar = document.getElementById(btnConfirmarAgendamento);
 btnConfirmar.onclick = () => realizarAgendamento(select.value);

 modalAgendamento.show();

 try {
 const response = await fetch(
 ${API_URL}/disponibilidades/curso/,
 {
 headers: { Authorization: Bearer },
 },
 );
 const horarios = await response.json();

 select.innerHTML =
 '<option value= disabled selected>Escolha um horário...</option>';

 if (!Array.isArray(horarios) || horarios.length === 0) {
 select.innerHTML =
 '<option value= disabled selected>Sem vagas disponíveis de momento.</option>';
 btnConfirmar.disabled = true;
 return;
 }

 btnConfirmar.disabled = false;
 horarios.forEach((h) => {
 const dataFormatada = new Date(h.data_hora).toLocaleString(pt-BR, {
 dateStyle: short,
 timeStyle: short,
 });
 const vagasLivres = h.vagas_totais - h.vagas_ocupadas;
 select.innerHTML += <option value=>📅 ( vagas restantes)</option>;
 });
 } catch (error) {
 select.innerHTML =
 '<option value= disabled selected>Erro ao carregar horários.</option>';
 }
}

async function realizarAgendamento(disponibilidadeId) {
 const msgDiv = document.getElementById(msgAgendamento);
 if (!disponibilidadeId) {
 msgDiv.innerHTML =
 '<span class=text-danger fw-bold>Por favor, selecione um horário disponível.</span>';
 return;
 }

 msgDiv.innerHTML = '<span class=text-primary fw-bold>A confirmar o seu agendamento...</span>';
 try {
 const response = await fetch(${API_URL}/agendamentos, {
 method: POST,
 headers: {
 Content-Type: application/json,
 Authorization: Bearer ,
 },
 body: JSON.stringify({ disponibilidade_id: disponibilidadeId }),
 });

 const data = await response.json();

 if (response.ok) {
 msgDiv.innerHTML = <span class=text-success fw-bold><i class=bi bi-check-circle me-1></i> Agendamento confirmado com sucesso!</span>;
 carregarMeusAgendamentos();
 setTimeout(() => modalAgendamento.hide(), 1500);
 } else {
 msgDiv.innerHTML = <span class=text-danger fw-bold></span>;
 }
 } catch (error) {
 msgDiv.innerHTML = '<span class=text-danger fw-bold>Erro de conexão ao agendar.</span>';
 }
}

// ==========================================
// 3. CARREGAR E CANCELAR OS MEUS AGENDAMENTOS
// ==========================================
async function carregarMeusAgendamentos() {
 const divAgendamentos = document.getElementById(listaMeusAgendamentos);
 if (!divAgendamentos) return;

 try {
 const response = await fetch(${API_URL}/agendamentos/meus, {
 headers: { Authorization: Bearer },
 });
 const agendamentos = await response.json();

 divAgendamentos.innerHTML = ;
 if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
 divAgendamentos.innerHTML =
 '<div class=col-12><div class=p-4 bg-light rounded-4 text-center text-muted><i class=bi bi-calendar-x fs-2 d-block mb-2></i>Você não possui nenhum agendamento ativo no momento.</div></div>';
 return;
 }

 agendamentos.forEach((ag) => {
 const cursoNome = ag.disponibilidades?.cursos?.nome || Curso Prático;
 const dataHora = ag.disponibilidades?.data_hora
 ? new Date(ag.disponibilidades.data_hora).toLocaleString(pt-BR, { dateStyle: short, timeStyle: short })
 : Data a definir;
 
 let badge = ;
 let acoesHTML = ;

 if (ag.status === agendado) {
 badge = '<span class=badge badge-soft-primary px-3 py-2><i class=bi bi-check-circle me-1></i> Confirmado</span>';
 acoesHTML = <button class=btn btn-sm btn-outline-danger w-100 fw-bold py-2 mt-3 onclick=cancelarAgendamento('')><i class=bi bi-x-circle me-1></i> Cancelar Inscrição</button>;
 } else if (ag.status === cancelado) {
 badge = '<span class=badge badge-soft-danger px-3 py-2><i class=bi bi-x-circle me-1></i> Cancelado</span>';
 } else if (ag.status === concluido) {
 badge = '<span class=badge badge-soft-success px-3 py-2><i class=bi bi-patch-check me-1></i> Concluído</span>';
 acoesHTML = <button class=btn btn-sm btn-accent w-100 fw-bold py-2 mt-3 onclick=abrirModalFeedback('')><i class=bi bi-star-fill me-1></i> Avaliar Serviço</button>;
 }

 const card = 
 <div class=col-12 col-md-6 col-xl-4>
 <div class=card-premium p-4 h-100 d-flex flex-column justify-content-between>
 <div>
 <div class=d-flex justify-content-between align-items-center mb-3>
 <h6 class=fw-bold font-heading text-dark mb-0 text-truncate title=></h6>
 
 </div>
 <div class=text-secondary small mb-2>
 <i class=bi bi-calendar-event text-primary me-1></i> Horário: <strong></strong>
 </div>
 </div>
 <div>
 
 <div id=msg-canc- class=small text-center mt-2></div>
 </div>
 </div>
 </div>
 ;
 divAgendamentos.innerHTML += card;
 });
 } catch (error) {
 divAgendamentos.innerHTML =
 '<div class=col-12><div class=alert alert-danger rounded-3>Erro ao carregar histórico de agendamentos.</div></div>';
 }
}

async function cancelarAgendamento(agendamentoId) {
 if (!confirm(Tem certeza que deseja cancelar a sua inscrição neste horário?)) return;

 const msgDiv = document.getElementById(msg-canc-);
 try {
 const response = await fetch(
 ${API_URL}/agendamentos//cancelar,
 {
 method: PUT,
 headers: { Authorization: Bearer },
 },
 );

 const data = await response.json();

 if (response.ok) {
 carregarMeusAgendamentos();
 } else {
 if (msgDiv) msgDiv.innerHTML = <span class=text-danger fw-bold></span>;
 else alert(data.erro);
 }
 } catch (error) {
 if (msgDiv) msgDiv.innerHTML = '<span class=text-danger>Erro ao processar pedido.</span>';
 }
}

// ==========================================
// MÓDULO DE FEEDBACK
// ==========================================
function abrirModalFeedback(agendamentoId) {
 document.getElementById(feedbackAgendamentoId).value = agendamentoId;
 document.getElementById(feedbackNota).value = 5;
 document.getElementById(feedbackComentario).value = ;
 document.getElementById(msgFeedback).innerHTML = ;
 modalFeedback.show();
}

const formFeedback = document.getElementById(formFeedback);
if (formFeedback) {
 formFeedback.addEventListener(submit, async (e) => {
 e.preventDefault();
 const msgDiv = document.getElementById(msgFeedback);
 msgDiv.innerHTML = '<span class=text-primary fw-bold>A enviar avaliação...</span>';

 const payload = {
 agendamento_id: document.getElementById(feedbackAgendamentoId).value,
 nota: parseInt(document.getElementById(feedbackNota).value),
 comentario: document.getElementById(feedbackComentario).value,
 };

 try {
 const response = await fetch(${API_URL}/feedbacks, {
 method: POST,
 headers: {
 Content-Type: application/json,
 Authorization: Bearer ,
 },
 body: JSON.stringify(payload),
 });

 const data = await response.json();

 if (response.ok) {
 msgDiv.innerHTML = <span class=text-success fw-bold><i class=bi bi-check-circle me-1></i> </span>;
 carregarMeusFeedbacks();
 setTimeout(() => {
 modalFeedback.hide();
 }, 1800);
 } else {
 msgDiv.innerHTML = <span class=text-danger fw-bold></span>;
 }
 } catch (error) {
 msgDiv.innerHTML = '<span class=text-danger fw-bold>Erro de conexão ao enviar avaliação.</span>';
 }
 });
}

// ==========================================
// HISTÓRICO PESSOAL DE AVALIAÇÕES
// ==========================================
async function carregarMeusFeedbacks() {
 const divFeedbacks = document.getElementById(listaMeusFeedbacks);
 if (!divFeedbacks) return;

 try {
 const response = await fetch(${API_URL}/feedbacks/meus, {
 headers: { Authorization: Bearer },
 });
 const feedbacks = await response.json();

 divFeedbacks.innerHTML = ;
 if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
 divFeedbacks.innerHTML =
 '<div class=col-12><div class=p-4 bg-light rounded-4 text-center text-muted><i class=bi bi-chat-left-dots fs-2 d-block mb-2></i>Você ainda não realizou nenhuma avaliação de atendimento.</div></div>';
 return;
 }

 feedbacks.forEach((f) => {
 const estrelas = ⭐.repeat(f.nota);
 const dataFormatada = new Date(f.created_at).toLocaleDateString(pt-BR);
 const comentarioTexto = f.comentario
 ? 
 : Apenas nota, sem texto.;

 const card = 
 <div class=col-12 col-md-6 col-lg-4>
 <div class=card-premium p-4 h-100>
 <div class=d-flex justify-content-between align-items-center mb-3>
 <span class=fw-bold font-heading text-dark text-truncate></span>
 <span class=badge badge-soft-secondary></span>
 </div>
 <div class=mb-3 fs-5></div>
 <p class=text-secondary small mb-0 fst-italic bg-light p-3 rounded-3></p>
 </div>
 </div>
 ;
 divFeedbacks.innerHTML += card;
 });
 } catch (error) {
 divFeedbacks.innerHTML =
 '<div class=col-12><div class=alert alert-danger rounded-3>Erro ao carregar histórico de avaliações.</div></div>';
 }
}

// Inicializações
document.addEventListener(DOMContentLoaded, () => {
 carregarCursos();
 carregarMeusAgendamentos();
 carregarMeusFeedbacks();

 if (token) {
 try {
 const payloadToken = JSON.parse(atob(token.split(.)[1]));
 const sidebarNav = document.querySelector(.sidebar-nav);

 if (sidebarNav) {
 if (payloadToken.perfil === admin || payloadToken.perfil === coordenador) {
 sidebarNav.innerHTML += 
 <li class=mt-3 pt-2 border-top border-white border-opacity-10>
 <a class=sidebar-link text-warning fw-bold href=admin.html>
 <i class=bi bi-arrow-left-circle-fill text-warning></i>
 <span>Painel Admin</span>
 </a>
 </li>
 ;
 } else if (payloadToken.perfil === profissional) {
 sidebarNav.innerHTML += 
 <li class=mt-3 pt-2 border-top border-white border-opacity-10>
 <a class=sidebar-link text-warning fw-bold href=profissional.html>
 <i class=bi bi-arrow-left-circle-fill text-warning></i>
 <span>Painel Professor</span>
 </a>
 </li>
 ;
 }
 }
 } catch (e) {}
 }
});
