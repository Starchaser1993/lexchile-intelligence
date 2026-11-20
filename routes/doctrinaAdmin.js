const express = require('express');
const router = express.Router();
const { query } = require('../services/bigquery');

// GET /api/doctrina-admin - Dictámenes CGR y Oficios/Circulares SII
router.get('/', async (req, res) => {
  try {
    const {
      q,
      organismo,
      tipo_documento,
      numero,
      anio,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = {};

    if (q && q.trim()) {
      const term = `%${q.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(materia_resumen) LIKE @qTerm OR
        LOWER(descriptores_materias) LIKE @qTerm OR
        LOWER(numero_documento) LIKE @qTerm OR
        LOWER(fuentes_legales) LIKE @qTerm OR
        LOWER(destinatarios_o_partes) LIKE @qTerm OR
        LOWER(texto_completo_o_extracto) LIKE @qTerm
      )`);
      params.qTerm = term;
    }

    if (organismo && organismo.trim()) {
      conditions.push(`LOWER(organismo_emisor) LIKE @orgTerm`);
      params.orgTerm = `%${organismo.trim().toLowerCase()}%`;
    }

    if (tipo_documento && tipo_documento.trim()) {
      conditions.push(`LOWER(tipo_documento) LIKE @tipoTerm`);
      params.tipoTerm = `%${tipo_documento.trim().toLowerCase()}%`;
    }

    if (numero && numero.trim()) {
      conditions.push(`LOWER(numero_documento) LIKE @numTerm`);
      params.numTerm = `%${numero.trim().toLowerCase()}%`;
    }

    if (anio && parseInt(anio, 10)) {
      conditions.push(`anio_emision = @anioTerm`);
      params.anioTerm = parseInt(anio, 10);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM \`fallos-juridicos.doctrina_administrativa.dictamenes_y_resoluciones\`
      ${whereClause}
    `;

    const dataSql = `
      SELECT
        id_documento,
        organismo_emisor,
        tipo_documento,
        numero_documento,
        CAST(fecha_documento AS STRING) as fecha_documento,
        anio_emision,
        materia_resumen,
        descriptores_materias,
        fuentes_legales,
        destinatarios_o_partes,
        estado_criterio,
        SUBSTR(texto_completo_o_extracto, 1, 600) as extracto_preview,
        url_origen
      FROM \`fallos-juridicos.doctrina_administrativa.dictamenes_y_resoluciones\`
      ${whereClause}
      ORDER BY fecha_documento DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countSql, params),
      query(dataSql, params)
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages,
      limit: limitNum,
      cached: dataResult.cached,
      data: dataResult.rows
    });
  } catch (err) {
    console.error('Error in /api/doctrina-admin:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/doctrina-admin/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM \`fallos-juridicos.doctrina_administrativa.dictamenes_y_resoluciones\`
      WHERE id_documento = @id
      LIMIT 1
    `;
    const { rows } = await query(sql, { id });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Documento administrativo no encontrado' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error in /api/doctrina-admin/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
