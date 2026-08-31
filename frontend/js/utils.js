// frontend/js/utils.js
// ─────────────────────────────────────────────────────────
// Utilitários globais — Connect Senac V2
// ─────────────────────────────────────────────────────────

// 1. Escape XSS
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 2. Toggle da Sidebar (Fix P3 — centralizado, sem duplicação)
function toggleSidebar(forceState) {
    const sidebar = document.getElementById('appSidebar');
    if (!sidebar) return;

    let backdrop = document.getElementById('sidebarBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebarBackdrop';
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', () => toggleSidebar(false));
    }

    const shouldShow = forceState !== undefined
        ? forceState
        : !sidebar.classList.contains('show');

    sidebar.classList.toggle('show', shouldShow);
    backdrop.classList.toggle('show', shouldShow);
    document.body.style.overflow = shouldShow ? 'hidden' : '';
}

function closeSidebar() { toggleSidebar(false); }

// Fechar sidebar ao pressionar Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
});

// Fechar sidebar ao clicar fora (fallback)
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('appSidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (!sidebar || !sidebar.classList.contains('show')) return;
    if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
        closeSidebar();
    }
});

// 3. Marcar link ativo na sidebar
function setSidebarActive(link) {
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    link.classList.add('active');
    if (window.innerWidth < 992) closeSidebar();
}

// 4. Spinner de loading dark (Fix P4)
function createSpinner(size = 'sm') {
    const s = document.createElement('span');
    s.className = 'spinner-dark';
    if (size === 'xs') { s.style.width = '12px'; s.style.height = '12px'; }
    return s;
}

// 5. Mostrar loading em um container
function showLoading(container, msg = 'A carregar...') {
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state" style="padding:2rem;">
            <span class="spinner-dark" style="width:20px;height:20px;margin-bottom:0.75rem;"></span>
            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);letter-spacing:0.04em;text-transform:uppercase;">${escapeHTML(msg)}</span>
        </div>`;
}

// 6. Mostrar empty state
function showEmpty(container, title = 'Nenhum resultado', desc = '', icon = 'bi-inbox') {
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon"><i class="${escapeHTML(icon)}"></i></div>
            <p class="empty-title">${escapeHTML(title)}</p>
            ${desc ? `<p class="empty-desc">${escapeHTML(desc)}</p>` : ''}
        </div>`;
}

// 7. Mostrar erro
function showError(container, msg = 'Erro ao carregar dados.') {
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon" style="background:var(--status-danger-dim);border-color:rgba(239,68,68,0.25);color:var(--status-danger);">
                <i class="bi bi-exclamation-triangle"></i>
            </div>
            <p class="empty-title" style="color:var(--status-danger);">Erro</p>
            <p class="empty-desc">${escapeHTML(msg)}</p>
        </div>`;
}

// 8. Animação de contagem numérica
function animateCounter(element, end) {
    if (!element) return;
    const numericEnd = Number.parseFloat(end);
    if (!Number.isFinite(numericEnd)) {
        element.textContent = end;
        return;
    }
    const suffix = String(end).trim().endsWith('%') ? '%' : '';
    const duration = 900;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.floor(eased * numericEnd)}${suffix}`;
        if (progress < 1) requestAnimationFrame(update);
        else element.textContent = `${numericEnd}${suffix}`;
    }
    requestAnimationFrame(update);
}

// 9. Animação de entrada de cards (sem dependência externa)
function animateCardsIn(selector) {
    const elements = document.querySelectorAll(selector);
    const motion = window.Motion;
    if (motion?.animate && motion?.stagger) {
        motion.animate(
            elements,
            { opacity: [0, 1], y: [12, 0] },
            { delay: motion.stagger(0.06), duration: 0.4, easing: [0.16, 1, 0.3, 1] }
        );
        return;
    }
    elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        el.style.transition = `opacity 350ms ease ${i * 55}ms, transform 350ms cubic-bezier(0.16,1,0.3,1) ${i * 55}ms`;
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    });
}

function animateModalIn(element) {
    if (!element) return;
    const motion = window.Motion;
    if (motion?.animate) {
        motion.animate(element, { opacity: [0, 1], scale: [0.97, 1] },
            { duration: 0.25, easing: [0.16, 1, 0.3, 1] });
    }
}

document.addEventListener('shown.bs.modal', (event) => {
    animateModalIn(event.target.querySelector('.modal-content'));
});

// Exportar para Node.js se necessário
if (typeof window !== 'undefined') {
    window.escapeHTML = escapeHTML;
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;
    window.setSidebarActive = setSidebarActive;
    window.showLoading = showLoading;
    window.showEmpty = showEmpty;
    window.showError = showError;
    window.animateCounter = animateCounter;
    window.animateCardsIn = animateCardsIn;
    window.animateModalIn = animateModalIn;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHTML };
}
