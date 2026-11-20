const express = require('express');
const router = express.Router();
const { query } = require('../services/bigquery');

// GET /api/especiales - Sentencias de Tribunales Especiales (TC, TDLC, 2TA)
router.get('/', async (req, res) => {
  try {
    const {
      q,
      tribunal,
      procedimiento,
      resultado,
      fecha_desde,
      fecha_hasta,
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
        LOWER(caratulado_titulo) LIKE @qTerm OR
        LOWER(rol_causa) LIKE @qTerm OR
        LOWER(materias_conductas) LIKE @qTerm OR
        LOWER(normas_invocadas) LIKE @qTerm OR
        LOWER(doctrina_resumen) LIKE @qTerm OR
        LOWER(palabras_clave) LIKE @qTerm
      )`);
      params.qTerm = term;
    }

    if (tribunal && tribunal.trim()) {
      conditions.push(`LOWER(tribunal) LIKE @tribTerm`);
      params.tribTerm = `%${tribunal.trim().toLowerCase()}%`;
    }

    if (procedimiento && procedimiento.trim()) {
      conditions.push(`LOWER(tipo_procedimiento) LIKE @procTerm`);
      params.procTerm = `%${procedimiento.trim().toLowerCase()}%`;
    }

    if (resultado && resultado.trim()) {
      conditions.push(`LOWER(resultado_decision) LIKE @resTerm`);
      params.resTerm = `%${resultado.trim().toLowerCase()}%`;
    }

    if (fecha_desde && fecha_desde.trim()) {
      conditions.push(`fecha_dictacion >= @fechaDesde`);
      params.fechaDesde = fecha_desde.trim();
    }

    if (fecha_hasta && fecha_hasta.trim()) {
      conditions.push(`fecha_dictacion <= @fechaHasta`);
      params.fechaHasta = fecha_hasta.trim();
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM \`fallos-juridicos.tribunales_especiales.sentencias_especiales\`
      ${whereClause}
    `;

    const dataSql = `
      SELECT
        id_fallo,
        tribunal,
        rol_causa,
        tipo_procedimiento,
        caratulado_titulo,
        CAST(fecha_dictacion AS STRING) as fecha_dictacion,
        resultado_decision,
        materias_conductas,
        normas_invocadas,
        doctrina_resumen,
        palabras_clave,
        url_origen
      FROM \`fallos-juridicos.tribunales_especiales.sentencias_especiales\`
      ${whereClause}
      ORDER BY fecha_dictacion DESC
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
    console.error('Error in /api/especiales:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/especiales/filters
router.get('/filters', async (req, res) => {
  try {
    const sql = `
      SELECT tribunal, COUNT(*) as cnt
      FROM \`fallos-juridicos.tribunales_especiales.sentencias_especiales\`
      GROUP BY tribunal
      ORDER BY cnt DESC
    `;
    const { rows } = await query(sql);
    res.json({
      success: true,
      filters: {
        tribunales: rows.map(r => ({ label: r.tribunal, count: parseInt(r.cnt, 10) }))
      }
    });
  } catch (err) {
    console.error('Error in /api/especiales/filters:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/especiales/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM \`fallos-juridicos.tribunales_especiales.sentencias_especiales\`
      WHERE id_fallo = @id
      LIMIT 1
    `;
    const { rows } = await query(sql, { id });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sentencia especial no encontrada' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error in /api/especiales/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
