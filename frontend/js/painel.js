// frontend/js/painel.js

const FALLBACK_BASE_URL = "http://localhost:3000/api";
const API_URL =
  window.location.protocol === "file:"
    ? FALLBACK_BASE_URL
    : `${window.location.origin}/api`;

const token = localStorage.getItem("token");
let payloadToken = null;

if (!token) {
  window.location.href = "index.html";
} else {
  try {
    payloadToken = JSON.parse(atob(token.split(".")[1]));
    const userNameDisplay = document.getElementById("userNameDisplay");
    if (userNameDisplay && payloadToken.nome) {
      userNameDisplay.textContent = payloadToken.nome;
    }
    // Se for admin ou coordenador acessando a visão do modelo, adiciona botão de voltar ao Admin
    if (payloadToken.perfil === "admin" || payloadToken.perfil === "coordenador") {
      const topbarRight = document.querySelector(".topbar-right");
      if (topbarRight && !document.getElementById("btnVoltarAdmin")) {
        const linkAdmin = document.createElement("a");
        linkAdmin.id = "btnVoltarAdmin";
        linkAdmin.href = "admin.html";
        linkAdmin.className = "btn-ghost-dark btn-xs text-decoration-none me-2";
        linkAdmin.style.cssText = "display:inline-flex;align-items:center;gap:0.35rem;padding:0.3rem 0.65rem;border-radius:var(--radius-sm);font-size:var(--text-xs);font-family:var(--font-mono);font-weight:500;color:var(--text-secondary);";
        linkAdmin.innerHTML = '<i class="bi bi-shield-lock text-danger"></i> <span>Voltar ao Admin</span>';
        topbarRight.prepend(linkAdmin);
      }
    }
  } catch (e) {
    console.error("Erro ao decodificar token no painel:", e);
  }
}

const btnSair = document.getElementById("btnSair");
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });
}

// Instâncias dos Modais do Bootstrap
const modalDetalhesCursoEl = document.getElementById("modalDetalhesCurso");
const modalDetalhesCurso = modalDetalhesCursoEl ? new bootstrap.Modal(modalDetalhesCursoEl) : null;

const modalAgendamentoEl = document.getElementById("modalAgendamento");
const modalAgendamento = modalAgendamentoEl ? new bootstrap.Modal(modalAgendamentoEl) : null;

const modalFeedbackEl = document.getElementById("modalFeedback");
const modalFeedback = modalFeedbackEl ? new bootstrap.Modal(modalFeedbackEl) : null;

// Função auxiliar de escape contra XSS
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// 1. CARREGAR A VITRINE DE CURSOS
// ==========================================
async function carregarCursos() {
  const divCursos = document.getElementById("listaCursos");
  if (!divCursos) return;

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/cursos/ativos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cursos = await response.json();
    divCursos.innerHTML = "";
    if (!Array.isArray(cursos) || cursos.length === 0) {
      divCursos.innerHTML = `<div class="col-12"><div class="empty-state">
        <div class="empty-icon"><i class="bi bi-inbox"></i></div>
        <p class="empty-title">Nenhum curso disponível</p>
        <p class="empty-desc">Nenhum serviço está aberto para inscrição no momento.</p>
      </div></div>`;
      return;
    }

    cursos.forEach((curso) => {
      const profNome = escapeHTML(curso.usuarios ? curso.usuarios.nome : "Docente Senac");
      const local = curso.localizacao || "SENAC Santo Antônio de Jesus";
      const localCurto = escapeHTML(local.split(",")[0]);
      const imagem =
        curso.foto_url ||
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

      const cursoParam = JSON.stringify(curso).replace(/'/g, "&#39;");
      const nomeCursoEscapado = escapeHTML(curso.nome);
      const descCursoEscapada = escapeHTML((curso.descricao || "").substring(0, 90));

      const card = `
        <div class="col-md-6 col-lg-4">
            <div class="course-card-v2" onclick='abrirModalDetalhesCurso(${cursoParam})' style="cursor:pointer;">
                <div class="course-card-img">
                    <img src="${imagem}" alt="${nomeCursoEscapado}" loading="lazy">
                    <span class="course-category-badge"><i class="bi bi-geo-alt" style="margin-right:3px;"></i>${localCurto}</span>
                </div>
                <div class="course-card-body">
                    <h3 class="course-name">${nomeCursoEscapado}</h3>
                    <p class="course-prof"><i class="bi bi-person-badge" style="margin-right:3px;"></i>${profNome}</p>
                    <p style="font-size:var(--text-xs);color:var(--text-muted);line-height:1.45;margin:0;">${descCursoEscapada}...</p>
                </div>
                <div class="course-card-footer">
                    <span class="course-slot-counter">Ver horários</span>
                    <button class="btn-course-action">Detalhes</button>
                </div>
            </div>
        </div>
      `;
      divCursos.innerHTML += card;
    });
    animateCardsIn("#listaCursos .course-card-v2");
  } catch (error) {
    showError(divCursos, "Erro ao carregar catálogo de cursos.");
  }
}

// ==========================================
// 1.5 MODAL DE DETALHES DO CURSO
// ==========================================
function abrirModalDetalhesCurso(curso) {
  document.getElementById("detalheCursoNome").textContent = curso.nome;
  document.getElementById("detalheCursoProf").textContent = curso.usuarios
    ? curso.usuarios.nome
    : "Docente Senac";
  document.getElementById("detalheCursoLocal").textContent =
    curso.localizacao || "SENAC";
  document.getElementById("detalheCursoDescricao").textContent =
    curso.descricao || "";

  document.getElementById("detalheCursoImagem").src =
    curso.foto_url ||
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

  const blocoRestricoes = document.getElementById("blocoRestricoes");
  if (curso.restricoes && curso.restricoes.trim() !== "") {
    blocoRestricoes.style.display = "block";
    document.getElementById("detalheCursoRestricoes").textContent =
      curso.restricoes;
  } else {
    blocoRestricoes.style.display = "none";
  }

  const btnHorarios = document.getElementById("btnIrParaHorarios");
  btnHorarios.onclick = () => {
    if (modalDetalhesCurso) modalDetalhesCurso.hide();
    setTimeout(() => {
      abrirModalAgendamento(curso.id, curso.nome, curso.descricao);
    }, 400);
  };

  const divAvaliacoes = document.getElementById("detalheCursoAvaliacoes");
  divAvaliacoes.innerHTML = '<div class="text-center text-muted small py-3"><div class="spinner-border spinner-border-sm text-primary me-2"></div>A carregar avaliações...</div>';

  fetch(`${API_URL}/feedbacks/curso/${curso.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((feedbacks) => {
      if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
        divAvaliacoes.innerHTML =
          '<div class="text-muted small text-center py-3 bg-light rounded-3">Este curso ainda não tem avaliações. Seja o primeiro modelo a avaliar!</div>';
        return;
      }

      const media = (
        feedbacks.reduce((acc, curr) => acc + curr.nota, 0) / feedbacks.length
      ).toFixed(1);

      let html = `<div class="d-flex align-items-center gap-2 mb-3"><span class="badge bg-warning text-dark fs-6 px-3 py-1">Nota Média: ${media} / 5.0</span> <span class="small text-muted">(${feedbacks.length} avaliações)</span></div>`;

      feedbacks.forEach((f) => {
        const estrelas = "⭐".repeat(f.nota || 5);
        const dataFormatada = new Date(f.created_at).toLocaleDateString("pt-BR");
        const nomeAvaliador = escapeHTML(f.avaliador_nome || "Modelo");
        const comentarioTexto = f.comentario
          ? `"${escapeHTML(f.comentario)}"`
          : '<span class="text-muted fst-italic">Sem comentário escrito.</span>';

        html += `
            <div class="bg-light p-3 rounded-3 mb-2 border-start border-warning border-4">
                <div class="d-flex justify-content-between mb-1">
                    <strong class="small text-dark">${nomeAvaliador}</strong>
                    <span class="small text-muted">${dataFormatada}</span>
                </div>
                <div class="mb-1">${estrelas}</div>
                <div class="small text-secondary">${comentarioTexto}</div>
            </div>
        `;
      });
      divAvaliacoes.innerHTML = html;
    })
    .catch(() => {
      divAvaliacoes.innerHTML = '<div class="text-muted small">Não foi possível carregar as avaliações.</div>';
    });

  if (modalDetalhesCurso) modalDetalhesCurso.show();
}

// ==========================================
// 2. FLUXO DE AGENDAMENTO (MODAL E HORÁRIOS)
// ==========================================
async function abrirModalAgendamento(cursoId, cursoNome, cursoDescricao) {
  document.getElementById("modalCursoNome").textContent = cursoNome;
  document.getElementById("modalCursoDescricao").textContent = cursoDescricao || "";
  document.getElementById("msgAgendamento").innerHTML = "";

  const select = document.getElementById("selectHorarios");
  select.innerHTML =
    '<option value="" disabled selected>A procurar horários...</option>';

  const btnConfirmar = document.getElementById("btnConfirmarAgendamento");
  btnConfirmar.onclick = () => realizarAgendamento(select.value);

  if (modalAgendamento) modalAgendamento.show();

  try {
    const response = await fetch(
      `${API_URL}/disponibilidades/curso/${cursoId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const horarios = await response.json();

    select.innerHTML =
      '<option value="" disabled selected>Escolha um horário...</option>';

    if (!Array.isArray(horarios) || horarios.length === 0) {
      select.innerHTML =
        '<option value="" disabled selected>Sem vagas disponíveis de momento.</option>';
      btnConfirmar.disabled = true;
      return;
    }

    btnConfirmar.disabled = false;
    horarios.forEach((h) => {
      const dataFormatada = new Date(h.data_hora).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const vagasLivres = h.vagas_totais - h.vagas_ocupadas;
      select.innerHTML += `<option value="${h.id}">📅 ${dataFormatada} (${vagasLivres} vagas restantes)</option>`;
    });
  } catch (error) {
    select.innerHTML =
      '<option value="" disabled selected>Erro ao carregar horários.</option>';
  }
}

async function realizarAgendamento(disponibilidadeId) {
  const msgDiv = document.getElementById("msgAgendamento");
  if (!disponibilidadeId) {
    msgDiv.innerHTML =
      '<span class="text-danger fw-bold">Por favor, selecione um horário disponível.</span>';
    return;
  }

  msgDiv.innerHTML = '<span class="text-primary fw-bold">A confirmar o seu agendamento...</span>';
  try {
    const response = await fetch(`${API_URL}/agendamentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ disponibilidade_id: disponibilidadeId }),
    });

    const data = await response.json();

    if (response.ok) {
      msgDiv.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle me-1"></i> Agendamento confirmado com sucesso!</span>`;
      carregarMeusAgendamentos();
      setTimeout(() => {
        if (modalAgendamento) modalAgendamento.hide();
      }, 1500);
    } else {
      msgDiv.innerHTML = `<span class="text-danger fw-bold">${data.erro}</span>`;
    }
  } catch (error) {
    msgDiv.innerHTML = '<span class="text-danger fw-bold">Erro de conexão ao agendar.</span>';
  }
}

// ==========================================
// 3. CARREGAR E CANCELAR OS MEUS AGENDAMENTOS
// ==========================================
async function carregarMeusAgendamentos() {
  const divAgendamentos = document.getElementById("listaMeusAgendamentos");
  if (!divAgendamentos) return;

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/agendamentos/meus`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const agendamentos = await response.json();

    divAgendamentos.innerHTML = "";
    if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
      divAgendamentos.innerHTML = `<div class="col-12"><div class="empty-state">
        <div class="empty-icon"><i class="bi bi-calendar-x"></i></div>
        <p class="empty-title">Nenhum agendamento ativo</p>
        <p class="empty-desc">Explore a vitrine de cursos e agende sua primeira sessão.</p>
      </div></div>`;
      return;
    }

    agendamentos.forEach((ag) => {
      const cursoNome = escapeHTML(ag.disponibilidades?.cursos?.nome || "Curso Prático");
      const dataHora = ag.disponibilidades?.data_hora
        ? new Date(ag.disponibilidades.data_hora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
        : "Data a definir";
      
      let badge = "";
      let acoesHTML = "";

      if (ag.status === "agendado") {
        badge = '<span class="badge-v2 success"><span class="status-dot"></span>Confirmado</span>';
        acoesHTML = `<button class="btn-ghost-light btn-sm w-100" style="margin-top:0.5rem;color:var(--status-danger);border-color:var(--status-danger-border);" onclick="cancelarAgendamento('${ag.id}')"><i class="bi bi-x-circle" style="margin-right:4px;"></i>Cancelar Inscrição</button>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-align:center;margin-top:4px;">Cancelamentos permitidos com até 2h de antecedência</div>`;
      } else if (ag.status === "cancelado") {
        badge = '<span class="badge-v2 danger"><i class="bi bi-x-circle"></i> Cancelado</span>';
      } else if (ag.status === "concluido") {
        badge = '<span class="badge-v2 orange"><i class="bi bi-patch-check"></i> Concluído</span>';
        acoesHTML = `<button class="btn-brand btn-sm w-100" style="margin-top:0.5rem;" onclick="abrirModalFeedback('${ag.id}')"><i class="bi bi-star-fill"></i> Avaliar Serviço</button>`;
      }

      const card = `
        <div class="col-12 col-md-6 col-xl-4">
            <div class="card-premium" style="padding:1rem;height:100%;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;margin-bottom:0.5rem;">
                        <h6 style="font-family:var(--font-brand);font-size:var(--text-base);font-weight:600;color:var(--text-primary);margin:0;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;" title="${cursoNome}">${cursoNome}</h6>
                        ${badge}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--text-secondary);">
                        <i class="bi bi-calendar2-event" style="margin-right:4px;color:var(--senac-blue-deep);"></i>${dataHora}
                    </div>
                </div>
                <div>
                    ${acoesHTML}
                    <div id="msg-canc-${ag.id}" style="font-family:var(--font-mono);font-size:11px;text-align:center;margin-top:4px;"></div>
                </div>
            </div>
        </div>
      `;
      divAgendamentos.innerHTML += card;
    });
  } catch (error) {
    divAgendamentos.innerHTML =
      '<div class="col-12"><div class="alert alert-danger rounded-3 p-3 text-center small">Erro ao carregar histórico de agendamentos.</div></div>';
  }
}

async function cancelarAgendamento(agendamentoId) {
  if (!confirm("Tem certeza que deseja cancelar a sua inscrição neste horário?")) return;

  const msgDiv = document.getElementById(`msg-canc-${agendamentoId}`);
  try {
    const response = await fetch(
      `${API_URL}/agendamentos/${agendamentoId}/cancelar`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await response.json();

    if (response.ok) {
      carregarMeusAgendamentos();
    } else {
      if (msgDiv) msgDiv.innerHTML = `<span class="text-danger fw-bold">${data.erro}</span>`;
      else alert(data.erro);
    }
  } catch (error) {
    if (msgDiv) msgDiv.innerHTML = '<span class="text-danger">Erro ao processar pedido.</span>';
  }
}

// ==========================================
// MÓDULO DE FEEDBACK
// ==========================================
function abrirModalFeedback(agendamentoId) {
  document.getElementById("feedbackAgendamentoId").value = agendamentoId;
  document.getElementById("feedbackNota").value = "5";
  document.getElementById("feedbackComentario").value = "";
  document.getElementById("msgFeedback").innerHTML = "";
  if (modalFeedback) modalFeedback.show();
}

const formFeedback = document.getElementById("formFeedback");
if (formFeedback) {
  formFeedback.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById("msgFeedback");
    msgDiv.innerHTML = '<span class="text-primary fw-bold">A enviar avaliação...</span>';

    const payload = {
      agendamento_id: document.getElementById("feedbackAgendamentoId").value,
      nota: parseInt(document.getElementById("feedbackNota").value),
      comentario: document.getElementById("feedbackComentario").value,
    };

    try {
      const response = await fetch(`${API_URL}/feedbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        msgDiv.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle me-1"></i> ${data.mensagem}</span>`;
        carregarMeusFeedbacks();
        setTimeout(() => {
          if (modalFeedback) modalFeedback.hide();
        }, 1800);
      } else {
        msgDiv.innerHTML = `<span class="text-danger fw-bold">${data.erro}</span>`;
      }
    } catch (error) {
      msgDiv.innerHTML = '<span class="text-danger fw-bold">Erro de conexão ao enviar avaliação.</span>';
    }
  });
}

// ==========================================
// HISTÓRICO PESSOAL DE AVALIAÇÕES
// ==========================================
async function carregarMeusFeedbacks() {
  const divFeedbacks = document.getElementById("listaMeusFeedbacks");
  if (!divFeedbacks) return;

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/feedbacks/meus`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const feedbacks = await response.json();

    divFeedbacks.innerHTML = "";
    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      divFeedbacks.innerHTML =
        '<div class="col-12"><div class="p-3 bg-light rounded-3 text-center text-muted small"><i class="bi bi-chat-left-dots fs-3 d-block mb-1"></i>Você ainda não realizou nenhuma avaliação de atendimento.</div></div>';
      return;
    }

    feedbacks.forEach((f) => {
      const estrelas = "⭐".repeat(f.nota || 5);
      const dataFormatada = new Date(f.created_at).toLocaleDateString("pt-BR");
      const cursoNome = escapeHTML(f.curso_nome || "Curso");
      const comentarioTexto = f.comentario
        ? `"${escapeHTML(f.comentario)}"`
        : "Apenas nota, sem texto.";

      const card = `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card-premium p-3 h-100">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold font-heading text-dark text-truncate" style="font-size: 0.9rem;">${cursoNome}</span>
                    <span class="badge badge-soft-secondary" style="font-size: 0.7rem;">${dataFormatada}</span>
                </div>
                <div class="mb-2" style="font-size: 0.88rem;">${estrelas}</div>
                <p class="text-secondary small mb-0 fst-italic bg-light p-2.5 rounded-3" style="font-size: 0.8rem;">${comentarioTexto}</p>
            </div>
        </div>
      `;
      divFeedbacks.innerHTML += card;
    });
  } catch (error) {
    divFeedbacks.innerHTML =
      '<div class="col-12"><div class="alert alert-danger rounded-3 p-3 text-center small">Erro ao carregar histórico de avaliações.</div></div>';
  }
}

// Expor funções no escopo global para acionamento via HTML onclick
window.abrirModalDetalhesCurso = abrirModalDetalhesCurso;
window.abrirModalAgendamento = abrirModalAgendamento;
window.realizarAgendamento = realizarAgendamento;
window.cancelarAgendamento = cancelarAgendamento;
window.abrirModalFeedback = abrirModalFeedback;

// Inicializações
document.addEventListener("DOMContentLoaded", () => {
  if (token) {
    carregarCursos();
    carregarMeusAgendamentos();
    carregarMeusFeedbacks();
  }
});
