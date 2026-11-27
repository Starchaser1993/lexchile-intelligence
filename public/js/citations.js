// Generador de Citas Canónicas Forenses y Utilidades Procesales
const Citations = (() => {

  function formatDateCL(dateStr) {
    if (!dateStr) return '';
    try {
      const clean = String(dateStr).split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function formatDateShortCL(dateStr) {
    if (!dateStr) return '';
    try {
      const clean = String(dateStr).split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function abbreviateCourt(name) {
    if (!name) return 'PJUD';
    const n = String(name).trim();
    if (/corte suprema/i.test(n)) return 'CS';
    if (/corte de apelaciones de /i.test(n)) {
      return 'ICA ' + n.replace(/corte de apelaciones de /i, '').trim();
    }
    if (/^c\.a\. de /i.test(n)) {
      return 'ICA ' + n.replace(/^c\.a\. de /i, '').trim();
    }
    if (/constitucional/i.test(n)) return 'TC';
    if (/libre competencia/i.test(n)) return 'TDLC';
    if (/ambiental/i.test(n)) return 'TA';
    return n;
  }

  function generateFalloCitation(f) {
    if (f.cita_jurisprudencial && f.cita_jurisprudencial.trim().length > 10) {
      return f.cita_jurisprudencial;
    }
    const corte = f.corte || f.tribunal || 'Poder Judicial de Chile';
    const sala = f.sala ? `, ${f.sala}` : '';
    const rol = f.rol_numero ? `, Rol N° ${f.rol_numero}` : '';
    const fecha = f.fecha_sentencia ? `, ${formatDateCL(f.fecha_sentencia)}` : '';
    const caratulado = f.caratulado ? `, «${f.caratulado}»` : '';
    const recurso = f.tipo_recurso ? `, recurso de ${f.tipo_recurso}` : '';
    return `${corte}${sala}${rol}${fecha}${caratulado}${recurso}.`;
  }

  function generateCausaCitation(c) {
    const trib = c.tribunal || 'Tribunal de Justicia';
    const rit = c.rit ? `RIT ${c.rit}` : '';
    const ruc = c.ruc ? ` (RUC ${c.ruc})` : '';
    const caratulado = c.caratulado ? `, «${c.caratulado}»` : '';
    const materia = c.materia_o_delito ? `, materia ${c.materia_o_delito}` : '';
    return `${trib}, ${rit}${ruc}${caratulado}${materia}.`;
  }

  function generateEspecialCitation(e) {
    const trib = e.tribunal || 'Tribunal Especial';
    const rol = e.rol_causa ? `, Rol N° ${e.rol_causa}` : '';
    const fecha = e.fecha_dictacion ? `, ${formatDateCL(e.fecha_dictacion)}` : '';
    const caratulado = e.caratulado_titulo ? `, «${e.caratulado_titulo}»` : '';
    return `${trib}${rol}${fecha}${caratulado}.`;
  }

  function generateLeyCitation(l) {
    const tipo = l.tipo_norma || 'Norma';
    const num = l.numero_norma ? ` N° ${l.numero_norma}` : '';
    const titulo = l.titulo_norma ? `, «${l.titulo_norma}»` : '';
    const fecha = l.fecha_publicacion ? `, publicada con fecha ${formatDateCL(l.fecha_publicacion)}` : '';
    const org = l.organismo_emisor ? `, ${l.organismo_emisor}` : '';
    return `${tipo}${num}${titulo}${fecha}${org}.`;
  }

  function generateDoctrinaAdminCitation(d) {
    const org = d.organismo_emisor || 'Organismo Regulador';
    const tipo = d.tipo_documento || 'Dictamen';
    const num = d.numero_documento ? ` N° ${d.numero_documento}` : '';
    const fecha = d.fecha_documento ? `, de ${formatDateCL(d.fecha_documento)}` : '';
    const mat = d.materia_resumen ? `, sobre «${d.materia_resumen}»` : '';
    return `${org}, ${tipo}${num}${fecha}${mat}.`;
  }

  function generateDoctrinaJuridicaCitation(a) {
    const autores = a.autores || 'Autor';
    const anio = a.anio_publicacion ? ` (${a.anio_publicacion})` : '';
    const titulo = a.titulo ? `. «${a.titulo}»` : '';
    const fuente = a.revista_o_fuente ? `, ${a.revista_o_fuente}` : '';
    const vol = a.volumen_numero ? `, ${a.volumen_numero}` : '';
    return `${autores}${anio}${titulo}${fuente}${vol}.`;
  }

  // Formateador multi-estilo para el Drawer de Lectura (Forense, Académica, Abreviada)
  function formatCitationByStyle(type, data, style = 'forense') {
    if (!data) return '';

    if (type === 'fallo') {
      if (style === 'abreviada') {
        const c = abbreviateCourt(data.corte || data.tribunal);
        const rol = data.rol_numero ? `Rol ${data.rol_numero}` : 'S/R';
        const fecha = formatDateShortCL(data.fecha_sentencia);
        return `${c}, ${rol}${fecha ? `, ${fecha}` : ''}${data.resultado_recurso ? ` (${data.resultado_recurso})` : ''}.`;
      }
      if (style === 'academica') {
        const corte = data.corte || 'Poder Judicial de Chile';
        const fecha = formatDateCL(data.fecha_sentencia);
        const rol = data.rol_numero ? `Rol N° ${data.rol_numero}` : '';
        const carat = data.caratulado ? `, "${data.caratulado}"` : '';
        return `${corte}${data.sala ? ` (${data.sala})` : ''}, sentencia de ${fecha || 'fecha s/i'}, ${rol}${carat}.`;
      }
      return generateFalloCitation(data);
    }

    if (type === 'causa') {
      if (style === 'abreviada') {
        return `${data.tribunal || 'Tribunal'}, RIT ${data.rit || 'S/R'}${data.ruc ? ` / RUC ${data.ruc}` : ''}.`;
      }
      if (style === 'academica') {
        const fecha = formatDateCL(data.fecha_ingreso);
        return `${data.tribunal || 'Tribunal de Justicia'}, causa "${data.caratulado || 'S/C'}", RIT ${data.rit || 'S/R'}${fecha ? `, ingresada el ${fecha}` : ''}.`;
      }
      return generateCausaCitation(data);
    }

    if (type === 'especial') {
      if (style === 'abreviada') {
        const c = abbreviateCourt(data.tribunal);
        const fecha = formatDateShortCL(data.fecha_dictacion);
        return `${c}, Rol ${data.rol_causa || 'S/R'}${fecha ? `, ${fecha}` : ''}.`;
      }
      if (style === 'academica') {
        const fecha = formatDateCL(data.fecha_dictacion);
        return `${data.tribunal || 'Tribunal Especial'}, sentencia de ${fecha || 'fecha s/i'}, Rol N° ${data.rol_causa || 'S/R'}, "${data.caratulado_titulo || ''}".`;
      }
      return generateEspecialCitation(data);
    }

    if (type === 'ley') {
      if (style === 'abreviada') {
        return `${data.tipo_norma || 'Norma'} N° ${data.numero_norma || 'S/N'} (DO ${formatDateShortCL(data.fecha_publicacion) || 's/f'}).`;
      }
      if (style === 'academica') {
        return `Chile, ${data.organismo_emisor || 'Congreso Nacional'}, ${data.tipo_norma || 'Ley'} N° ${data.numero_norma || 'S/N'}, "${data.titulo_norma || data.denominacion_oficial || ''}", Diario Oficial, ${formatDateCL(data.fecha_publicacion) || 's/f'}.`;
      }
      return generateLeyCitation(data);
    }

    if (type === 'doctrina-admin') {
      if (style === 'abreviada') {
        const org = /contralor/i.test(data.organismo_emisor || '') ? 'CGR' : (/impuestos/i.test(data.organismo_emisor || '') ? 'SII' : (data.organismo_emisor || 'Org.'));
        return `${org}, ${data.tipo_documento || 'Dictamen'} N° ${data.numero_documento || 'S/N'}, ${formatDateShortCL(data.fecha_documento) || data.anio_emision || ''}.`;
      }
      if (style === 'academica') {
        return `${data.organismo_emisor || 'Organismo'}, ${data.tipo_documento || 'Dictamen'} N° ${data.numero_documento || 'S/N'} (${formatDateCL(data.fecha_documento) || data.anio_emision || ''}), "${data.materia_resumen || ''}".`;
      }
      return generateDoctrinaAdminCitation(data);
    }

    if (type === 'doctrina-juridica') {
      if (style === 'abreviada') {
        return `${data.autores || 'Autor'} (${data.anio_publicacion || 's/f'}), «${data.titulo || ''}».`;
      }
      if (style === 'academica') {
        return `${data.autores || 'Autor'}, "${data.titulo || ''}", en ${data.revista_o_fuente || 'Revista Jurídica'}${data.volumen_numero ? `, ${data.volumen_numero}` : ''} (${data.anio_publicacion || 's/f'}).`;
      }
      return generateDoctrinaJuridicaCitation(data);
    }

    if (type === 'formato') {
      if (style === 'abreviada') {
        return `Formato Forense: ${data.titulo || 'Escrito'} (${data.categoria || 'General'}).`;
      }
      return `Escrito forense: «${data.titulo || 'Modelo de Escrito'}». Normativa asociada: ${data.normativa_asociada || 'Reglas procesales vigentes'}.`;
    }

    return '';
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  }

  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  return {
    formatDateCL,
    formatDateShortCL,
    generateFalloCitation,
    generateCausaCitation,
    generateEspecialCitation,
    generateLeyCitation,
    generateDoctrinaAdminCitation,
    generateDoctrinaJuridicaCitation,
    formatCitationByStyle,
    copyToClipboard,
    downloadTextFile
  };
})();
