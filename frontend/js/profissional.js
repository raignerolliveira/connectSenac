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
      accordion.innerHTML =
        '<div class="p-4 bg-light rounded-4 text-center text-muted"><i class="bi bi-inbox fs-2 d-block mb-2"></i>Nenhum curso ativo vinculado ao seu perfil no momento.</div>';
      return;
    }

    cursos.forEach((curso, index) => {
      let horariosHTML = "";

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
            tabelaModelos = '<p class="text-muted small mb-0 p-2.5 bg-light rounded-3 text-center"><i class="bi bi-info-circle me-1"></i>Nenhum modelo agendado para este horário ainda.</p>';
          } else {
            let linhas = agendamentosAtivos
              .map((ag) => {
                let acoesHTML = "";
                if (ag.status === "agendado") {
                  acoesHTML = `
                    <div class="d-flex gap-1 justify-content-end justify-content-md-center">
                      <button class="btn btn-sm btn-outline-success fw-bold px-2 py-1" onclick="concluirServico('${ag.id}')" title="Confirmar Presença" style="font-size: 0.78rem;"><i class="bi bi-check-lg me-1"></i>Presente</button>
                      <button class="btn btn-sm btn-outline-danger fw-bold px-2 py-1" onclick="cancelarAluno('${ag.id}', '${ag.usuarios ? (ag.usuarios.nome || 'Modelo') : 'Modelo'}')" title="Cancelar / Falta" style="font-size: 0.78rem;"><i class="bi bi-x-lg"></i></button>
                    </div>
                  `;
                } else if (ag.status === "concluido") {
                  acoesHTML = '<span class="badge badge-soft-success px-2 py-1" style="font-size: 0.72rem;"><i class="bi bi-patch-check-fill me-1"></i>CONCLUÍDO</span>';
                } else {
                  acoesHTML = `<span class="badge badge-soft-secondary px-2 py-1" style="font-size: 0.72rem;">${(ag.status || '').toUpperCase()}</span>`;
                }

                const nomeUsuario = ag.usuarios ? (ag.usuarios.nome || "Modelo") : "Modelo";
                const emailUsuario = ag.usuarios ? (ag.usuarios.email || "-") : "-";
                const telUsuario = ag.usuarios ? (ag.usuarios.telefone || "") : "";
                const telLimpo = telUsuario ? telUsuario.replace(/\D/g, "") : "";
                const msgProf = encodeURIComponent(`Olá ${nomeUsuario}, aqui é do Senac referente ao seu agendamento.`);

                const whatsappBtn = telLimpo
                  ? `<a href="https://wa.me/55${telLimpo}?text=${msgProf}" target="_blank" class="btn btn-sm btn-outline-success border-0 px-2 py-0 fw-semibold text-nowrap" style="font-size: 0.78rem;" title="Falar no WhatsApp"><i class="bi bi-whatsapp me-1"></i>${telUsuario}</a>`
                  : '<span class="text-muted small">Sem tel</span>';

                return `
                  <tr>
                    <td class="align-middle fw-bold text-dark py-2" style="font-size: 0.84rem;">
                      <div>${nomeUsuario}</div>
                      <div class="text-muted small d-md-none" style="font-size: 0.72rem;">${emailUsuario}</div>
                    </td>
                    <td class="align-middle text-muted small d-none d-md-table-cell py-2" style="font-size: 0.8rem;">${emailUsuario}</td>
                    <td class="align-middle py-2">${whatsappBtn}</td>
                    <td class="align-middle text-end text-md-center py-2">${acoesHTML}</td>
                  </tr>
                `;
              })
              .join("");

            tabelaModelos = `
              <div class="table-responsive">
                <table class="table table-hover table-sm mb-0 align-middle">
                  <thead class="table-light">
                    <tr style="font-size: 0.74rem; text-transform: uppercase;">
                      <th>Modelo</th>
                      <th class="d-none d-md-table-cell">E-mail</th>
                      <th>WhatsApp</th>
                      <th class="text-end text-md-center">Ações</th>
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
                  <i class="bi bi-calendar2-event text-primary"></i>
                  <span>Aula: ${dataFormatada}</span>
                </div>
                <span class="badge badge-soft-primary px-2.5 py-1" style="font-size: 0.74rem;">
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
              <i class="bi bi-journal-text text-primary me-2"></i> ${curso.nome}
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
