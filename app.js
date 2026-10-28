// ==========================================================================
// Dashboard do Aprendiz - Lógica Principal (Clean & Minimalist Light Theme)
// ==========================================================================

const state = {
  agenda: [],
  referenceDate: new Date(),
  filterStatus: 'all', // 'all' | 'done' | 'pending'
  filterModule: 'all',
  searchQuery: '',
  viewMode: window.innerWidth < 768 ? 'cards' : 'table', // Adaptação responsiva inteligente
  theme: localStorage.getItem('theme') || 'light', // Padrão: Tema Claro
  nextMeeting: null
};

// Elementos da Interface
const elements = {
  themeToggle: document.getElementById('themeToggle'),
  currentDateDisplay: document.getElementById('currentDateDisplay'),
  referenceDateInput: document.getElementById('referenceDateInput'),
  btnResetDate: document.getElementById('btnResetDate'),
  kpiTotal: document.getElementById('kpiTotal'),
  kpiDone: document.getElementById('kpiDone'),
  kpiDoneMeta: document.getElementById('kpiDoneMeta'),
  kpiRemaining: document.getElementById('kpiRemaining'),
  kpiRemainingMeta: document.getElementById('kpiRemainingMeta'),
  kpiPercentage: document.getElementById('kpiPercentage'),
  kpiProgressBar: document.getElementById('kpiProgressBar'),
  nextMeetingCard: document.getElementById('nextMeetingCard'),
  nextWeekday: document.getElementById('nextWeekday'),
  nextDay: document.getElementById('nextDay'),
  nextMonth: document.getElementById('nextMonth'),
  nextModule: document.getElementById('nextModule'),
  nextTitle: document.getElementById('nextTitle'),
  nextTime: document.getElementById('nextTime'),
  nextLocation: document.getElementById('nextLocation'),
  nextCountdown: document.getElementById('nextCountdown'),
  nextRoom: document.getElementById('nextRoom'),
  btnAddToCalendar: document.getElementById('btnAddToCalendar'),
  btnCopyRoom: document.getElementById('btnCopyRoom'),
  modulesGrid: document.getElementById('modulesGrid'),
  searchInput: document.getElementById('searchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  moduleSelect: document.getElementById('moduleSelect'),
  statusTabs: document.querySelectorAll('.seg-btn'),
  countTabAll: document.getElementById('countTabAll'),
  countTabDone: document.getElementById('countTabDone'),
  countTabPending: document.getElementById('countTabPending'),
  viewTableBtn: document.getElementById('viewTableBtn'),
  viewCardsBtn: document.getElementById('viewCardsBtn'),
  resultsCounter: document.getElementById('resultsCounter'),
  meetingsContainer: document.getElementById('meetingsContainer'),
  toast: document.getElementById('toast')
};

// ==========================================================================
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initViewSwitcher();
  setupEventListeners();
  setupDateControls();
  await loadAgendaData();
  renderApp();
});

function initViewSwitcher() {
  if (state.viewMode === 'cards') {
    elements.viewCardsBtn.classList.add('active');
    elements.viewTableBtn.classList.remove('active');
  } else {
    elements.viewTableBtn.classList.add('active');
    elements.viewCardsBtn.classList.remove('active');
  }
}

// ==========================================================================
// Carregamento de Dados (Fetch com Fallback offline)
// ==========================================================================
async function loadAgendaData() {
  try {
    const res = await fetch('agenda.json');
    if (!res.ok) throw new Error('Falha no carregamento do arquivo agenda.json');
    state.agenda = await res.json();
  } catch (err) {
    console.info('Utilizando dados incorporados da agenda do aprendiz.');
    state.agenda = getFallbackAgenda();
  }
}

// ==========================================================================
// Gerenciamento de Tema (Claro por Padrão)
// ==========================================================================
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  elements.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    showToast(`Tema alterado para modo ${state.theme === 'light' ? 'claro' : 'escuro'}`);
  });
}

// ==========================================================================
// Configuração dos Controles de Data
// ==========================================================================
function setupDateControls() {
  const todayStr = state.referenceDate.toISOString().split('T')[0];
  elements.referenceDateInput.value = todayStr;
  updateDateDisplay();

  elements.referenceDateInput.addEventListener('change', (e) => {
    if (e.target.value) {
      const parts = e.target.value.split('-');
      state.referenceDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);
      updateDateDisplay();
      renderApp();
      showToast(`Data simulada: ${state.referenceDate.toLocaleDateString('pt-BR')}`);
    }
  });

  elements.btnResetDate.addEventListener('click', () => {
    state.referenceDate = new Date();
    elements.referenceDateInput.value = state.referenceDate.toISOString().split('T')[0];
    updateDateDisplay();
    renderApp();
    showToast('Data redefinida para hoje.');
  });
}

function updateDateDisplay() {
  const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  elements.currentDateDisplay.textContent = state.referenceDate.toLocaleDateString('pt-BR', options);
}

// ==========================================================================
// Event Listeners dos Filtros e Interações
// ==========================================================================
function setupEventListeners() {
  // Busca em tempo real
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    elements.btnClearSearch.classList.toggle('hidden', state.searchQuery === '');
    renderMeetingsList();
  });

  elements.btnClearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.btnClearSearch.classList.add('hidden');
    renderMeetingsList();
  });

  // Filtro por Módulo
  elements.moduleSelect.addEventListener('change', (e) => {
    state.filterModule = e.target.value;
    renderMeetingsList();
  });

  // Filtro por Status (Segmented Control)
  elements.statusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.statusTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filterStatus = tab.getAttribute('data-status');
      renderMeetingsList();
    });
  });

  // Alternador de Visualização (Tabela x Cards)
  elements.viewTableBtn.addEventListener('click', () => {
    state.viewMode = 'table';
    elements.viewTableBtn.classList.add('active');
    elements.viewCardsBtn.classList.remove('active');
    renderMeetingsList();
  });

  elements.viewCardsBtn.addEventListener('click', () => {
    state.viewMode = 'cards';
    elements.viewCardsBtn.classList.add('active');
    elements.viewTableBtn.classList.remove('active');
    renderMeetingsList();
  });

  // Ações do Spotlight Card
  elements.btnCopyRoom.addEventListener('click', () => {
    if (state.nextMeeting) {
      const copyContent = `${state.nextMeeting.tema}\nLocal: ${state.nextMeeting.sala}`;
      navigator.clipboard.writeText(copyContent).then(() => {
        showToast('Localização copiada com sucesso!');
      });
    }
  });

  elements.btnAddToCalendar.addEventListener('click', () => {
    if (state.nextMeeting) {
      exportToICal(state.nextMeeting);
    }
  });
}

// ==========================================================================
// Renderização Principal
// ==========================================================================
function renderApp() {
  calculateStats();
  renderHeroMeeting();
  renderModulesOverview();
  renderMeetingsList();
}

// ==========================================================================
// Cálculo de Estatísticas
// ==========================================================================
function calculateStats() {
  const refDate = state.referenceDate;
  let doneCount = 0;
  let nextFound = null;

  state.agenda.forEach(item => {
    const itemDate = new Date(item.data + 'T23:59:59');
    const isDone = itemDate <= refDate;
    item.isDone = isDone;

    if (isDone) {
      doneCount++;
    } else if (!nextFound) {
      nextFound = item;
    }
  });

  state.nextMeeting = nextFound;
  const total = state.agenda.length;
  const remaining = total - doneCount;
  const percentage = total > 0 ? ((doneCount / total) * 100).toFixed(1) : '0.0';

  elements.kpiTotal.textContent = total;
  elements.kpiDone.textContent = doneCount;
  elements.kpiDoneMeta.textContent = `${doneCount} de ${total} aulas cumpridas`;
  elements.kpiRemaining.textContent = remaining;
  elements.kpiRemainingMeta.textContent = `${remaining} aulas a realizar`;
  elements.kpiPercentage.textContent = `${percentage}%`;
  elements.kpiProgressBar.style.width = `${percentage}%`;

  elements.countTabAll.textContent = total;
  elements.countTabDone.textContent = doneCount;
  elements.countTabPending.textContent = remaining;
}

// ==========================================================================
// Renderização do Card de Destaque (Spotlight)
// ==========================================================================
function renderHeroMeeting() {
  const next = state.nextMeeting;
  if (!next) {
    elements.nextTitle.textContent = 'Parabéns! Todos os 70 encontros foram concluídos!';
    elements.nextModule.textContent = 'Ciclo de Aprendizagem Concluído';
    elements.nextDateBox.style.display = 'none';
    elements.nextCountdown.textContent = '100% Concluído';
    elements.nextCountdown.className = 'countdown-pill done';
    elements.nextRoom.innerHTML = '<span>Todas as atividades letivas do cronograma foram finalizadas com êxito.</span>';
    elements.btnAddToCalendar.style.display = 'none';
    elements.btnCopyRoom.style.display = 'none';
    return;
  }

  elements.nextDateBox.style.display = 'flex';
  elements.btnAddToCalendar.style.display = 'inline-flex';
  elements.btnCopyRoom.style.display = 'inline-flex';

  const [year, month, day] = next.data.split('-');
  const dt = new Date(year, month - 1, day);
  
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  elements.nextWeekday.textContent = weekdays[dt.getDay()];
  elements.nextDay.textContent = day;
  elements.nextMonth.textContent = months[dt.getMonth()];

  elements.nextModule.textContent = next.modulo;
  elements.nextTitle.textContent = next.tema;
  elements.nextTime.textContent = next.hora;
  elements.nextLocation.textContent = next.local;
  elements.nextRoom.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/>
      <line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
    <span>${next.sala}</span>
  `;

  // Contagem regressiva de dias
  const diffTime = dt.getTime() - state.referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    elements.nextCountdown.textContent = 'É hoje';
    elements.nextCountdown.className = 'countdown-pill done';
  } else if (diffDays === 1) {
    elements.nextCountdown.textContent = 'Amanhã';
    elements.nextCountdown.className = 'countdown-pill';
  } else {
    elements.nextCountdown.textContent = `Em ${diffDays} dias`;
    elements.nextCountdown.className = 'countdown-pill';
  }
}

// ==========================================================================
// Visão Geral de Módulos
// ==========================================================================
function renderModulesOverview() {
  const modulesMap = {};

  state.agenda.forEach(item => {
    if (!modulesMap[item.modulo]) {
      modulesMap[item.modulo] = { total: 0, done: 0 };
    }
    modulesMap[item.modulo].total++;
    if (item.isDone) modulesMap[item.modulo].done++;
  });

  const checkIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const clockIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

  elements.modulesGrid.innerHTML = Object.entries(modulesMap).map(([modName, stats], i) => {
    const pct = ((stats.done / stats.total) * 100).toFixed(0);
    let badgeClass = 'pending';
    let badgeLabel = 'Não Iniciado';
    let icon = '';

    if (stats.done === stats.total) {
      badgeClass = 'done';
      badgeLabel = 'Concluído';
      icon = checkIcon;
    } else if (stats.done > 0) {
      badgeClass = 'progress';
      badgeLabel = 'Em Andamento';
      icon = clockIcon;
    }

    return `
      <div class="clean-module-card">
        <div class="module-card-top">
          <h4 class="clean-module-title">${i + 1}. ${modName}</h4>
          <span class="status-pill ${badgeClass}">${icon} ${badgeLabel}</span>
        </div>
        <div class="module-meta-row">
          <span>${stats.done} de ${stats.total} aulas</span>
          <span class="module-pct-text">${pct}%</span>
        </div>
        <div class="module-track">
          <div class="module-fill ${badgeClass}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Renderização da Tabela ou Grade de Encontros
// ==========================================================================
function renderMeetingsList() {
  const filtered = state.agenda.filter(item => {
    if (state.filterStatus === 'done' && !item.isDone) return false;
    if (state.filterStatus === 'pending' && item.isDone) return false;
    if (state.filterModule !== 'all' && item.modulo !== state.filterModule) return false;

    if (state.searchQuery) {
      const q = state.searchQuery;
      const match = item.tema.toLowerCase().includes(q) ||
                    item.modulo.toLowerCase().includes(q) ||
                    item.sala.toLowerCase().includes(q) ||
                    item.data_formatada.includes(q) ||
                    item.local.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  elements.resultsCounter.textContent = `Exibindo ${filtered.length} de ${state.agenda.length} encontros`;

  if (filtered.length === 0) {
    elements.meetingsContainer.innerHTML = `
      <div style="text-align: center; padding: 48px 24px; color: var(--text-muted);">
        <p style="font-size: 1rem; font-weight: 600;">Nenhum encontro localizado com esses filtros.</p>
        <p style="font-size: 0.825rem; margin-top: 4px;">Tente alterar os termos da busca ou selecionar outro módulo.</p>
      </div>
    `;
    return;
  }

  if (state.viewMode === 'table') {
    renderTableView(filtered);
  } else {
    renderCardsView(filtered);
  }
}

function renderTableView(list) {
  const checkIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const bellIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  const clockIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;

  const rows = list.map(item => {
    const isNext = state.nextMeeting && state.nextMeeting.id === item.id;
    let statusBadge = `<span class="badge-status pending">${clockIcon} Pendente</span>`;
    let rowClass = '';

    if (item.isDone) {
      statusBadge = `<span class="badge-status done">${checkIcon} Concluído</span>`;
      rowClass = 'row-completed';
    } else if (isNext) {
      statusBadge = `<span class="badge-status next">${bellIcon} Próximo</span>`;
      rowClass = 'row-spotlight';
    }

    return `
      <tr class="${rowClass}">
        <td class="table-id">#${item.id}</td>
        <td>${statusBadge}</td>
        <td class="table-date-cell">
          ${item.dia_semana}, ${item.data_formatada}
          <span class="table-time">${item.hora}</span>
        </td>
        <td class="table-theme-title">${item.tema}</td>
        <td class="table-module-badge">${item.modulo}</td>
        <td class="table-place" title="${item.sala}">${item.local}</td>
      </tr>
    `;
  }).join('');

  elements.meetingsContainer.innerHTML = `
    <div class="table-container">
      <table class="clean-table">
        <thead>
          <tr>
            <th width="50">ID</th>
            <th width="120">Status</th>
            <th width="170">Data / Hora</th>
            <th>Tema do Encontro</th>
            <th>Módulo</th>
            <th>Local</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function renderCardsView(list) {
  const checkIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const bellIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  const clockIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;

  const cards = list.map(item => {
    const isNext = state.nextMeeting && state.nextMeeting.id === item.id;
    let statusBadge = `<span class="badge-status pending">${clockIcon} Pendente</span>`;
    let cardClass = '';

    if (item.isDone) {
      statusBadge = `<span class="badge-status done">${checkIcon} Concluído</span>`;
    } else if (isNext) {
      statusBadge = `<span class="badge-status next">${bellIcon} Próximo</span>`;
      cardClass = 'spotlight';
    }

    return `
      <div class="grid-card ${cardClass}">
        <div class="grid-card-top">
          <span class="grid-card-id">AULA #${item.id}</span>
          ${statusBadge}
        </div>
        <h4 class="grid-card-title">${item.tema}</h4>
        <div class="grid-card-details">
          <div class="grid-detail-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${item.dia_semana}, ${item.data_formatada} às ${item.hora}</span>
          </div>
          <div class="grid-detail-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span>${item.modulo}</span>
          </div>
          <div class="grid-detail-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span title="${item.sala}">${item.sala}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  elements.meetingsContainer.innerHTML = `<div class="cards-layout">${cards}</div>`;
}

// ==========================================================================
// Utilitários: Exportar iCalendar (.ics)
// ==========================================================================
function exportToICal(item) {
  const dtParts = item.data.split('-');
  const timeParts = item.hora.split(':');
  
  const startYear = dtParts[0];
  const startMonth = dtParts[1];
  const startDay = dtParts[2];
  const startHour = timeParts[0];
  const startMin = timeParts[1];

  const endHour = String(Number(startHour) + 6).padStart(2, '0');

  const dtStart = `${startYear}${startMonth}${startDay}T${startHour}${startMin}00`;
  const dtEnd = `${startYear}${startMonth}${startDay}T${endHour}${startMin}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aprendizagem//Painel do Aprendiz//PT',
    'BEGIN:VEVENT',
    `SUMMARY:${item.tema}`,
    `DESCRIPTION:Programa de Aprendizagem - Módulo: ${item.modulo}`,
    `LOCATION:${item.sala}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aula-${item.id}-${item.data}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Arquivo .ics baixado para sua agenda.');
}

// ==========================================================================
// Micro Toast Feedback
// ==========================================================================
let toastTimer = null;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3200);
}

// ==========================================================================
// Fallback Completo dos 70 Encontros
// ==========================================================================
function getFallbackAgenda() {
  return [
    {"id": 1, "data": "2026-08-17", "data_formatada": "17/08/2026", "dia_semana": "Seg", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Onboarding Aprendizagem Profissional", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 2, "data": "2026-08-18", "data_formatada": "18/08/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Sinergia em Grupo", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 3, "data": "2026-08-19", "data_formatada": "19/08/2026", "dia_semana": "Qua", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Desenvolvendo Apresentações Profissionais", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 4, "data": "2026-08-20", "data_formatada": "20/08/2026", "dia_semana": "Qui", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Marketing Pessoal", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 5, "data": "2026-08-21", "data_formatada": "21/08/2026", "dia_semana": "Sex", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Software de texto e Inteligência Artificial - Aliados na produtividade", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 6, "data": "2026-08-24", "data_formatada": "24/08/2026", "dia_semana": "Seg", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Hacks do E-mail", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 7, "data": "2026-08-25", "data_formatada": "25/08/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Educação Corporativa de sucesso", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 8, "data": "2026-08-26", "data_formatada": "26/08/2026", "dia_semana": "Qua", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Gerando dados", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 9, "data": "2026-08-27", "data_formatada": "27/08/2026", "dia_semana": "Qui", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Desenvolvimento de carreira I", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 10, "data": "2026-08-28", "data_formatada": "28/08/2026", "dia_semana": "Sex", "hora": "08:00", "modulo": "Integração para o Mundo do Trabalho", "tema": "Planilhas na prática", "sala": "(Unicid-Tatuapé-SP/SP) R. Cesário Galero, nº 448/475 - Sala 10 (P) 20% B", "local": "R. Cesário Galero"},
    {"id": 11, "data": "2026-09-01", "data_formatada": "01/09/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Consequências e prevenções -drogas", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 12, "data": "2026-09-08", "data_formatada": "08/09/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Consequências e prevenções - DST e AIDS", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 13, "data": "2026-09-15", "data_formatada": "15/09/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Qualidade de Vida de um Profissional", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 14, "data": "2026-09-22", "data_formatada": "22/09/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Impostos e Tributos", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 15, "data": "2026-09-29", "data_formatada": "29/09/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Segurança", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 16, "data": "2026-10-06", "data_formatada": "06/10/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Direitos Humanos e Garantias Constitucionais", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 17, "data": "2026-10-13", "data_formatada": "13/10/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Legislação Trabalhista e Previdenciária", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 18, "data": "2026-10-20", "data_formatada": "20/10/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "O poder e a lei da aprendizagem", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 19, "data": "2026-10-27", "data_formatada": "27/10/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Conceitos - empreendedorismo", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 20, "data": "2026-11-03", "data_formatada": "03/11/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Conceitos e Identificar o Perfil do empreendedor", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 21, "data": "2026-11-10", "data_formatada": "10/11/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Padrão de Consumo, economia doméstica e Poupança", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 22, "data": "2026-11-17", "data_formatada": "17/11/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Os Meios de Comunicação Dentro de uma Organização", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 23, "data": "2026-11-24", "data_formatada": "24/11/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "A Questão Gestual", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 24, "data": "2026-12-01", "data_formatada": "01/12/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "A Comunicação Formal na Empresa", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 25, "data": "2026-12-08", "data_formatada": "08/12/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "A Comunicação Informal e sua Influência no Dia a Dia", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 26, "data": "2026-12-15", "data_formatada": "15/12/2026", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "A Utilização da Comunicação Escrita no Cotidiano Pessoal e Profissional", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 27, "data": "2027-01-05", "data_formatada": "05/01/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Maneira Adequada da Comunicação Escrita em Diferentes Situações e Erros Mais Comuns", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 28, "data": "2027-01-12", "data_formatada": "12/01/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "As quatro operações fundamentais da Matemática", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 29, "data": "2027-01-19", "data_formatada": "19/01/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "A necessidade de utilizar o conhecimento das operações básicas da matemática no cotidiano", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 30, "data": "2027-01-26", "data_formatada": "26/01/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "As quatro operações com numeros decimais", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 31, "data": "2027-02-02", "data_formatada": "02/02/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "A necessidade de utilizar o conhecimento das operações decimais da matemática no cotidiano", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 32, "data": "2027-02-16", "data_formatada": "16/02/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Razão e Proporção - mercado de trabalho", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 33, "data": "2027-02-23", "data_formatada": "23/02/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Razão e Proporção - aspecto pessoal e profissional", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 34, "data": "2027-03-02", "data_formatada": "02/03/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Porcentagem - mercado de trabalho", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 35, "data": "2027-03-09", "data_formatada": "09/03/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Porcentagem - aspecto pessoal e profissional", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 36, "data": "2027-03-16", "data_formatada": "16/03/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Calculos estatísticos - Conceitos, aplicação para prova, concurso e vestibulares", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 37, "data": "2027-03-23", "data_formatada": "23/03/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Calculos estatísticos - Noções e cálculos: ponderada e mediana, moda, média aritmética", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 38, "data": "2027-03-30", "data_formatada": "30/03/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Convivência com a diversidade - Aspectos éticos", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 39, "data": "2027-04-06", "data_formatada": "06/04/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Diversidade e Aspectos Culturais", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 40, "data": "2027-04-13", "data_formatada": "13/04/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Prevenção e Equilíbrio do Meio Ambiente - Importância", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 41, "data": "2027-04-20", "data_formatada": "20/04/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Prevenção e Equilíbrio do Meio Ambiente - Reciclagem", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 42, "data": "2027-04-27", "data_formatada": "27/04/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Organograma", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 43, "data": "2027-05-04", "data_formatada": "04/05/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Fluxograma", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 44, "data": "2027-05-11", "data_formatada": "11/05/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Atendimento de excelência", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 45, "data": "2027-05-18", "data_formatada": "18/05/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Experiência do cliente (Customer experience)", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 46, "data": "2027-05-25", "data_formatada": "25/05/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Negociação e Persuasão", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 47, "data": "2027-06-01", "data_formatada": "01/06/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Desenvolvimento de carreira II", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 48, "data": "2027-06-08", "data_formatada": "08/06/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Qualidade de Vida - Foco Profissional", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 49, "data": "2027-06-15", "data_formatada": "15/06/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Gestão de Projetos", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 50, "data": "2027-06-22", "data_formatada": "22/06/2027", "dia_semana": "Ter", "hora": "08:00", "modulo": "Intermediário 6h - 3.872/23 Novo", "tema": "Gravidez - Riscos e Precauções", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 09 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 51, "data": "2027-06-23", "data_formatada": "23/06/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Responsabilidade Social das Organizações", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 52, "data": "2027-06-30", "data_formatada": "30/06/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Teorias Administrativas", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 53, "data": "2027-07-07", "data_formatada": "07/07/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Administração de Recursos Humanos I - O que é?; Seleção de talentos.", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 54, "data": "2027-07-14", "data_formatada": "14/07/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Administração de Recursos Humanos II - Treinamento e desenvolvimento, feedback.", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 55, "data": "2027-07-21", "data_formatada": "21/07/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Gestão de Documentos", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 56, "data": "2027-07-28", "data_formatada": "28/07/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Ética em Negócios", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 57, "data": "2027-08-04", "data_formatada": "04/08/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Processos Decisórios", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 58, "data": "2027-08-11", "data_formatada": "11/08/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Tecnologias da Informação", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 59, "data": "2027-08-18", "data_formatada": "18/08/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Matemática financeira I - Juros Simples", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 60, "data": "2027-08-25", "data_formatada": "25/08/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Matemática financeira II - Juros Compostos", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 61, "data": "2027-09-01", "data_formatada": "01/09/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Planejamento Estratégico - Análise SWOT", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 62, "data": "2027-09-08", "data_formatada": "08/09/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Plano de Negócios - CANVA", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 63, "data": "2027-09-15", "data_formatada": "15/09/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Logística e Gestão de Estoque", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 64, "data": "2027-09-22", "data_formatada": "22/09/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Terceirização e Prestadores de serviços", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 65, "data": "2027-09-29", "data_formatada": "29/09/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Profissional Administrativo 6h - 3.872/23 Novo", "tema": "Governança Corporativa", "sala": "(Anhanguera Shopping Metrô Itaquera-SP/SP) Av. José Pinheiro Borges, S/N - Sala 06 (P) 20% B", "local": "Av. José Pinheiro Borges"},
    {"id": 66, "data": "2027-10-06", "data_formatada": "06/10/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Projeto de Carreira", "tema": "Projeto de Carreira 2", "sala": "Projeto de Carreira - (6h) 20% B", "local": "Rua Conselheiro Crispiniano"},
    {"id": 67, "data": "2027-10-13", "data_formatada": "13/10/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Projeto de Carreira", "tema": "Projeto de Carreira 3", "sala": "Projeto de Carreira - (6h) 20% B", "local": "Rua Conselheiro Crispiniano"},
    {"id": 68, "data": "2027-10-20", "data_formatada": "20/10/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Projeto de Carreira", "tema": "Projeto de Carreira 4", "sala": "Projeto de Carreira - (6h) 20% B", "local": "Rua Conselheiro Crispiniano"},
    {"id": 69, "data": "2027-10-27", "data_formatada": "27/10/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Projeto de Carreira", "tema": "Projeto de Carreira 5", "sala": "Projeto de Carreira - (6h) 20% B", "local": "Rua Conselheiro Crispiniano"},
    {"id": 70, "data": "2027-11-03", "data_formatada": "03/11/2027", "dia_semana": "Qua", "hora": "08:00", "modulo": "Projeto de Carreira", "tema": "Projeto de Carreira - Conclusão", "sala": "Projeto de Carreira - (6h) 20% B", "local": "Rua Conselheiro Crispiniano"}
  ];
}
