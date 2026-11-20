const express = require('express');
const router = express.Router();
const { query } = require('../services/bigquery');

// GET /api/leyes - Búsqueda en Legislación Vigente y Códigos BCN
router.get('/', async (req, res) => {
  try {
    const {
      q,
      tipo_norma,
      organismo,
      numero,
      estado_vigencia,
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
        LOWER(titulo_norma) LIKE @qTerm OR
        LOWER(nombres_uso_comun) LIKE @qTerm OR
        LOWER(denominacion_oficial) LIKE @qTerm OR
        LOWER(numero_norma) LIKE @qTerm OR
        LOWER(resumen_analitico) LIKE @qTerm
      )`);
      params.qTerm = term;
    }

    if (tipo_norma && tipo_norma.trim()) {
      conditions.push(`LOWER(tipo_norma) LIKE @tipoTerm`);
      params.tipoTerm = `%${tipo_norma.trim().toLowerCase()}%`;
    }

    if (organismo && organismo.trim()) {
      conditions.push(`LOWER(organismo_emisor) LIKE @orgTerm`);
      params.orgTerm = `%${organismo.trim().toLowerCase()}%`;
    }

    if (numero && numero.trim()) {
      conditions.push(`numero_norma = @numTerm`);
      params.numTerm = numero.trim();
    }

    if (estado_vigencia && estado_vigencia.trim()) {
      conditions.push(`LOWER(estado_vigencia) = @vigTerm`);
      params.vigTerm = estado_vigencia.trim().toLowerCase();
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM \`fallos-juridicos.legislacion_chile.normas_vigentes\`
      ${whereClause}
    `;

    const dataSql = `
      SELECT
        id_norma,
        tipo_norma,
        numero_norma,
        denominacion_oficial,
        titulo_norma,
        nombres_uso_comun,
        organismo_emisor,
        CAST(fecha_promulgacion AS STRING) as fecha_promulgacion,
        CAST(fecha_publicacion AS STRING) as fecha_publicacion,
        CAST(fecha_vigencia AS STRING) as fecha_vigencia,
        estado_vigencia,
        tipo_version,
        resumen_analitico,
        url_leychile
      FROM \`fallos-juridicos.legislacion_chile.normas_vigentes\`
      ${whereClause}
      ORDER BY 
        CASE WHEN tipo_norma = 'Código' THEN 0 ELSE 1 END,
        fecha_publicacion DESC
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
    console.error('Error in /api/leyes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/leyes/codigos - Acceso directo a los Códigos de la República
router.get('/codigos', async (req, res) => {
  try {
    const sql = `
      SELECT 
        id_norma,
        numero_norma,
        titulo_norma,
        nombres_uso_comun,
        url_leychile,
        resumen_analitico
      FROM \`fallos-juridicos.legislacion_chile.normas_vigentes\`
      WHERE tipo_norma = 'Código' OR LOWER(titulo_norma) LIKE '%código%'
      ORDER BY titulo_norma ASC
      LIMIT 25
    `;
    const { rows } = await query(sql);
    res.json({ success: true, codigos: rows });
  } catch (err) {
    console.error('Error in /api/leyes/codigos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/leyes/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM \`fallos-juridicos.legislacion_chile.normas_vigentes\`
      WHERE id_norma = @id
      LIMIT 1
    `;
    const { rows } = await query(sql, { id });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Norma no encontrada' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error in /api/leyes/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
