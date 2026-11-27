// Capa de Renderizado e Interfaz Editorial — Archivo Judicial
const UI = (() => {

  function showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span aria-hidden="true">§</span>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3000);
  }

  function renderSkeletons(container, count = 5) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line full"></div>
          <div class="skeleton-line full"></div>
        </div>
      `;
    }
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Ficha Bibliográfica: Jurisprudencia PJUD
  function renderFalloCard(f, selectedId = null) {
    const citation = Citations.generateFalloCitation(f);
    const dateFormatted = Citations.formatDateCL(f.fecha_sentencia);
    const isAcogido = f.resultado_recurso && f.resultado_recurso.toLowerCase().includes('acog');
    const resClass = isAcogido ? 'badge-resultado-acogido' : 'badge-resultado-rechazado';
    const isSelected = selectedId && String(selectedId) === String(f.id_fallo);

    return `
      <article class="legal-card ${isSelected ? 'is-selected' : ''}" role="listitem" data-id="${escapeHtml(f.id_fallo)}" data-type="fallo">
        <div class="card-header">
          <div class="badge-cluster">
            ${f.corte ? `<span class="badge badge-corte">${escapeHtml(f.corte)}</span>` : ''}
            ${f.sala ? `<span class="badge badge-tribunal">${escapeHtml(f.sala)}</span>` : ''}
            ${f.tipo_recurso ? `<span class="badge badge-recurso">${escapeHtml(f.tipo_recurso)}</span>` : ''}
            ${f.resultado_recurso ? `<span class="badge ${resClass}">${escapeHtml(f.resultado_recurso)}</span>` : ''}
          </div>
          <time class="badge-date">${escapeHtml(dateFormatted || f.fecha_sentencia || '2026')}</time>
        </div>

        <h3 class="card-title" onclick="App.openDetail('fallo', '${escapeHtml(f.id_fallo)}')">
          ${escapeHtml(f.caratulado || 'Sentencia sin carátula formal')}${f.rol_numero ? `<span class="card-rol-inline">Rol ${escapeHtml(f.rol_numero)}</span>` : ''}
        </h3>

        ${f.descriptores_juridicos || f.materia ? `
          <div class="card-descriptors">
            <span class="descriptor-label">Materia:</span>
            <span class="descriptor-tag">${escapeHtml(f.materia || 'General')}</span>
            ${f.descriptores_juridicos ? `<span class="descriptor-tag">${escapeHtml(f.descriptores_juridicos)}</span>` : ''}
          </div>
        ` : ''}

        <p class="card-preview">
          ${escapeHtml(f.texto_sentencia_preview || 'Resolución judicial dictada en el marco de tramitación de recurso ante cortes del Poder Judicial.')}
        </p>

        <div class="card-footer">
          <div class="citation-preview" title="${escapeHtml(citation)}">
            ${escapeHtml(citation)}
          </div>
          <div class="card-btn-group">
            <button type="button" class="btn-action" data-citation="${escapeHtml(citation)}" onclick="App.copyCitationFromBtn(this)">
              Copiar Cita
            </button>
            <button type="button" class="btn-action btn-action-primary" onclick="App.openDetail('fallo', '${escapeHtml(f.id_fallo)}')">
              Ver Fallo
            </button>
            ${f.url_acceso_sentencia ? `
              <a href="${escapeHtml(f.url_acceso_sentencia)}" target="_blank" rel="noopener noreferrer" class="btn-action">
                Doc PJUD ↗
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  // Ficha Bibliográfica: Expediente Judicial 2026
  function renderCausaCard(c, selectedId = null) {
    const citation = Citations.generateCausaCitation(c);
    const dateFormatted = Citations.formatDateCL(c.fecha_ingreso);
    const isSelected = selectedId && String(selectedId) === String(c.id_causa);

    return `
      <article class="legal-card ${isSelected ? 'is-selected' : ''}" role="listitem" data-id="${escapeHtml(c.id_causa)}" data-type="causa">
        <div class="card-header">
          <div class="badge-cluster">
            <span class="badge badge-corte">RIT ${escapeHtml(c.rit || 'S/R')}</span>
            ${c.ruc ? `<span class="badge badge-tribunal">RUC ${escapeHtml(c.ruc)}</span>` : ''}
            ${c.competencia ? `<span class="badge badge-seal">${escapeHtml(c.competencia)}</span>` : ''}
          </div>
          <time class="badge-date">Ingreso: ${escapeHtml(dateFormatted || c.fecha_ingreso || '2026')}</time>
        </div>

        <h3 class="card-title" onclick="App.openDetail('causa', '${escapeHtml(c.id_causa)}')">
          ${escapeHtml(c.caratulado || 'Causa judicial 2026')}
        </h3>

        <div class="card-parties-row">
          <div class="card-party-col">
            <h4>Demandante / Querellante / Fiscal</h4>
            <p>${escapeHtml(c.demandante_o_fiscal || 'No especificado en carátula')}</p>
          </div>
          <div class="card-party-col party-defendant">
            <h4>Demandado / Imputado</h4>
            <p>${escapeHtml(c.demandado_o_imputado || 'No individualizado')}</p>
          </div>
        </div>

        <div class="card-descriptors">
          <span class="descriptor-label">Tribunal:</span>
          <span class="descriptor-tag">${escapeHtml(c.tribunal || 'PJUD')}</span>
          ${c.procedimiento ? `<span class="descriptor-tag">Proc. ${escapeHtml(c.procedimiento)}</span>` : ''}
          ${c.materia_o_delito ? `<span class="descriptor-tag">${escapeHtml(c.materia_o_delito)}</span>` : ''}
        </div>

        <div class="card-footer">
          <div class="citation-preview" title="${escapeHtml(citation)}">
            ${escapeHtml(citation)}
          </div>
          <div class="card-btn-group">
            <button type="button" class="btn-action" data-citation="${escapeHtml(citation)}" onclick="App.copyCitationFromBtn(this)">
              Copiar Ficha
            </button>
            <button type="button" class="btn-action btn-action-primary" onclick="App.openDetail('causa', '${escapeHtml(c.id_causa)}')">
              Ver Expediente
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // Ficha Bibliográfica: Tribunales Especiales
  function renderEspecialCard(e, selectedId = null) {
    const citation = Citations.generateEspecialCitation(e);
    const dateFormatted = Citations.formatDateCL(e.fecha_dictacion);
    const isSelected = selectedId && String(selectedId) === String(e.id_fallo);

    return `
      <article class="legal-card ${isSelected ? 'is-selected' : ''}" role="listitem" data-id="${escapeHtml(e.id_fallo)}" data-type="especial">
        <div class="card-header">
          <div class="badge-cluster">
            <span class="badge badge-corte">${escapeHtml(e.tribunal || 'Tribunal Especial')}</span>
            ${e.rol_causa ? `<span class="badge badge-seal">Rol ${escapeHtml(e.rol_causa)}</span>` : ''}
            ${e.tipo_procedimiento ? `<span class="badge badge-recurso">${escapeHtml(e.tipo_procedimiento)}</span>` : ''}
          </div>
          <time class="badge-date">${escapeHtml(dateFormatted || e.fecha_dictacion || '')}</time>
        </div>

        <h3 class="card-title" onclick="App.openDetail('especial', '${escapeHtml(e.id_fallo)}')">
          ${escapeHtml(e.caratulado_titulo || 'Resolución Jurisdiccional')}
        </h3>

        ${e.materias_conductas ? `
          <div class="card-descriptors">
            <span class="descriptor-label">Materia / Conducta:</span>
            <span class="descriptor-tag">${escapeHtml(e.materias_conductas)}</span>
          </div>
        ` : ''}

        <p class="card-preview">
          ${escapeHtml(e.doctrina_resumen || 'Sentencia dictada por tribunal de jurisdicción especial con criterios y doctrina vinculante.')}
        </p>

        <div class="card-footer">
          <div class="citation-preview" title="${escapeHtml(citation)}">
            ${escapeHtml(citation)}
          </div>
          <div class="card-btn-group">
            <button type="button" class="btn-action" data-citation="${escapeHtml(citation)}" onclick="App.copyCitationFromBtn(this)">
              Copiar Cita
            </button>
            <button type="button" class="btn-action btn-action-primary" onclick="App.openDetail('especial', '${escapeHtml(e.id_fallo)}')">
              Ver Fallo
            </button>
            ${e.url_origen ? `
              <a href="${escapeHtml(e.url_origen)}" target="_blank" rel="noopener noreferrer" class="btn-action">
                Fuente Oficial ↗
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  // Ficha Bibliográfica: Legislación y Códigos BCN
  function renderLeyCard(l, selectedId = null) {
    const citation = Citations.generateLeyCitation(l);
    const dateFormatted = Citations.formatDateCL(l.fecha_publicacion);
    const isCodigo = l.tipo_norma === 'Código' || (l.titulo_norma && l.titulo_norma.toLowerCase().includes('código'));
    const isSelected = selectedId && String(selectedId) === String(l.id_norma);

    return `
      <article class="legal-card ${isSelected ? 'is-selected' : ''}" role="listitem" data-id="${escapeHtml(l.id_norma)}" data-type="ley">
        <div class="card-header">
          <div class="badge-cluster">
            <span class="badge ${isCodigo ? 'badge-seal' : 'badge-corte'}">${escapeHtml(l.tipo_norma || 'Norma')} ${escapeHtml(l.numero_norma || '')}</span>
            ${l.organismo_emisor ? `<span class="badge badge-tribunal">${escapeHtml(l.organismo_emisor)}</span>` : ''}
            <span class="badge badge-resultado-acogido">Vigente</span>
          </div>
          <time class="badge-date">DO: ${escapeHtml(dateFormatted || l.fecha_publicacion || '')}</time>
        </div>

        <h3 class="card-title" onclick="App.openDetail('ley', '${escapeHtml(l.id_norma)}')">
          ${escapeHtml(l.titulo_norma || l.denominacion_oficial || 'Norma de la República de Chile')}
        </h3>

        ${l.nombres_uso_comun ? `
          <div class="card-descriptors">
            <span class="descriptor-label">Nombre común:</span>
            <span class="descriptor-tag descriptor-tag-accent">${escapeHtml(l.nombres_uso_comun)}</span>
          </div>
        ` : ''}

        <p class="card-preview">
          ${escapeHtml(l.resumen_analitico || l.denominacion_oficial || 'Texto refundido, coordinado y sistematizado de la norma legal en la Biblioteca del Congreso Nacional.')}
        </p>

        <div class="card-footer">
          <div class="citation-preview" title="${escapeHtml(citation)}">
            ${escapeHtml(citation)}
          </div>
          <div class="card-btn-group">
            <button type="button" class="btn-action" data-citation="${escapeHtml(citation)}" onclick="App.copyCitationFromBtn(this)">
              Cita Oficial
            </button>
            <button type="button" class="btn-action btn-action-primary" onclick="App.openDetail('ley', '${escapeHtml(l.id_norma)}')">
              Ver Ficha
            </button>
            ${l.url_leychile ? `
              <a href="${escapeHtml(l.url_leychile)}" target="_blank" rel="noopener noreferrer" class="btn-action">
                LeyChile BCN ↗
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  // Ficha Bibliográfica: Doctrina Administrativa (CGR / SII)
  function renderDoctrinaAdminCard(d, selectedId = null) {
    const citation = Citations.generateDoctrinaAdminCitation(d);
    const dateFormatted = Citations.formatDateCL(d.fecha_documento);
    const isSelected = selectedId && String(selectedId) === String(d.id_documento);

    return `
      <article class="legal-card ${isSelected ? 'is-selected' : ''}" role="listitem" data-id="${escapeHtml(d.id_documento)}" data-type="doctrina-admin">
        <div class="card-header">
          <div class="badge-cluster">
            <span class="badge badge-corte">${escapeHtml(d.organismo_emisor || 'CGR / SII')}</span>
            <span class="badge badge-seal">${escapeHtml(d.tipo_documento || 'Dictamen')} N° ${escapeHtml(d.numero_documento || '')}</span>
            ${d.anio_emision ? `<span class="badge badge-recurso">Año ${escapeHtml(String(d.anio_emision))}</span>` : ''}
          </div>
          <time class="badge-date">${escapeHtml(dateFormatted || d.fecha_documento || '')}</time>
        </div>

        <h3 class="card-title" onclick="App.openDetail('doctrina-admin', '${escapeHtml(d.id_documento)}')">
          ${escapeHtml(d.materia_resumen || 'Pronunciamiento jurídico vinculante')}
        </h3>

        ${d.descriptores_materias ? `
          <div class="card-descriptors">
            <span class="descriptor-label">Descriptores:</span>
            <span class="descriptor-tag">${escapeHtml(d.descriptores_materias)}</span>
          </div>
        ` : ''}

        <p class="card-preview">
          ${escapeHtml(d.extracto_preview || 'Criterio jurisprudencial administrativo sobre aplicación e interpretación de la normativa pública y tributaria.')}
        </p>

        <div class="card-footer">
          <div class="citation-preview" title="${escapeHtml(citation)}">
            ${escapeHtml(citation)}
          </div>
          <div class="card-btn-group">
            <button type="button" class="btn-action" data-citation="${escapeHtml(citation)}" onclick="App.copyCitationFromBtn(this)">
              Copiar Cita
            </button>
            <button type="button" class="btn-action btn-action-primary" onclick="App.openDetail('doctrina-admin', '${escapeHtml(d.id_documento)}')">
              Ver Pronunciamiento
            </button>
            ${d.url_origen ? `
              <a href="${escapeHtml(d.url_origen)}" target="_blank" rel="noopener noreferrer" class="btn-action">
                Enlace Oficial ↗
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  // Ficha Bibliográfica: Doctrina Jurídica (Artículos académicos)
  function renderDoctrinaJuridicaCard(a, selectedId = null) {
    const citation = Citations.generateDoctrinaJuridicaCitation(a);
    const isSelected = selectedId && String(selectedId) === String(a.id_articulo);

    return `
      <article class="legal-card ${isSelected ? 'is-selected' : ''}" role="listitem" data-id="${escapeHtml(a.id_articulo)}" data-type="doctrina-juridica">
        <div class="card-header">
          <div class="badge-cluster">
            <span class="badge badge-corte">${escapeHtml(a.area_derecho || 'Derecho General')}</span>
            ${a.anio_publicacion ? `<span class="badge badge-tribunal">${escapeHtml(String(a.anio_publicacion))}</span>` : ''}
            ${a.citas_recibidas ? `<span class="badge badge-seal">${escapeHtml(String(a.citas_recibidas))} citas</span>` : ''}
          </div>
          <span class="badge-date">${escapeHtml(a.autores || 'Autor')}</span>
        </div>

        <h3 class="card-title" onclick="App.openDetail('doctrina-juridica', '${escapeHtml(a.id_articulo)}')">
          ${escapeHtml(a.titulo || 'Artículo Doctrinal')}
        </h3>

        ${a.revista_o_fuente ? `
          <div class="card-descriptors">
            <span class="descriptor-label">Revista / Editorial:</span>
            <span class="descriptor-tag">${escapeHtml(a.revista_o_fuente)} ${escapeHtml(a.volumen_numero || '')}</span>
          </div>
        ` : ''}

        <p class="card-preview">
          ${escapeHtml(a.resumen_preview || 'Estudio dogmático sobre instituciones de derecho chileno y comparado.')}
        </p>

        <div class="card-footer">
          <div class="citation-preview" title="${escapeHtml(citation)}">
            ${escapeHtml(citation)}
          </div>
          <div class="card-btn-group">
            <button type="button" class="btn-action" data-citation="${escapeHtml(citation)}" onclick="App.copyCitationFromBtn(this)">
              Cita Bibliográfica
            </button>
            <button type="button" class="btn-action btn-action-primary" onclick="App.openDetail('doctrina-juridica', '${escapeHtml(a.id_articulo)}')">
              Ver Resumen
            </button>
            ${a.doi_o_url ? `
              <a href="${escapeHtml(a.doi_o_url)}" target="_blank" rel="noopener noreferrer" class="btn-action">
                DOI / Web ↗
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  // Ficha Bibliográfica: Formatos Forenses y Modelos de Escritos
  function renderFormatoCard(fmt, selectedId = null) {
    const isSelected = selectedId && String(selectedId) === String(fmt.id_formato);

    return `
      <article class="legal-card ${isSelected ? 'is-selected' : ''}" role="listitem" data-id="${escapeHtml(fmt.id_formato)}" data-type="formato">
        <div class="card-header">
          <div class="badge-cluster">
            <span class="badge badge-corte">${escapeHtml(fmt.categoria || 'Civil')}</span>
            ${fmt.subcategoria ? `<span class="badge badge-tribunal">${escapeHtml(fmt.subcategoria)}</span>` : ''}
            <span class="badge badge-seal">${escapeHtml(fmt.tipo_documento || 'Escrito')}</span>
          </div>
          <span class="badge-date">Tribunal: ${escapeHtml(fmt.tribunal_sugerido || 'Letras')}</span>
        </div>

        <h3 class="card-title" onclick="App.openDetail('formato', '${escapeHtml(fmt.id_formato)}')">
          ${escapeHtml(fmt.titulo || 'Modelo de Escrito Judicial')}
        </h3>

        ${fmt.sumilla ? `
          <div class="card-descriptors">
            <span class="descriptor-label">Sumilla:</span>
            <span class="descriptor-tag descriptor-tag-mono">EN LO PRINCIPAL: ${escapeHtml(fmt.sumilla)}</span>
          </div>
        ` : ''}

        <p class="card-preview">
          ${escapeHtml(fmt.descripcion || fmt.preview_texto || 'Plantilla jurídica estructurada conforme a reglas de procedimiento civil, penal o laboral de Chile.')}
        </p>

        <div class="card-footer">
          <span class="citation-preview">
            Normas: ${escapeHtml(fmt.normativa_asociada || 'Código de Procedimiento')}
          </span>
          <div class="card-btn-group">
            <button type="button" class="btn-action btn-action-primary" onclick="App.openDetail('formato', '${escapeHtml(fmt.id_formato)}')">
              Abrir y Editar Escrito
            </button>
          </div>
        </div>
      </article>
    `;
  }

  return {
    showToast,
    renderSkeletons,
    escapeHtml,
    renderFalloCard,
    renderCausaCard,
    renderEspecialCard,
    renderLeyCard,
    renderDoctrinaAdminCard,
    renderDoctrinaJuridicaCard,
    renderFormatoCard
  };
})();
