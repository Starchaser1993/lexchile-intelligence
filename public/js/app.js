// Orquestador Principal de LexChile Intelligence
const App = (() => {

  const state = {
    currentTab: 'fallos',
    query: '',
    filters: {},
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
    loading: false
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
          <label class="filter-label">Corte / Tribunal</label>
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
          <label class="filter-label">Sala</label>
          <select id="filterSala" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todas las Salas</option>
            <option value="1ª Sala">Primera Sala (Civil)</option>
            <option value="2ª Sala">Segunda Sala (Penal)</option>
            <option value="3ª Sala">Tercera Sala (Constitucional/Adm)</option>
            <option value="4ª Sala">Cuarta Sala (Laboral)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Tipo de Recurso</label>
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
          <label class="filter-label">Materia Jurídica</label>
          <input type="text" id="filterMateria" class="filter-input" placeholder="Ej. Indemnización, Despido..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Resultado del Recurso</label>
          <select id="filterResultado" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Cualquier Resultado</option>
            <option value="Acoge">Acogido</option>
            <option value="Rechaza">Rechazado</option>
            <option value="Inadmisible">Inadmisible</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Fecha Desde</label>
          <input type="date" id="filterFechaDesde" class="filter-input" onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Fecha Hasta</label>
          <input type="date" id="filterFechaHasta" class="filter-input" onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'causas') {
      html = `
        <div class="filter-group">
          <label class="filter-label">Competencia</label>
          <select id="filterCompetencia" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todas las Competencias</option>
            <option value="Civil">Civil</option>
            <option value="Penal">Penal (Garantía / TOP)</option>
            <option value="Laboral">Laboral / Cobranza</option>
            <option value="Familia">Familia</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">RIT Específico</label>
          <input type="text" id="filterRit" class="filter-input" placeholder="Ej. C-1234-2026" onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">RUC Específico</label>
          <input type="text" id="filterRuc" class="filter-input" placeholder="Ej. 2600..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Tribunal</label>
          <input type="text" id="filterTribunal" class="filter-input" placeholder="Ej. 1º Juzgado Civil..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Parte Procesal</label>
          <input type="text" id="filterParte" class="filter-input" placeholder="Nombre demandante o demandado..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Procedimiento</label>
          <input type="text" id="filterProcedimiento" class="filter-input" placeholder="Ej. Ejecutivo, Ordinario..." onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'especiales') {
      html = `
        <div class="filter-group">
          <label class="filter-label">Tribunal Especial</label>
          <select id="filterTribunalEspecial" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todos los Tribunales Especiales</option>
            <option value="Constitucional">Tribunal Constitucional (TC)</option>
            <option value="Libre Competencia">Tribunal de Defensa Libre Competencia (TDLC)</option>
            <option value="Ambiental">Tribunal Ambiental (2TA)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Tipo Procedimiento</label>
          <input type="text" id="filterProcEspecial" class="filter-input" placeholder="Ej. Inaplicabilidad, Requerimiento..." onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'leyes') {
      html = `
        <div class="filter-group">
          <label class="filter-label">Tipo de Norma</label>
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
          <label class="filter-label">Número de Norma</label>
          <input type="text" id="filterNumeroNorma" class="filter-input" placeholder="Ej. 19880, 21394..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Organismo Emisor</label>
          <input type="text" id="filterOrganismo" class="filter-input" placeholder="Ej. Ministerio de Justicia..." onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'doctrina-admin') {
      html = `
        <div class="filter-group">
          <label class="filter-label">Organismo Emisor</label>
          <select id="filterOrgAdmin" class="filter-select" onchange="App.onFilterChange()">
            <option value="">Todos los Organismos</option>
            <option value="Contraloría">Contraloría General (CGR)</option>
            <option value="Impuestos Internos">Servicio de Impuestos Internos (SII)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Año de Emisión</label>
          <input type="number" id="filterAnioAdmin" class="filter-input" placeholder="Ej. 2024, 2025..." min="1990" max="2026" onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Número de Dictamen / Oficio</label>
          <input type="text" id="filterNumAdmin" class="filter-input" placeholder="Ej. E123456..." onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'doctrina-juridica') {
      html = `
        <div class="filter-group">
          <label class="filter-label">Área del Derecho</label>
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
          <label class="filter-label">Autor</label>
          <input type="text" id="filterAutor" class="filter-input" placeholder="Nombre del autor o académica..." onchange="App.onFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Año</label>
          <input type="number" id="filterAnioDoc" class="filter-input" placeholder="Ej. 2023, 2024..." min="1990" max="2026" onchange="App.onFilterChange()" />
        </div>
      `;
    } else if (tab === 'formatos') {
      html = `
        <div class="filter-group">
          <label class="filter-label">Categoría Forense</label>
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
          <label class="filter-label">Tipo de Escrito</label>
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
          if (res.cached || res.fromClientCache) {
            cacheIndicator.style.display = 'inline-flex';
            cacheIndicator.textContent = `⚡ Caché ultrarrápido (${elapsedMs} ms)`;
          } else {
            cacheIndicator.style.display = 'inline-flex';
            cacheIndicator.textContent = `☁️ BigQuery (${elapsedMs} ms)`;
          }
        }

        renderResults(res.data || []);
        renderPagination();
      } else {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
            <h3>No se encontraron registros</h3>
            <p style="font-size: 0.9rem; margin-top: 6px;">Prueba ajustando los términos de búsqueda o eliminando filtros.</p>
          </div>
        `;
        renderPagination();
      }
    } catch (err) {
      console.error('Error al ejecutar búsqueda:', err);
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--rose-danger);">
          <h3>Error al conectar con el Data Lake</h3>
          <p style="font-size: 0.85rem; margin-top: 6px;">${UI.escapeHtml(err.message)}</p>
        </div>
      `;
    } finally {
      state.loading = false;
    }
  }

  // Renderizar Tarjetas de Resultados según el Tab
  function renderResults(items) {
    const listContainer = document.getElementById('resultsList');
    if (!items || items.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">⚖️</div>
          <h3>Sin resultados para esta consulta</h3>
          <p style="font-size: 0.88rem; margin-top: 6px;">Intenta con palabras clave más amplias, rol de causa o materias afines.</p>
        </div>
      `;
      return;
    }

    let html = '';
    for (const item of items) {
      switch (state.currentTab) {
        case 'fallos':
          html += UI.renderFalloCard(item);
          break;
        case 'causas':
          html += UI.renderCausaCard(item);
          break;
        case 'especiales':
          html += UI.renderEspecialCard(item);
          break;
        case 'leyes':
          html += UI.renderLeyCard(item);
          break;
        case 'doctrina-admin':
          html += UI.renderDoctrinaAdminCard(item);
          break;
        case 'doctrina-juridica':
          html += UI.renderDoctrinaJuridicaCard(item);
          break;
        case 'formatos':
          html += UI.renderFormatoCard(item);
          break;
      }
    }

    listContainer.innerHTML = html;
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

    let html = `
      <button class="btn-page" ${cur <= 1 ? 'disabled' : ''} onclick="App.goToPage(${cur - 1})">
        ← Anterior
      </button>
      <span style="font-size:0.85rem; color:var(--text-muted); padding: 0 10px;">
        Página <strong>${cur}</strong> de <strong>${max.toLocaleString('es-CL')}</strong>
      </span>
      <button class="btn-page" ${cur >= max ? 'disabled' : ''} onclick="App.goToPage(${cur + 1})">
        Siguiente →
      </button>
    `;

    container.innerHTML = html;
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

  // Copiar Cita Canónica
  async function copyCitation(citationText) {
    const ok = await Citations.copyToClipboard(citationText);
    if (ok) {
      UI.showToast('Cita canónica copiada al portapapeles');
    } else {
      UI.showToast('No se pudo copiar automáticamente');
    }
  }

  // Visor Forense / Modal de Detalle
  async function openDetail(type, id) {
    const modal = document.getElementById('documentModal');
    const titleElem = document.getElementById('modalTitle');
    const metaElem = document.getElementById('modalMeta');
    const citationString = document.getElementById('modalCitationString');
    const bodyElem = document.getElementById('modalBody');
    const footerElem = document.getElementById('modalFooter');

    titleElem.textContent = 'Cargando documento judicial...';
    metaElem.textContent = '';
    citationString.textContent = 'Generando cita canónica...';
    bodyElem.innerHTML = '<div class="skeleton-line full" style="height:100px;"></div>';

    modal.classList.add('open');

    try {
      let data;
      if (type === 'fallo') {
        const res = await API.getFalloById(id);
        data = res.data;
        renderFalloDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'causa') {
        const res = await API.getCausaById(id);
        data = res.data;
        renderCausaDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'especial') {
        const res = await API.getEspecialById(id);
        data = res.data;
        renderEspecialDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'ley') {
        const res = await API.getLeyById(id);
        data = res.data;
        renderLeyDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'doctrina-admin') {
        const res = await API.getDoctrinaAdminById(id);
        data = res.data;
        renderDoctrinaAdminDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'doctrina-juridica') {
        const res = await API.getDoctrinaJuridicaById(id);
        data = res.data;
        renderDoctrinaJuridicaDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      } else if (type === 'formato') {
        const res = await API.getFormatoById(id);
        data = res.data;
        renderFormatoDetail(data, titleElem, metaElem, citationString, bodyElem, footerElem);
      }
    } catch (err) {
      bodyElem.innerHTML = `<p style="color:var(--rose-danger);">Error al cargar detalle: ${err.message}</p>`;
    }
  }

  function renderFalloDetail(f, title, meta, citBox, body, footer) {
    const cit = Citations.generateFalloCitation(f);
    title.textContent = f.caratulado || 'Sentencia Judicial';
    meta.textContent = `${f.corte || ''} • ${f.sala || ''} • Rol ${f.rol_numero || 'S/R'}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Corte y Sala</span>
          <span class="metadata-item-val">${UI.escapeHtml(f.corte || '')} (${UI.escapeHtml(f.sala || 'Pleno')})</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Rol del Recurso</span>
          <span class="metadata-item-val" style="color:var(--gold-primary); font-family:var(--font-mono);">${UI.escapeHtml(f.rol_numero || 'S/N')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fecha Dictación</span>
          <span class="metadata-item-val">${Citations.formatDateCL(f.fecha_sentencia)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Tipo Recurso</span>
          <span class="metadata-item-val">${UI.escapeHtml(f.tipo_recurso || 'Ordinario')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Resultado Recurso</span>
          <span class="metadata-item-val">${UI.escapeHtml(f.resultado_recurso || 'Fallado')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Magistrados / Jueces</span>
          <span class="metadata-item-val">${UI.escapeHtml(f.ministros_o_jueces || 'Corte')}</span>
        </div>
      </div>

      ${f.descriptores_juridicos ? `
        <div style="background:rgba(255,255,255,0.02); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--gold-primary);">Descriptores de Doctrina Judicial:</strong>
          <p style="font-size:0.9rem; margin-top:4px;">${UI.escapeHtml(f.descriptores_juridicos)}</p>
        </div>
      ` : ''}

      <div>
        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:10px;">Texto y Considerandos de la Sentencia:</h4>
        <div class="document-reading-area">
          ${UI.escapeHtml(f.texto_sentencia_preview || 'Texto íntegro en expediente judicial.')}
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-action btn-action-gold" onclick="App.copyCitation('${UI.escapeHtml(cit)}')">
        📋 Copiar Cita Canónica
      </button>
      ${f.url_acceso_sentencia ? `
        <a href="${UI.escapeHtml(f.url_acceso_sentencia)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-primary">
          📄 Abrir PDF Oficial PJUD
        </a>
      ` : ''}
    `;
  }

  function renderCausaDetail(c, title, meta, citBox, body, footer) {
    const cit = Citations.generateCausaCitation(c);
    title.textContent = c.caratulado || 'Expediente Judicial';
    meta.textContent = `${c.tribunal || ''} • RIT: ${c.rit || 'S/R'}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">RIT</span>
          <span class="metadata-item-val" style="color:var(--gold-primary); font-family:var(--font-mono);">${UI.escapeHtml(c.rit || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">RUC</span>
          <span class="metadata-item-val" style="font-family:var(--font-mono);">${UI.escapeHtml(c.ruc || 'No asignado')}</span>
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
          <span class="metadata-item-val">${Citations.formatDateCL(c.fecha_ingreso)}</span>
        </div>
      </div>

      <div class="litigation-parties-box">
        <div class="litigation-side">
          <h4>🔵 Demandante / Querellante / Fiscal:</h4>
          <p>${UI.escapeHtml(c.demandante_o_fiscal || 'No especificado')}</p>
        </div>
        <div class="litigation-side">
          <h4>🔴 Demandado / Imputado:</h4>
          <p>${UI.escapeHtml(c.demandado_o_imputado || 'No individualizado')}</p>
        </div>
      </div>

      <div style="background:var(--bg-card); padding:18px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
        <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Materia o Delito en Disputa:</strong>
        <p style="font-size:0.95rem; margin-top:6px; color:var(--text-main); font-weight:600;">
          ${UI.escapeHtml(c.materia_o_delito || 'Materia no registrada')}
        </p>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-action btn-action-gold" onclick="App.copyCitation('${UI.escapeHtml(cit)}')">
        📋 Copiar Ficha de Causa
      </button>
      ${c.url_expediente ? `
        <a href="${UI.escapeHtml(c.url_expediente)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-primary">
          🏛️ Ver Expediente en OJV
        </a>
      ` : ''}
    `;
  }

  function renderEspecialDetail(e, title, meta, citBox, body, footer) {
    const cit = Citations.generateEspecialCitation(e);
    title.textContent = e.caratulado_titulo || 'Sentencia Especial';
    meta.textContent = `${e.tribunal || ''} • Rol ${e.rol_causa || 'S/R'}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Tribunal</span>
          <span class="metadata-item-val">${UI.escapeHtml(e.tribunal || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Rol de Causa</span>
          <span class="metadata-item-val" style="color:var(--gold-primary); font-family:var(--font-mono);">${UI.escapeHtml(e.rol_causa || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Tipo Procedimiento</span>
          <span class="metadata-item-val">${UI.escapeHtml(e.tipo_procedimiento || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fecha Dictación</span>
          <span class="metadata-item-val">${Citations.formatDateCL(e.fecha_dictacion)}</span>
        </div>
      </div>

      <div>
        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:10px;">Doctrina y Criterio Jurídico:</h4>
        <div class="document-reading-area">
          ${UI.escapeHtml(e.doctrina_resumen || 'Resolución disponible en registro oficial.')}
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-action btn-action-gold" onclick="App.copyCitation('${UI.escapeHtml(cit)}')">
        📋 Copiar Cita Canónica
      </button>
      ${e.url_origen ? `
        <a href="${UI.escapeHtml(e.url_origen)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-primary">
          🌐 Ver Sentencia Original
        </a>
      ` : ''}
    `;
  }

  function renderLeyDetail(l, title, meta, citBox, body, footer) {
    const cit = Citations.generateLeyCitation(l);
    title.textContent = l.titulo_norma || l.denominacion_oficial;
    meta.textContent = `${l.tipo_norma || 'Norma'} N° ${l.numero_norma || 'S/N'} • ${l.organismo_emisor || ''}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Tipo y Número</span>
          <span class="metadata-item-val" style="color:var(--gold-primary);">${UI.escapeHtml(l.tipo_norma || '')} N° ${UI.escapeHtml(l.numero_norma || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Organismo Emisor</span>
          <span class="metadata-item-val">${UI.escapeHtml(l.organismo_emisor || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Publicación Diario Oficial</span>
          <span class="metadata-item-val">${Citations.formatDateCL(l.fecha_publicacion)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Estado Vigencia</span>
          <span class="metadata-item-val" style="color:var(--emerald-success); font-weight:700;">${UI.escapeHtml(l.estado_vigencia || 'Vigente')}</span>
        </div>
      </div>

      ${l.nombres_uso_comun ? `
        <div style="background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.3); padding:14px; border-radius:var(--radius-md);">
          <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--gold-primary);">Nombre de Uso Común:</strong>
          <p style="font-size:1.05rem; font-weight:700; color:var(--text-gold); margin-top:2px;">⭐ ${UI.escapeHtml(l.nombres_uso_comun)}</p>
        </div>
      ` : ''}

      <div>
        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:10px;">Resumen Analítico BCN:</h4>
        <div class="document-reading-area">
          ${UI.escapeHtml(l.resumen_analitico || l.denominacion_oficial || 'Texto sistematizado de la ley disponible en la Biblioteca del Congreso Nacional.')}
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-action btn-action-gold" onclick="App.copyCitation('${UI.escapeHtml(cit)}')">
        📋 Copiar Cita Oficial
      </button>
      ${l.url_leychile ? `
        <a href="${UI.escapeHtml(l.url_leychile)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-primary">
          🏛️ Ver Texto Completo en LeyChile BCN
        </a>
      ` : ''}
    `;
  }

  function renderDoctrinaAdminDetail(d, title, meta, citBox, body, footer) {
    const cit = Citations.generateDoctrinaAdminCitation(d);
    title.textContent = d.materia_resumen || 'Pronunciamiento Administrativo';
    meta.textContent = `${d.organismo_emisor || ''} • ${d.tipo_documento || 'Dictamen'} N° ${d.numero_documento || ''}`;
    citBox.textContent = cit;

    body.innerHTML = `
      <div class="metadata-grid">
        <div class="metadata-item">
          <span class="metadata-item-label">Organismo</span>
          <span class="metadata-item-val">${UI.escapeHtml(d.organismo_emisor || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Número Documento</span>
          <span class="metadata-item-val" style="color:var(--gold-primary); font-family:var(--font-mono);">${UI.escapeHtml(d.numero_documento || '')}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fecha Emisión</span>
          <span class="metadata-item-val">${Citations.formatDateCL(d.fecha_documento)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-item-label">Fuentes Legales</span>
          <span class="metadata-item-val">${UI.escapeHtml(d.fuentes_legales || 'Normativa general')}</span>
        </div>
      </div>

      <div>
        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:10px;">Texto y Criterio del Dictamen:</h4>
        <div class="document-reading-area">
          ${UI.escapeHtml(d.texto_completo_o_extracto || 'Contenido del dictamen disponible en organismo emisor.')}
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-action btn-action-gold" onclick="App.copyCitation('${UI.escapeHtml(cit)}')">
        📋 Copiar Cita
      </button>
      ${d.url_origen ? `
        <a href="${UI.escapeHtml(d.url_origen)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-primary">
          🌐 Ver en Portal Oficial
        </a>
      ` : ''}
    `;
  }

  function renderDoctrinaJuridicaDetail(a, title, meta, citBox, body, footer) {
    const cit = Citations.generateDoctrinaJuridicaCitation(a);
    title.textContent = a.titulo || 'Artículo Doctrinal';
    meta.textContent = `${a.autores || ''} • ${a.revista_o_fuente || ''} (${a.anio_publicacion || ''})`;
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
        <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:10px;">Resumen / Abstract Doctrinal:</h4>
        <div class="document-reading-area">
          ${UI.escapeHtml(a.resumen_abstract || a.texto_completo_o_extracto || 'Artículo de doctrina jurídica chilena.')}
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-action btn-action-gold" onclick="App.copyCitation('${UI.escapeHtml(cit)}')">
        📋 Copiar Cita Bibliográfica
      </button>
      ${a.doi_o_url ? `
        <a href="${UI.escapeHtml(a.doi_o_url)}" target="_blank" rel="noopener noreferrer" class="btn-action btn-action-primary">
          🔗 Ver Publicación Original
        </a>
      ` : ''}
    `;
  }

  function renderFormatoDetail(fmt, title, meta, citBox, body, footer) {
    title.textContent = fmt.titulo || 'Plantilla Forense';
    meta.textContent = `${fmt.categoria || 'Civil'} • ${fmt.tipo_documento || 'Escrito'} • Sugerido: ${fmt.tribunal_sugerido || 'Tribunal de Letras'}`;
    citBox.textContent = `Escrito forense: «${fmt.titulo}». Normativa: ${fmt.normativa_asociada || 'Reglas procesales vigentes'}.`;

    body.innerHTML = `
      <div class="template-editor-box">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <span style="font-size:0.8rem; color:var(--text-muted);">
            Edita directamente en esta caja para adaptar el escrito a tu causa:
          </span>
          <span style="font-size:0.75rem; color:var(--gold-primary); font-weight:600;">
            Sumilla: EN LO PRINCIPAL: ${UI.escapeHtml(fmt.sumilla || 'Demanda')}
          </span>
        </div>

        <textarea id="templateContentEditor" class="template-textarea">${UI.escapeHtml(fmt.contenido_template || '')}</textarea>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-action btn-action-gold" onclick="App.copyEditedTemplate()">
        📋 Copiar Escrito para Presentar
      </button>
      <button class="btn-action btn-action-primary" onclick="App.downloadTemplateFile('${UI.escapeHtml(fmt.titulo || 'Escrito')}')">
        💾 Descargar Escrito (.txt)
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
    const modal = document.getElementById('documentModal');
    if (modal) {
      modal.classList.remove('open');
    }
  }

  // Configuración de Eventos del DOM
  function setupEventListeners() {
    // Input de búsqueda Omnisearch
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

    // Modal close al presionar ESC o click fuera
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    const modal = document.getElementById('documentModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  return {
    init,
    switchTab,
    onFilterChange,
    clearAllFilters,
    goToPage,
    copyCitation,
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
