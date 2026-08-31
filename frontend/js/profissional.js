// frontend/js/profissional.js

const FALLBACK_BASE_URL = "http://localhost:3000/api";
const API_URL =
  window.location.protocol === "file:"
    ? FALLBACK_BASE_URL
    : `${window.location.origin}/api`;

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
} else {
  try {
    const payloadToken = JSON.parse(atob(token.split(".")[1]));
    const nomeProfEl = document.getElementById("nomeProf");
    if (nomeProfEl && payloadToken && (payloadToken.nome || payloadToken.email)) {
      nomeProfEl.textContent = payloadToken.nome || payloadToken.email.split("@")[0];
    }
  } catch (e) {
    console.error("Erro ao decodificar token:", e);
  }
}

const btnSair = document.getElementById("btnSair");
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });
}

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

async function carregarMinhasTurmas() {
  const accordion = document.getElementById("accordionTurmas");
  if (!accordion) return;

  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/profissional/minhas-turmas`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return;
    }

    const cursos = await response.json();
    accordion.innerHTML = "";

    if (!Array.isArray(cursos) || cursos.length === 0) {
      showEmpty(accordion, "Nenhuma turma ativa", "Nenhum curso ativo vinculado ao seu perfil docente no momento.", "bi-journal-x");
      return;
    }

    cursos.forEach((curso, index) => {
      let horariosHTML = "";
      const nomeCursoEscapado = escapeHTML(curso.nome);

      if (curso.disponibilidades && curso.disponibilidades.length > 0) {
        curso.disponibilidades.sort(
          (a, b) => new Date(a.data_hora) - new Date(b.data_hora),
        );

        curso.disponibilidades.forEach((disp) => {
          const dataFormatada = new Date(disp.data_hora).toLocaleString(
            "pt-BR",
            { dateStyle: "short", timeStyle: "short" },
          );

          const agendamentosAtivos = (disp.agendamentos || []).filter(
            (a) => a.status !== "cancelado",
          );

          let tabelaModelos = "";
          if (agendamentosAtivos.length === 0) {
            tabelaModelos = '<p style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);text-align:center;padding:0.75rem 0;margin:0;"><i class="bi bi-info-circle" style="margin-right:4px;"></i>Nenhum modelo agendado para este horário ainda.</p>';
          } else {
            let linhas = agendamentosAtivos
              .map((ag) => {
                const nomeUsuario = escapeHTML(ag.usuarios ? (ag.usuarios.nome || "Modelo") : "Modelo");
                const emailUsuario = escapeHTML(ag.usuarios ? (ag.usuarios.email || "-") : "-");
                const telOriginal = ag.usuarios ? (ag.usuarios.telefone || "") : "";
                const telUsuario = escapeHTML(telOriginal);
                const telLimpo = telOriginal ? telOriginal.replace(/\D/g, "") : "";
                const msgProf = encodeURIComponent(`Olá ${ag.usuarios ? ag.usuarios.nome : 'Modelo'}, aqui é do Senac Bahia referente ao seu agendamento.`);
                const nomeParam = nomeUsuario.replace(/'/g, "\\'");

                let acoesHTML = "";
                if (ag.status === "agendado") {
                  acoesHTML = `
                    <div class="presence-actions justify-content-end justify-content-md-center">
                      <button class="btn-presence present" onclick="concluirServico('${ag.id}')" title="Confirmar Presença"><i class="bi bi-check-lg" style="margin-right:3px;"></i>Presente</button>
                      <button class="btn-presence absent" onclick="cancelarAluno('${ag.id}', '${nomeParam}')" title="Cancelar / Falta"><i class="bi bi-x-lg"></i></button>
                    </div>
                  `;
                } else if (ag.status === "concluido") {
                  acoesHTML = '<span class="badge-v2 success"><i class="bi bi-patch-check-fill"></i> CONCLUÍDO</span>';
                } else {
                  acoesHTML = `<span class="badge-v2 neutral">${escapeHTML(ag.status || '').toUpperCase()}</span>`;
                }

                const whatsappBtn = telLimpo
                  ? `<a href="https://wa.me/55${telLimpo}?text=${msgProf}" target="_blank" class="btn-whatsapp" title="Falar no WhatsApp (${telUsuario})"><i class="bi bi-whatsapp"></i></a>`
                  : '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">Sem tel</span>';

                return `
                  <tr>
                    <td>
                      <div>${nomeUsuario}</div>
                      <div class="d-md-none" style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">${emailUsuario}</div>
                    </td>
                    <td class="d-none d-md-table-cell" style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${emailUsuario}</td>
                    <td>${whatsappBtn}</td>
                    <td class="text-end text-md-center">${acoesHTML}</td>
                  </tr>
                `;
              })
              .join("");

            tabelaModelos = `
              <div class="table-responsive">
                <table class="table-dark-compact">
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th class="d-none d-md-table-cell">E-mail</th>
                      <th>WhatsApp</th>
                      <th class="text-end text-md-center">Presença</th>
                    </tr>
                  </thead>
                  <tbody>${linhas}</tbody>
                </table>
              </div>`;
          }

          horariosHTML += `
            <div class="schedule-card">
              <div class="schedule-header">
                <div class="schedule-header-title">
                  <i class="bi bi-calendar2-event" style="color:var(--senac-orange);"></i>
                  <span>Aula: ${dataFormatada}</span>
                </div>
                <span class="badge-v2 blue">
                  Vagas: ${disp.vagas_ocupadas} / ${disp.vagas_totais}
                </span>
              </div>
              ${tabelaModelos}
            </div>
          `;
        });
      }

      const itemOpen = index === 0 ? "show" : "";
      const btnCollapsed = index === 0 ? "" : "collapsed";

      accordion.innerHTML += `
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button ${btnCollapsed}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${curso.id}">
              <i class="bi bi-journal-text text-primary me-2"></i> ${nomeCursoEscapado}
            </button>
          </h2>
          <div id="collapse${curso.id}" class="accordion-collapse collapse ${itemOpen}" data-bs-parent="#accordionTurmas">
            <div class="accordion-body">
              ${horariosHTML || '<p class="text-muted small mb-0 text-center py-2">Sem horários abertos para este curso.</p>'}
            </div>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Erro ao carregar turmas:", error);
    accordion.innerHTML =
      '<div class="alert alert-danger rounded-3 text-center small p-3">Erro ao carregar os dados das turmas.</div>';
  }
}

async function concluirServico(agendamentoId) {
  if (!confirm("O modelo compareceu e o serviço foi realizado com sucesso?")) return;

  try {
    const response = await fetch(
      `${API_URL}/profissional/agendamentos/${agendamentoId}/concluir`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.ok) {
      carregarMinhasTurmas();
    } else {
      const data = await response.json();
      alert(data.erro || "Erro ao concluir agendamento.");
    }
  } catch (error) {
    alert("Erro ao ligar ao servidor.");
  }
}

async function cancelarAluno(agendamentoId, nome) {
  if (
    !confirm(
      `Deseja remover ${nome} da pauta? A vaga será reaberta para outro modelo.`,
    )
  )
    return;

  try {
    const response = await fetch(
      `${API_URL}/profissional/agendamentos/${agendamentoId}/cancelar`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.ok) {
      carregarMinhasTurmas();
    } else {
      const data = await response.json();
      alert(data.erro || "Erro ao cancelar inscrição.");
    }
  } catch (error) {
    alert("Erro na conexão.");
  }
}

window.concluirServico = concluirServico;
window.cancelarAluno = cancelarAluno;

document.addEventListener("DOMContentLoaded", () => {
  if (token) {
    carregarMinhasTurmas();
  }
});
