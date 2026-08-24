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
            tabelaModelos = '<p class="text-muted small mb-0 mt-3 p-3 bg-light rounded-3"><i class="bi bi-info-circle me-1"></i>Nenhum modelo agendado para este horário ainda.</p>';
          } else {
            let linhas = agendamentosAtivos
              .map((ag) => {
                let acoesHTML = "";
                if (ag.status === "agendado") {
                  acoesHTML = `
                    <div class="d-flex gap-1 justify-content-center">
                      <button class="btn btn-sm btn-outline-success fw-bold px-3" onclick="concluirServico('${ag.id}')" title="Confirmar Presença"><i class="bi bi-check-lg me-1"></i>Presente</button>
                      <button class="btn btn-sm btn-outline-danger fw-bold px-2" onclick="cancelarAluno('${ag.id}', '${ag.usuarios ? (ag.usuarios.nome || 'Modelo') : 'Modelo'}')" title="Cancelar / Falta"><i class="bi bi-x-lg"></i></button>
                    </div>
                  `;
                } else if (ag.status === "concluido") {
                  acoesHTML = '<span class="badge badge-soft-success px-3 py-2"><i class="bi bi-patch-check-fill me-1"></i>CONCLUÍDO</span>';
                } else {
                  acoesHTML = `<span class="badge badge-soft-secondary px-3 py-2">${(ag.status || '').toUpperCase()}</span>`;
                }

                const nomeUsuario = ag.usuarios ? (ag.usuarios.nome || "Modelo") : "Modelo";
                const emailUsuario = ag.usuarios ? (ag.usuarios.email || "-") : "-";
                const telUsuario = ag.usuarios ? (ag.usuarios.telefone || "") : "";
                const telLimpo = telUsuario ? telUsuario.replace(/\D/g, "") : "";
                const msgProf = encodeURIComponent(`Olá ${nomeUsuario}, aqui é do Senac referente ao seu agendamento.`);

                const whatsappBtn = telLimpo
                  ? `<a href="https://wa.me/55${telLimpo}?text=${msgProf}" target="_blank" class="btn btn-sm btn-outline-success border-0 px-2 fw-semibold" title="Falar no WhatsApp"><i class="bi bi-whatsapp me-1"></i>${telUsuario}</a>`
                  : '<span class="text-muted small">Sem telefone</span>';

                return `
                  <tr>
                    <td class="align-middle fw-bold text-dark">${nomeUsuario}</td>
                    <td class="align-middle text-muted small">${emailUsuario}</td>
                    <td class="align-middle">${whatsappBtn}</td>
                    <td class="align-middle text-center" style="width: 180px;">${acoesHTML}</td>
                  </tr>
                `;
              })
              .join("");

            tabelaModelos = `
              <div class="table-responsive">
                <table class="table table-hover table-sm mt-3 border align-middle">
                  <thead class="table-light"><tr><th>Modelo</th><th>E-mail</th><th>Contato WhatsApp</th><th class="text-center">Presença / Ações</th></tr></thead>
                  <tbody>${linhas}</tbody>
                </table>
              </div>`;
          }

          horariosHTML += `
            <div class="mb-4 p-4 bg-white border rounded-4 shadow-sm">
              <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                <div class="fw-bold text-dark fs-6"><i class="bi bi-calendar2-event text-primary me-2"></i>Aula Prática: ${dataFormatada}</div>
                <span class="badge badge-soft-primary px-3 py-2">Ocupação: ${disp.vagas_ocupadas} / ${disp.vagas_totais}</span>
              </div>
              ${tabelaModelos}
            </div>
          `;
        });
      }

      const itemOpen = index === 0 ? "show" : "";
      const btnCollapsed = index === 0 ? "" : "collapsed";

      accordion.innerHTML += `
        <div class="accordion-item border rounded-3 mb-3 overflow-hidden shadow-sm">
          <h2 class="accordion-header">
            <button class="accordion-button ${btnCollapsed} fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${curso.id}">
              <i class="bi bi-journal-text text-primary me-2 fs-5"></i> ${curso.nome}
            </button>
          </h2>
          <div id="collapse${curso.id}" class="accordion-collapse collapse ${itemOpen}" data-bs-parent="#accordionTurmas">
            <div class="accordion-body bg-light p-4">
              ${horariosHTML || '<p class="text-muted mb-0">Sem horários abertos para este curso.</p>'}
            </div>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Erro ao carregar turmas:", error);
    accordion.innerHTML =
      '<div class="alert alert-danger rounded-3 text-center">Erro ao carregar os dados das turmas.</div>';
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
