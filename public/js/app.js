// Orquestador Principal de LexChile Intelligence — Archivo Judicial Split-View
const App = (() => {

  const state = {
    currentTab: 'fallos',
    query: '',
    filters: {},
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
    loading: false,
    activeDocId: null,
    activeDocType: null,
    activeDocData: null,
    citationStyle: 'forense',
    readingFontSize: 0.98
  };

  // Inicialización
  async function init() {
    setupEventListeners();
    await loadGlobalStats();
    await switchTab('fallos');
  }

  // Carga de Estadísticas Globales
  async function loadGlobalStats() {
    try {
      const res = await API.getStats();
      if (res && res.stats) {
        const total = res.stats.totalRegistros || 505561;
        const totalElem = document.getElementById('totalCorpusCounter');
        if (totalElem) {
          totalElem.textContent = total.toLocaleString('es-CL');
        }

        // Actualizar badges en pestañas
        updateBadge('tabBadgeFallos', res.stats.jurisprudenciaPjud);
        updateBadge('tabBadgeCausas', res.stats.causasPjud);
        updateBadge('tabBadgeEspeciales', res.stats.tribunalesEspeciales);
        updateBadge('tabBadgeLeyes', res.stats.legislacionBcn);
        updateBadge('tabBadgeDoctrinaAdmin', res.stats.doctrinaAdministrativa);
        updateBadge('tabBadgeDoctrinaJuridica', res.stats.doctrinaJuridica);
        updateBadge('tabBadgeFormatos', res.stats.formatosForenses);
      }
    } catch (err) {
      console.warn('No se pudieron cargar stats inmediatas:', err);
    }
  }

  function updateBadge(id, num) {
    const el = document.getElementById(id);
    if (el && num) {
      el.textContent = parseInt(num, 10).toLocaleString('es-CL');
    }
  }

  // Cambio de Pestaña / Módulo
  async function switchTab(tabName) {
    state.currentTab = tabName;
    state.page = 1;
    state.filters = {};

    // Actualizar botones de navegación
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Reconfigurar barra lateral de filtros según el módulo
    renderSidebarFilters(tabName);

    // Cargar datos del módulo activo
    await executeSearch();
  }

  // Renderizar Filtros Laterales Específicos por Tab
  function renderSidebarFilters(tab) {
    const container = document.getElementById('filtersContainer');
    if (!container) return;

    let html = '';

    if (tab === 'fallos') {
      html = `
        <div class="filter-group">
          <label class="filter-label" for="filterCorte">Corte / Tribunal</label>
          <select id="filterCorte" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todas las Cortes</option>
            <option value="Corte Suprema">Corte Suprema</option>
            <option value="C.A. de Santiago">C.A. de Santiago</option>
            <option value="C.A. de San Miguel">C.A. de San Miguel</option>
            <option value="C.A. de Valparaíso">C.A. de Valparaíso</option>
            <option value="C.A. de Concepción">C.A. de Concepción</option>
            <option value="C.A. de Temuco">C.A. de Temuco</option>
            <option value="C.A. de La Serena">C.A. de La Serena</option>
            <option value="C.A. de Antofagasta">C.A. de Antofagasta</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterSala">Sala</label>
          <select id="filterSala" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todas las Salas</option>
            <option value="1ª Sala">Primera Sala (Civil)</option>
            <option value="2ª Sala">Segunda Sala (Penal)</option>
            <option value="3ª Sala">Tercera Sala (Constitucional/Adm)</option>
            <option value="4ª Sala">Cuarta Sala (Laboral)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterRecurso">Tipo de Recurso</label>
          <select id="filterRecurso" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todos los Recursos</option>
            <option value="Casación Fondo">Casación en el Fondo</option>
            <option value="Casación Forma">Casación en la Forma</option>
            <option value="Apelación">Apelación</option>
            <option value="Protección">Protección</option>
            <option value="Amparo">Amparo / Hábeas Corpus</option>
            <option value="Nulidad">Recurso de Nulidad</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterMateria">Materia Jurídica</label>
          <input type="text" id="filterMateria" class="filter-input" placeholder="Ej. Indemnización, Despido..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterResultado">Resultado del Recurso</label>
          <select id="filterResultado" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Cualquier Resultado</option>
            <option value="Acoge">Acogido</option>
            <option value="Rechaza">Rechazado</option>
            <option value="Inadmisible">Inadmisible</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterFechaDesde">Fecha Desde</label>
          <input type="date" id="filterFechaDesde" class="filter-input" onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterFechaHasta">Fecha Hasta</label>
          <input type="date" id="filterFechaHasta" class="filter-input" onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'causas') {
      html = `
        <div class="filter-group">
          <label class="filter-label" for="filterCompetencia">Competencia</label>
          <select id="filterCompetencia" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todas las Competencias</option>
            <option value="Civil">Civil</option>
            <option value="Penal">Penal (Garantía / TOP)</option>
            <option value="Laboral">Laboral / Cobranza</option>
            <option value="Familia">Familia</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterRit">RIT Específico</label>
          <input type="text" id="filterRit" class="filter-input" placeholder="Ej. C-1234-2026" onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterRuc">RUC Específico</label>
          <input type="text" id="filterRuc" class="filter-input" placeholder="Ej. 2600..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterTribunal">Tribunal</label>
          <input type="text" id="filterTribunal" class="filter-input" placeholder="Ej. 1º Juzgado Civil..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterParte">Parte Procesal</label>
          <input type="text" id="filterParte" class="filter-input" placeholder="Nombre demandante o demandado..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterProcedimiento">Procedimiento</label>
          <input type="text" id="filterProcedimiento" class="filter-input" placeholder="Ej. Ejecutivo, Ordinario..." onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'especiales') {
      html = `
        <div class="filter-group">
          <label class="filter-label" for="filterTribunalEspecial">Tribunal Especial</label>
          <select id="filterTribunalEspecial" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todos los Tribunales Especiales</option>
            <option value="Constitucional">Tribunal Constitucional (TC)</option>
            <option value="Libre Competencia">Tribunal de Defensa Libre Competencia (TDLC)</option>
            <option value="Ambiental">Tribunal Ambiental (2TA)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterProcEspecial">Tipo Procedimiento</label>
          <input type="text" id="filterProcEspecial" class="filter-input" placeholder="Ej. Inaplicabilidad, Requerimiento..." onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'leyes') {
      html = `
        <div class="filter-group">
          <label class="filter-label" for="filterTipoNorma">Tipo de Norma</label>
          <select id="filterTipoNorma" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todos los tipos</option>
            <option value="Código">Códigos de la República</option>
            <option value="Ley">Leyes</option>
            <option value="DFL">Decretos con Fuerza de Ley (DFL)</option>
            <option value="DL">Decretos Leyes (DL)</option>
            <option value="Decreto">Decretos Supremos</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterNumeroNorma">Número de Norma</label>
          <input type="text" id="filterNumeroNorma" class="filter-input" placeholder="Ej. 19880, 21394..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterOrganismo">Organismo Emisor</label>
          <input type="text" id="filterOrganismo" class="filter-input" placeholder="Ej. Ministerio de Justicia..." onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'doctrina-admin') {
      html = `
        <div class="filter-group">
          <label class="filter-label" for="filterOrgAdmin">Organismo Emisor</label>
          <select id="filterOrgAdmin" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todos los Organismos</option>
            <option value="Contraloría">Contraloría General (CGR)</option>
            <option value="Impuestos Internos">Servicio de Impuestos Internos (SII)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterAnioAdmin">Año de Emisión</label>
          <input type="number" id="filterAnioAdmin" class="filter-input" placeholder="Ej. 2024, 2025..." min="1990" max="2026" onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterNumAdmin">Número de Dictamen / Oficio</label>
          <input type="text" id="filterNumAdmin" class="filter-input" placeholder="Ej. E123456..." onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'doctrina-juridica') {
      html = `
        <div class="filter-group">
          <label class="filter-label" for="filterAreaDerecho">Área del Derecho</label>
          <select id="filterAreaDerecho" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todas las Áreas</option>
            <option value="Civil">Derecho Civil</option>
            <option value="Penal">Derecho Penal</option>
            <option value="Constitucional">Derecho Constitucional</option>
            <option value="Administrativo">Derecho Administrativo</option>
            <option value="Laboral">Derecho del Trabajo</option>
            <option value="Comercial">Derecho Comercial</option>
            <option value="Tributario">Derecho Tributario</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterAutor">Autor</label>
          <input type="text" id="filterAutor" class="filter-input" placeholder="Nombre del autor o académica..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterAnioDoc">Año</label>
          <input type="number" id="filterAnioDoc" class="filter-input" placeholder="Ej. 2023, 2024..." min="1990" max="2026" onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'formatos') {
      html = `
        <div class="filter-group">
          <label class="filter-label" for="filterCategoriaFmt">Categoría Forense</label>
          <select id="filterCategoriaFmt" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todas las Categorías</option>
            <option value="Civil">Civil</option>
            <option value="Penal">Penal</option>
            <option value="Laboral">Laboral</option>
            <option value="Familia">Familia</option>
            <option value="Comercial">Comercial</option>
            <option value="Constitucional">Constitucional</option>
            <option value="Policía Local">Policía Local</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filterTipoDocFmt">Tipo de Escrito</label>
          <select id="filterTipoDocFmt" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todos los Tipos</option>
            <option value="Demanda">Demanda / Querella</option>
            <option value="Contestación">Contestación de Demanda</option>
            <option value="Recurso">Recursos Procesales</option>
            <option value="Téngase Presente">Téngase Presente</option>
            <option value="Medida Cautelar">Medidas Cautelares / Precautorias</option>
          </select>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // Recoger Filtros Activos del DOM
  function collectActiveFilters() {
    const filters = {};
    const tab = state.currentTab;

    if (tab === 'fallos') {
      const corte = document.getElementById('filterCorte')?.value;
      const sala = document.getElementById('filterSala')?.value;
      const recurso = document.getElementById('filterRecurso')?.value;
      const materia = document.getElementById('filterMateria')?.value;
      const resultado = document.getElementById('filterResultado')?.value;
      const desde = document.getElementById('filterFechaDesde')?.value;
      const hasta = document.getElementById('filterFechaHasta')?.value;

      if (corte) filters.corte = corte;
      if (sala) filters.sala = sala;
      if (recurso) filters.recurso = recurso;
      if (materia) filters.materia = materia;
      if (resultado) filters.resultado = resultado;
      if (desde) filters.fecha_desde = desde;
      if (hasta) filters.fecha_hasta = hasta;
    } else if (tab === 'causas') {
      const comp = document.getElementById('filterCompetencia')?.value;
      const rit = document.getElementById('filterRit')?.value;
      const ruc = document.getElementById('filterRuc')?.value;
      const trib = document.getElementById('filterTribunal')?.value;
      const parte = document.getElementById('filterParte')?.value;
      const proc = document.getElementById('filterProcedimiento')?.value;

      if (comp) filters.competencia = comp;
      if (rit) filters.rit = rit;
      if (ruc) filters.ruc = ruc;
      if (trib) filters.tribunal = trib;
      if (parte) filters.parte = parte;
      if (proc) filters.procedimiento = proc;
    } else if (tab === 'especiales') {
      const trib = document.getElementById('filterTribunalEspecial')?.value;
      const proc = document.getElementById('filterProcEspecial')?.value;
      if (trib) filters.tribunal = trib;
      if (proc) filters.procedimiento = proc;
    } else if (tab === 'leyes') {
      const tipo = document.getElementById('filterTipoNorma')?.value;
      const num = document.getElementById('filterNumeroNorma')?.value;
      const org = document.getElementById('filterOrganismo')?.value;
      if (tipo) filters.tipo_norma = tipo;
      if (num) filters.numero = num;
      if (org) filters.organismo = org;
    } else if (tab === 'doctrina-admin') {
      const org = document.getElementById('filterOrgAdmin')?.value;
      const anio = document.getElementById('filterAnioAdmin')?.value;
      const num = document.getElementById('filterNumAdmin')?.value;
      if (org) filters.organismo = org;
      if (anio) filters.anio = anio;
      if (num) filters.numero = num;
    } else if (tab === 'doctrina-juridica') {
      const area = document.getElementById('filterAreaDerecho')?.value;
      const autor = document.getElementById('filterAutor')?.value;
      const anio = document.getElementById('filterAnioDoc')?.value;
      if (area) filters.area_derecho = area;
      if (autor) filters.autor = autor;
      if (anio) filters.anio = anio;
    } else if (tab === 'formatos') {
      const cat = document.getElementById('filterCategoriaFmt')?.value;
      const tipo = document.getElementById('filterTipoDocFmt')?.value;
      if (cat) filters.categoria = cat;
      if (tipo) filters.tipo_documento = tipo;
    }

    return filters;
  }

  // Ejecución de Búsqueda y Paginación
  async function executeSearch() {
    if (state.loading) return;
    state.loading = true;

    const listContainer = document.getElementById('resultsList');
    const metaCount = document.getElementById('resultsCountVal');
    const cacheIndicator = document.getElementById('cacheIndicator');

    UI.renderSkeletons(listContainer, 4);

    const params = {
      q: state.query,
      page: state.page,
      limit: state.limit,
      ...collectActiveFilters()
    };

    try {
      const startTime = performance.now();
      let res;

      switch (state.currentTab) {
        case 'fallos':
          res = await API.getFallos(params);
          break;
        case 'causas':
          res = await API.getCausas(params);
          break;
        case 'especiales':
          res = await API.getEspeciales(params);
          break;
        case 'leyes':
          res = await API.getLeyes(params);
          break;
        case 'doctrina-admin':
          res = await API.getDoctrinaAdmin(params);
          break;
        case 'doctrina-juridica':
          res = await API.getDoctrinaJuridica(params);
          break;
        case 'formatos':
          res = await API.getFormatos(params);
          break;
        default:
          res = { success: false, data: [] };
      }

      const elapsedMs = Math.round(performance.now() - startTime);

      if (res && res.success) {
        state.total = res.total || 0;
        state.totalPages = res.totalPages || 1;

        if (metaCount) {
          metaCount.textContent = state.total.toLocaleString('es-CL');
        }

        if (cacheIndicator) {
          cacheIndicator.style.display = 'inline-flex';
          if (res.cached || res.fromClientCache) {
            cacheIndicator.textContent = `Caché · ${elapsedMs} ms`;
          } else {
            cacheIndicator.textContent = `BigQuery · ${elapsedMs} ms`;
          }
        }

        renderResults(res.data || []);
        renderPagination();
      } else {
        listContainer.innerHTML = `
          <div class="empty-state-box">
            <h3>No se encontraron registros</h3>
            <p>Ajusta los términos de búsqueda o restablece los filtros del archivo.</p>
          </div>
        `;
        renderPagination();
      }
    } catch (err) {
      console.error('Error al ejecutar búsqueda:', err);
      listContainer.innerHTML = `
        <div class="empty-state-box error-state-box">
          <h3>Error al consultar el Archivo Judicial</h3>
          <p>${UI.escapeHtml(err.message)}</p>
        </div>
      `;
    } finally {
      state.loading = false;
    }
  }

  // Renderizar Lista Documental según el Tab
  function renderResults(items) {
    const listContainer = document.getElementById('resultsList');
    if (!items || items.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state-box">
          <h3>Sin resultados para esta consulta</h3>
          <p>Intenta con palabras clave más amplias, número de rol o materias jurídicas afines.</p>
        </div>
      `;
      return;
    }

    let html = '';
    for (const item of items) {
      switch (state.currentTab) {
        case 'fallos':
          html += UI.renderFalloCard(item, state.activeDocId);
          break;
        case 'causas':
          html += UI.renderCausaCard(item, state.activeDocId);
          break;
        case 'especiales':
          html += UI.renderEspecialCard(item, state.activeDocId);
          break;
        case 'leyes':
          html += UI.renderLeyCard(item, state.activeDocId);
          break;
        case 'doctrina-admin':
          html += UI.renderDoctrinaAdminCard(item, state.activeDocId);
          break;
        case 'doctrina-juridica':
          html += UI.renderDoctrinaJuridicaCard(item, state.activeDocId);
          break;
        case 'formatos':
          html += UI.renderFormatoCard(item, state.activeDocId);
          break;
      }
    }

    listContainer.innerHTML = html;
  }

  // Sincronizar marca de ficha seleccionada en la lista central
  function syncSelectedCardUI(id) {
    document.querySelectorAll('.legal-card.is-selected').forEach(el => {
      el.classList.remove('is-selected');
    });
    if (id !== null && id !== undefined) {
      const target = document.querySelector(`.legal-card[data-id="${CSS.escape(String(id))}"]`);
      if (target) {
        target.classList.add('is-selected');
      }
    }
  }

  // Paginación
  function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (state.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const cur = state.page;
    const max = state.totalPages;

    container.innerHTML = `
      <button type="button" class="btn-page" ${cur <= 1 ? 'disabled' : ''} onclick="App.goToPage(${cur - 1})">
        ← Anterior
      </button>
      <span class="pagination-status">
        Página <strong>${cur}</strong> de <strong>${max.toLocaleString('es-CL')}</strong>
      </span>
      <button type="button" class="btn-page" ${cur >= max ? 'disabled' : ''} onclick="App.goToPage(${cur + 1})">
        Siguiente →
      </button>
    `;
  }

  function goToPage(p) {
    if (p < 1 || p > state.totalPages) return;
    state.page = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    executeSearch();
  }

  // Filtrado reactivo
  function onFilterChange() {
    state.page = 1;
    executeSearch();
  }

  function clearAllFilters() {
    const input = document.getElementById('omniSearchInput');
    if (input) input.value = '';
    state.query = '';
    state.page = 1;
    renderSidebarFilters(state.currentTab);
    executeSearch();
    UI.showToast('Filtros restablecidos');
  }

  function toggleMobileFilters() {
    const sidebar = document.getElementById('filtersSidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  }

  // Copiar Cita Formateada
  async function copyCitation(citationText) {
    const ok = await Citations.copyToClipboard(citationText);
    if (ok) {
      UI.showToast('Cita formateada copiada al portapapeles');
    } else {
      UI.showToast('No se pudo copiar automáticamente');
    }
  }

  function copyCitationFromBtn(btn) {
    const cit = btn?.dataset?.citation || '';
    if (cit) copyCitation(cit);
  }

  function copyCurrentCitation() {
    const citElem = document.getElementById('modalCitationString');
    if (citElem && citElem.textContent.trim()) {
      copyCitation(citElem.textContent.trim());
    }
  }

  function setCitationStyle(style) {
    state.citationStyle = style;
    document.querySelectorAll('.btn-cit-style').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.style === style);
    });

    if (state.activeDocType && state.activeDocData) {
      const citBox = document.getElementById('modalCitationString');
      if (citBox) {
        citBox.textContent = Citations.formatCitationByStyle(state.activeDocType, state.activeDocData, style);
      }
    }
  }

  // Control de ancho del Panel Derecho (Split-View) y tamaño de letra
  function toggleDrawerWidth() {
    document.body.classList.toggle('drawer-expanded');
  }

  function adjustReadingFont(delta) {
    state.readingFontSize = Math.min(1.24, Math.max(0.84, +(state.readingFontSize + delta * 0.06).toFixed(2)));
    const area = document.querySelector('#modalBody .document-reading-area');
    if (area) {
      area.style.setProperty('--reading-font-size', `${state.readingFontSize}rem`);
    }
  }

  // =========================================================================
  // Herramientas de Subrayado Forense dentro del Drawer
  // =========================================================================

  function applyHighlight(color = 'ochre') {
    const readingArea = document.querySelector('#modalBody .document-reading-area');
    if (!readingArea) {
      UI.showToast('Este documento no tiene cuerpo de lectura subrayable');
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      UI.showToast('Selecciona primero un pasaje del texto para subrayarlo');
      return;
    }

    const range = selection.getRangeAt(0);
    if (!readingArea.contains(range.commonAncestorContainer)) {
      UI.showToast('La selección debe estar dentro del texto del fallo');
      return;
    }

    const selectedText = range.toString().trim();
    if (!selectedText) return;

    // Recolectar los nodos de texto cubiertos por la selección para envolver de forma segura
    const textNodes = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.length) return NodeFilter.FILTER_REJECT;
          if (!readingArea.contains(node)) return NodeFilter.FILTER_REJECT;
          if (range.intersectsNode(node)) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let current = walker.nextNode();
    while (current) {
      textNodes.push(current);
      current = walker.nextNode();
    }

    if (textNodes.length === 0) return;

    const groupId = `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const colorClass = `hl-${color}`;

    textNodes.forEach(node => {
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
      if (start >= end) return;

      const subRange = document.createRange();
      subRange.setStart(node, start);
      subRange.setEnd(node, end);

      const mark = document.createElement('mark');
      mark.className = `legal-highlight ${colorClass}`;
      mark.dataset.hlGroup = groupId;
      mark.title = 'Clic para quitar subrayado';
      mark.addEventListener('click', () => removeHighlightGroup(groupId));

      try {
        subRange.surroundContents(mark);
      } catch (e) {
        const frag = subRange.extractContents();
        mark.appendChild(frag);
        subRange.insertNode(mark);
      }
    });

    selection.removeAllRanges();
    refreshHighlightsUI();
    UI.showToast('Pasaje subrayado');
  }

  function removeHighlightGroup(groupId) {
    const readingArea = document.querySelector('#modalBody .document-reading-area');
    if (!readingArea) return;

    const marks = readingArea.querySelectorAll(`mark[data-hl-group="${CSS.escape(groupId)}"]`);
    marks.forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    });

    refreshHighlightsUI();
  }

  function clearHighlights() {
    const readingArea = document.querySelector('#modalBody .document-reading-area');
    if (!readingArea) return;

    const marks = readingArea.querySelectorAll('mark.legal-highlight');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    });

    refreshHighlightsUI();
    UI.showToast('Subrayados eliminados');
  }

  function collectHighlightedTexts() {
    const readingArea = document.querySelector('#modalBody .document-reading-area');
    if (!readingArea) return [];

    const groups = new Map();
    readingArea.querySelectorAll('mark.legal-highlight').forEach(mark => {
      const gid = mark.dataset.hlGroup || 'single';
      const prev = groups.get(gid) || '';
      groups.set(gid, prev + mark.textContent);
    });

    return Array.from(groups.values())
      .map(t => t.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  function refreshHighlightsUI() {
    const excerpts = collectHighlightedTexts();
    const countBadge = document.getElementById('highlightCountBadge');
    const btnCopy = document.getElementById('btnCopyHighlights');
    const btnClear = document.getElementById('btnClearHighlights');
    const summaryBox = document.getElementById('highlightsSummaryBox');
    const summaryList = document.getElementById('highlightsSummaryList');

    const hasItems = excerpts.length > 0;
    if (countBadge) {
      countBadge.style.display = hasItems ? 'inline-flex' : 'none';
      countBadge.textContent = String(excerpts.length);
    }
    if (btnCopy) btnCopy.style.display = hasItems ? 'inline-flex' : 'none';
    if (btnClear) btnClear.style.display = hasItems ? 'inline-flex' : 'none';

    if (summaryBox && summaryList) {
      summaryBox.classList.toggle('has-items', hasItems);
      summaryList.innerHTML = excerpts
        .map(txt => `<li>«${UI.escapeHtml(txt)}»</li>`)
        .join('');
    }
  }

  async function copyHighlightedExcerpts() {
    const excerpts = collectHighlightedTexts();
    if (excerpts.length === 0) {
      UI.showToast('No hay pasajes subrayados para copiar');
      return;
    }

    const cit = document.getElementById('modalCitationString')?.textContent?.trim() || '';
    const formatted = excerpts.map(t => `«${t}»`).join('\n\n') + (cit ? `\n\n(${cit})` : '');
    const ok = await Citations.copyToClipboard(formatted);
    if (ok) {
      UI.showToast(`${excerpts.length} extracto(s) y cita copiados para escrito`);
    }
  }

  // =========================================================================
  // Panel Lateral Derecho (Split-View Drawer de Detalle)
  // =========================================================================

  async function openDetail(type, id) {
    const drawer = document.getElementById('documentModal');
    const kickerElem = document.getElementById('modalKicker');
    const titleElem = document.getElementById('modalTitle');
    const metaElem = document.getElementById('modalMeta');
    const citationString = document.getElementById('modalCitationString');
    const toolbarElem = document.getElementById('readingToolbar');
    const bodyElem = document.getElementById('modalBody');
    const footerElem = document.getElementById('modalFooter');

    state.activeDocId = id;
    state.activeDocType = type;
    state.activeDocData = null;

    syncSelectedCardUI(id);

    const kickerMap = {
      'fallo': 'Jurisprudencia Judicial · PJUD',
      'causa': 'Expediente Judicial · 2026',
      'especial': 'Jurisdicción Especial',
      'ley': 'Legislación Vigente · BCN',
      'doctrina-admin': 'Doctrina Administrativa · CGR / SII',
      'doctrina-juridica': 'Doctrina Académica',
      'formato': 'Formato Procesal Editable'
    };

    if (kickerElem) kickerElem.textContent = kickerMap[type] || 'Ficha del Archivo Judicial';
    titleElem.textContent = 'Cargando documento judicial...';
    metaElem.textContent = '';
    citationString.textContent = 'Generando cita formateada...';
    if (toolbarElem) toolbarElem.style.display = type === 'formato' ? 'none' : 'flex';

    bodyElem.innerHTML = `
      <div class="skeleton-card" style="padding: 8px 0; border: none;">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line full"></div>
        <div class="skeleton-line full"></div>
      </div>
    `;
    footerElem.innerHTML = '';

    drawer.classList.add('open');
    document.body.classList.add('drawer-open');
    refreshHighlightsUI();

    try {
      let data;
      if (type === 'fallo') {
        const res = await API.getFalloById(id);
        data = res.data;
        state.activeDocData = data;
        renderFalloDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'causa') {
        const res = await API.getCausaById(id);
        data = res.data;
        state.activeDocData = data;
        renderCausaDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'especial') {
        const res = await API.getEspecialById(id);
        data = res.data;
        state.activeDocData = data;
        renderEspecialDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'ley') {
        const res = await API.getLeyById(id);
        data = res.data;
        state.activeDocData = data;
        renderLeyDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'doctrina-admin') {
        const res = await API.getDoctrinaAdminById(id);
        data = res.data;
        state.activeDocData = data;
        renderDoctrinaAdminDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'doctrina-juridica') {
        const res = await API.getDoctrinaJuridicaById(id);
        data = res.data;
        state.activeDocData = data;
        renderDoctrinaJuridicaDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'formato') {
        const res = await API.getFormatoById(id);
        data = res.data;
        state.activeDocData = data;
        renderFormatoDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      }

      // Aplicar tamaño de fuente de lectura preferido y reiniciar panel de subrayados
      const readingArea = bodyElem.querySelector('.document-reading-area');
      if (readingArea) {
        readingArea.style.setProperty('--reading-font-size', `${state.readingFontSize}rem`);
      }
      refreshHighlightsUI();
    } catch (err) {
      bodyElem.innerHTML = `
        <div class="empty-state-box error-state-box">
          <h3>Error al cargar el documento</h3>
          <p>${UI.escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  function renderHighlightsSummaryMarkup() {
    return `
      <div id="highlightsSummaryBox" class="highlights-summary-box">
        <div class="highlights-summary-header">
          <span class="highlights-summary-title">Extractos Subrayados para Escrito</span>
          <button type="button" class="btn-action btn-action-primary" onclick="App.copyHighlightedExcerpts()">
            Copiar extractos + cita
          </button>
        </div>
        <ul id="highlightsSummaryList" class="highlights-list"></ul>
      </div>
    `;
  }

  function renderFalloDetail(f, title, meta, citBox, body, footer) {
    const cit = Citations.formatCitationByStyle('fallo', f, state.citationStyle);
    title.textContent = f.caratulado || 'Sentencia Judicial';
    meta.textContent = `${f.corte || ''} · ${f.sala || 'Pleno'} · Rol ${f.rol_numero || 'S/R'}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Corte y Sala</span>
          <span class="metadata-item-val">${UI.escapeHtml(f.corte || '')} (${UI.escapeHtml(f.sala || 'Pleno')})</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Rol del Recurso</span>
          <span class="metadata-item-val val-mono">${UI.escapeHtml(f.rol_numero || 'S/N')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fecha Dictación</span>
          <span class="metadata-item-val">${UI.escapeHtml(Citations.formatDateCL(f.fecha_sentencia))}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Tipo Recurso</span>
          <span class="metadata-item-val">${UI.escapeHtml(f.tipo_recurso || 'Ordinario')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Resultado</span>
          <span class="metadata-item-val">${UI.escapeHtml(f.resultado_recurso || 'Fallado')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Magistrados / Jueces</span>
          <span class="metadata-item-val">${UI.escapeHtml(f.ministros_o_jueces || 'Corte')}</span>
        </div>
      </div>

      ${f.descriptores_juridicos ? `
        <div class="editorial-callout">
          <span class="editorial-callout-label">Descriptores de Doctrina Judicial</span>
          <p>${UI.escapeHtml(f.descriptores_juridicos)}</p>
        </div>
      ` : ''}

      <div>
        <div class="reading-section-heading">
          <span>Texto y Considerandos de la Sentencia</span>
          <span class="reading-hint">Selecciona texto y usa la barra de subrayado</span>
        </div>
        <div class="document-reading-area">${UI.escapeHtml(f.texto_sentencia_preview || 'Texto íntegro en expediente judicial.')}</div>
      </div>

      ${renderHighlightsSummaryMarkup()}
    `;

    footer.innerHTML = `
      <button type="button" class="btn-action btn-action-primary" onclick="App.copyCurrentCitation()">
        Copiar Cita Formateada
      </button>
      ${f.url_acceso_sentencia ? `
        <a href="${UI.escapeHtml(f.url_acceso_sentencia)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-seal">
          Abrir PDF Oficial PJUD ↗
        </a>
      ` : ''}
    `;
  }

  function renderCausaDetail(c, title, meta, citBox, body, footer) {
    const cit = Citations.formatCitationByStyle('causa', c, state.citationStyle);
    title.textContent = c.caratulado || 'Expediente Judicial';
    meta.textContent = `${c.tribunal || ''} · RIT ${c.rit || 'S/R'}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">RIT</span>
          <span class="metadata-item-val val-mono">${UI.escapeHtml(c.rit || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">RUC</span>
          <span class="metadata-item-val val-mono">${UI.escapeHtml(c.ruc || 'No asignado')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Tribunal</span>
          <span class="metadata-item-val">${UI.escapeHtml(c.tribunal || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Competencia</span>
          <span class="metadata-item-val">${UI.escapeHtml(c.competencia || 'General')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Procedimiento</span>
          <span class="metadata-item-val">${UI.escapeHtml(c.procedimiento || 'Ordinario')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fecha Ingreso</span>
          <span class="metadata-item-val">${UI.escapeHtml(Citations.formatDateCL(c.fecha_ingreso))}</span>
        </div>
      </div>

      <div class="litigation-parties-box">
        <div class="litigation-side">
          <h4>Demandante / Querellante / Fiscal</h4>
          <p>${UI.escapeHtml(c.demandante_o_fiscal || 'No especificado')}</p>
        </div>
        <div class="litigation-side side-defendant">
          <h4>Demandado / Imputado</h4>
          <p>${UI.escapeHtml(c.demandado_o_imputado || 'No individualizado')}</p>
        </div>
      </div>

      <div>
        <div class="reading-section-heading">
          <span>Materia o Delito en Disputa</span>
        </div>
        <div class="document-reading-area">${UI.escapeHtml(c.materia_o_delito || 'Materia no registrada')}</div>
      </div>

      ${renderHighlightsSummaryMarkup()}
    `;

    footer.innerHTML = `
      <button type="button" class="btn-action btn-action-primary" onclick="App.copyCurrentCitation()">
        Copiar Ficha de Causa
      </button>
      ${c.url_expediente ? `
        <a href="${UI.escapeHtml(c.url_expediente)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-seal">
          Ver Expediente en OJV ↗
        </a>
      ` : ''}
    `;
  }

  function renderEspecialDetail(e, title, meta, citBox, body, footer) {
    const cit = Citations.formatCitationByStyle('especial', e, state.citationStyle);
    title.textContent = e.caratulado_titulo || 'Sentencia Especial';
    meta.textContent = `${e.tribunal || ''} · Rol ${e.rol_causa || 'S/R'}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Tribunal</span>
          <span class="metadata-item-val">${UI.escapeHtml(e.tribunal || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Rol de Causa</span>
          <span class="metadata-item-val val-mono">${UI.escapeHtml(e.rol_causa || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Tipo Procedimiento</span>
          <span class="metadata-item-val">${UI.escapeHtml(e.tipo_procedimiento || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fecha Dictación</span>
          <span class="metadata-item-val">${UI.escapeHtml(Citations.formatDateCL(e.fecha_dictacion))}</span>
        </div>
      </div>

      <div>
        <div class="reading-section-heading">
          <span>Doctrina y Criterio Jurídico</span>
          <span class="reading-hint">Selecciona texto y usa la barra de subrayado</span>
        </div>
        <div class="document-reading-area">${UI.escapeHtml(e.doctrina_resumen || 'Resolución disponible en registro oficial.')}</div>
      </div>

      ${renderHighlightsSummaryMarkup()}
    `;

    footer.innerHTML = `
      <button type="button" class="btn-action btn-action-primary" onclick="App.copyCurrentCitation()">
        Copiar Cita Formateada
      </button>
      ${e.url_origen ? `
        <a href="${UI.escapeHtml(e.url_origen)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-seal">
          Ver Sentencia Original ↗
        </a>
      ` : ''}
    `;
  }

  function renderLeyDetail(l, title, meta, citBox, body, footer) {
    const cit = Citations.formatCitationByStyle('ley', l, state.citationStyle);
    title.textContent = l.titulo_norma || l.denominacion_oficial || 'Norma Legal';
    meta.textContent = `${l.tipo_norma || 'Norma'} N° ${l.numero_norma || 'S/N'} · ${l.organismo_emisor || ''}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Tipo y Número</span>
          <span class="metadata-item-val val-mono">${UI.escapeHtml(l.tipo_norma || '')} N° ${UI.escapeHtml(l.numero_norma || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Organismo Emisor</span>
          <span class="metadata-item-val">${UI.escapeHtml(l.organismo_emisor || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Publicación Diario Oficial</span>
          <span class="metadata-item-val">${UI.escapeHtml(Citations.formatDateCL(l.fecha_publicacion))}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Estado Vigencia</span>
          <span class="metadata-item-val val-vigente">${UI.escapeHtml(l.estado_vigencia || 'Vigente')}</span>
        </div>
      </div>

      ${l.nombres_uso_comun ? `
        <div class="editorial-callout">
          <span class="editorial-callout-label">Nombre de Uso Común</span>
          <p>${UI.escapeHtml(l.nombres_uso_comun)}</p>
        </div>
      ` : ''}

      <div>
        <div class="reading-section-heading">
          <span>Resumen Analítico BCN</span>
          <span class="reading-hint">Selecciona texto y usa la barra de subrayado</span>
        </div>
        <div class="document-reading-area">${UI.escapeHtml(l.resumen_analitico || l.denominacion_oficial || 'Texto sistematizado de la ley disponible en la Biblioteca del Congreso Nacional.')}</div>
      </div>

      ${renderHighlightsSummaryMarkup()}
    `;

    footer.innerHTML = `
      <button type="button" class="btn-action btn-action-primary" onclick="App.copyCurrentCitation()">
        Copiar Cita Oficial
      </button>
      ${l.url_leychile ? `
        <a href="${UI.escapeHtml(l.url_leychile)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-seal">
          Ver Texto Completo en LeyChile BCN ↗
        </a>
      ` : ''}
    `;
  }

  function renderDoctrinaAdminDetail(d, title, meta, citBox, body, footer) {
    const cit = Citations.formatCitationByStyle('doctrina-admin', d, state.citationStyle);
    title.textContent = d.materia_resumen || 'Pronunciamiento Administrativo';
    meta.textContent = `${d.organismo_emisor || ''} · ${d.tipo_documento || 'Dictamen'} N° ${d.numero_documento || ''}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Organismo</span>
          <span class="metadata-item-val">${UI.escapeHtml(d.organismo_emisor || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Número Documento</span>
          <span class="metadata-item-val val-mono">${UI.escapeHtml(d.numero_documento || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fecha Emisión</span>
          <span class="metadata-item-val">${UI.escapeHtml(Citations.formatDateCL(d.fecha_documento))}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fuentes Legales</span>
          <span class="metadata-item-val">${UI.escapeHtml(d.fuentes_legales || 'Normativa general')}</span>
        </div>
      </div>

      <div>
        <div class="reading-section-heading">
          <span>Texto y Criterio del Dictamen</span>
          <span class="reading-hint">Selecciona texto y usa la barra de subrayado</span>
        </div>
        <div class="document-reading-area">${UI.escapeHtml(d.texto_completo_o_extracto || 'Contenido del dictamen disponible en organismo emisor.')}</div>
      </div>

      ${renderHighlightsSummaryMarkup()}
    `;

    footer.innerHTML = `
      <button type="button" class="btn-action btn-action-primary" onclick="App.copyCurrentCitation()">
        Copiar Cita Formateada
      </button>
      ${d.url_origen ? `
        <a href="${UI.escapeHtml(d.url_origen)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-seal">
          Ver en Portal Oficial ↗
        </a>
      ` : ''}
    `;
  }

  function renderDoctrinaJuridicaDetail(a, title, meta, citBox, body, footer) {
    const cit = Citations.formatCitationByStyle('doctrina-juridica', a, state.citationStyle);
    title.textContent = a.titulo || 'Artículo Doctrinal';
    meta.textContent = `${a.autores || ''} · ${a.revista_o_fuente || ''} (${a.anio_publicacion || ''})`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Autores</span>
          <span class="metadata-item-val">${UI.escapeHtml(a.autores || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Área del Derecho</span>
          <span class="metadata-item-val">${UI.escapeHtml(a.area_derecho || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Revista / Editorial</span>
          <span class="metadata-item-val">${UI.escapeHtml(a.revista_o_fuente || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Año y Volumen</span>
          <span class="metadata-item-val">${UI.escapeHtml(String(a.anio_publicacion || ''))} ${UI.escapeHtml(a.volumen_numero || '')}</span>
        </div>
      </div>

      <div>
        <div class="reading-section-heading">
          <span>Resumen / Abstract Doctrinal</span>
          <span class="reading-hint">Selecciona texto y usa la barra de subrayado</span>
        </div>
        <div class="document-reading-area">${UI.escapeHtml(a.resumen_abstract || a.texto_completo_o_extracto || 'Artículo de doctrina jurídica chilena.')}</div>
      </div>

      ${renderHighlightsSummaryMarkup()}
    `;

    footer.innerHTML = `
      <button type="button" class="btn-action btn-action-primary" onclick="App.copyCurrentCitation()">
        Copiar Cita Bibliográfica
      </button>
      ${a.doi_o_url ? `
        <a href="${UI.escapeHtml(a.doi_o_url)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-seal">
          Ver Publicación Original ↗
        </a>
      ` : ''}
    `;
  }

  function renderFormatoDetail(fmt, title, meta, citBox, body, footer) {
    title.textContent = fmt.titulo || 'Plantilla Forense';
    meta.textContent = `${fmt.categoria || 'Civil'} · ${fmt.tipo_documento || 'Escrito'} · Sugerido: ${fmt.tribunal_sugerido || 'Tribunal de Letras'}`;
    citBox.textContent = Citations.formatCitationByStyle('formato', fmt, state.citationStyle);

    body.innerHTML = `
      <div class="template-editor-box">
        <div class="template-editor-meta">
          <span>Edita directamente el borrador para adaptar el escrito a tu causa:</span>
          <span class="template-sumilla">EN LO PRINCIPAL: ${UI.escapeHtml(fmt.sumilla || 'Demanda')}</span>
        </div>

        <textarea id="templateContentEditor" class="template-textarea">${UI.escapeHtml(fmt.contenido_template || '')}</textarea>
      </div>
    `;

    footer.innerHTML = `
      <button type="button" class="btn-action btn-action-primary" onclick="App.copyEditedTemplate()">
        Copiar Escrito para Presentar
      </button>
      <button type="button" class="btn-action btn-action-seal" onclick="App.downloadTemplateFile('${UI.escapeHtml(fmt.titulo || 'Escrito')}')">
        Descargar Escrito (.txt)
      </button>
    `;
  }

  function copyEditedTemplate() {
    const editor = document.getElementById('templateContentEditor');
    if (editor) {
      Citations.copyToClipboard(editor.value).then(() => {
        UI.showToast('Escrito copiado al portapapeles listo para el tribunal');
      });
    }
  }

  function downloadTemplateFile(title) {
    const editor = document.getElementById('templateContentEditor');
    if (editor) {
      const cleanTitle = (title || 'escrito_procesal').replace(/[^a-zA-Z0-9_\-]/g, '_');
      Citations.downloadTextFile(`${cleanTitle}.txt`, editor.value);
      UI.showToast('Archivo descargado correctamente');
    }
  }

  function closeModal() {
    const drawer = document.getElementById('documentModal');
    if (drawer) {
      drawer.classList.remove('open');
    }
    document.body.classList.remove('drawer-open', 'drawer-expanded');
    state.activeDocId = null;
    state.activeDocType = null;
    state.activeDocData = null;
    syncSelectedCardUI(null);
  }

  // Configuración de Eventos del DOM
  function setupEventListeners() {
    const searchInput = document.getElementById('omniSearchInput');
    const searchBtn = document.getElementById('btnSearch');

    let debounceTimer;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.query = e.target.value.trim();
          state.page = 1;
          executeSearch();
        }, 350);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(debounceTimer);
          state.query = searchInput.value.trim();
          state.page = 1;
          executeSearch();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        if (searchInput) state.query = searchInput.value.trim();
        state.page = 1;
        executeSearch();
      });
    }

    // Cerrar Drawer al presionar ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        const sidebar = document.getElementById('filtersSidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
      }
    });
  }

  return {
    init,
    switchTab,
    onFilterChange,
    clearAllFilters,
    toggleMobileFilters,
    goToPage,
    copyCitation,
    copyCitationFromBtn,
    copyCurrentCitation,
    setCitationStyle,
    toggleDrawerWidth,
    adjustReadingFont,
    applyHighlight,
    clearHighlights,
    copyHighlightedExcerpts,
    openDetail,
    copyEditedTemplate,
    downloadTemplateFile,
    closeModal
  };
})();

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
