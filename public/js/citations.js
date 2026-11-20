// Generador de Citas Canónicas Forenses y Utilidades Procesales
const Citations = (() => {

  function formatDateCL(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
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
    generateFalloCitation,
    generateCausaCitation,
    generateEspecialCitation,
    generateLeyCitation,
    generateDoctrinaAdminCitation,
    generateDoctrinaJuridicaCitation,
    copyToClipboard,
    downloadTextFile
  };
})();
