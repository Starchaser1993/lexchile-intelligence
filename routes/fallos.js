const express = require('express');
const router = express.Router();
const { query } = require('../services/bigquery');

// GET /api/fallos - Búsqueda de jurisprudencia judicial 2026
router.get('/', async (req, res) => {
  try {
    const {
      q,
      corte,
      sala,
      recurso,
      materia,
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
        LOWER(caratulado) LIKE @qTerm OR
        LOWER(rol_numero) LIKE @qTerm OR
        LOWER(materia) LIKE @qTerm OR
        LOWER(descriptores_juridicos) LIKE @qTerm OR
        LOWER(cita_jurisprudencial) LIKE @qTerm OR
        LOWER(texto_sentencia_preview) LIKE @qTerm OR
        LOWER(ministros_o_jueces) LIKE @qTerm
      )`);
      params.qTerm = term;
    }

    if (corte && corte.trim()) {
      conditions.push(`LOWER(corte) LIKE @corteTerm`);
      params.corteTerm = `%${corte.trim().toLowerCase()}%`;
    }

    if (sala && sala.trim()) {
      conditions.push(`LOWER(sala) LIKE @salaTerm`);
      params.salaTerm = `%${sala.trim().toLowerCase()}%`;
    }

    if (recurso && recurso.trim()) {
      conditions.push(`LOWER(tipo_recurso) LIKE @recursoTerm`);
      params.recursoTerm = `%${recurso.trim().toLowerCase()}%`;
    }

    if (materia && materia.trim()) {
      conditions.push(`LOWER(materia) LIKE @materiaTerm`);
      params.materiaTerm = `%${materia.trim().toLowerCase()}%`;
    }

    if (resultado && resultado.trim()) {
      conditions.push(`LOWER(resultado_recurso) LIKE @resultadoTerm`);
      params.resultadoTerm = `%${resultado.trim().toLowerCase()}%`;
    }

    if (fecha_desde && fecha_desde.trim()) {
      conditions.push(`fecha_sentencia >= @fechaDesde`);
      params.fechaDesde = fecha_desde.trim();
    }

    if (fecha_hasta && fecha_hasta.trim()) {
      conditions.push(`fecha_sentencia <= @fechaHasta`);
      params.fechaHasta = fecha_hasta.trim();
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM \`fallos-juridicos.fallos_publicos.sentencias_2026\`
      ${whereClause}
    `;

    // Data query
    const dataSql = `
      SELECT
        id_fallo,
        tribunal,
        tipo_tribunal,
        corte,
        sala,
        rol_numero,
        caratulado,
        CAST(fecha_sentencia AS STRING) as fecha_sentencia,
        tipo_recurso,
        materia,
        resultado_recurso,
        ministros_o_jueces,
        descriptores_juridicos,
        cita_jurisprudencial,
        texto_sentencia_preview,
        url_acceso_sentencia
      FROM \`fallos-juridicos.fallos_publicos.sentencias_2026\`
      ${whereClause}
      ORDER BY fecha_sentencia DESC
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
    console.error('Error in /api/fallos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fallos/filters - Valores únicos para filtros rápidos
router.get('/filters', async (req, res) => {
  try {
    const sql = `
      WITH cortes AS (
        SELECT corte, COUNT(*) as cnt
        FROM \`fallos-juridicos.fallos_publicos.sentencias_2026\`
        WHERE corte IS NOT NULL AND corte != ''
        GROUP BY corte
        ORDER BY cnt DESC
        LIMIT 20
      ),
      recursos AS (
        SELECT tipo_recurso, COUNT(*) as cnt
        FROM \`fallos-juridicos.fallos_publicos.sentencias_2026\`
        WHERE tipo_recurso IS NOT NULL AND tipo_recurso != ''
        GROUP BY tipo_recurso
        ORDER BY cnt DESC
        LIMIT 15
      ),
      materias AS (
        SELECT materia, COUNT(*) as cnt
        FROM \`fallos-juridicos.fallos_publicos.sentencias_2026\`
        WHERE materia IS NOT NULL AND materia != ''
        GROUP BY materia
        ORDER BY cnt DESC
        LIMIT 20
      )
      SELECT 
        (SELECT TO_JSON_STRING(ARRAY_AGG(STRUCT(corte as label, cnt as count))) FROM cortes) as cortes_json,
        (SELECT TO_JSON_STRING(ARRAY_AGG(STRUCT(tipo_recurso as label, cnt as count))) FROM recursos) as recursos_json,
        (SELECT TO_JSON_STRING(ARRAY_AGG(STRUCT(materia as label, cnt as count))) FROM materias) as materias_json
    `;

    const { rows } = await query(sql);
    const filterData = {
      cortes: JSON.parse(rows[0].cortes_json || '[]'),
      recursos: JSON.parse(rows[0].recursos_json || '[]'),
      materias: JSON.parse(rows[0].materias_json || '[]')
    };

    res.json({ success: true, filters: filterData });
  } catch (err) {
    console.error('Error in /api/fallos/filters:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/fallos/:id - Detalle completo de una sentencia
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM \`fallos-juridicos.fallos_publicos.sentencias_2026\`
      WHERE id_fallo = @id
      LIMIT 1
    `;
    const { rows } = await query(sql, { id });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Fallo no encontrado' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error in /api/fallos/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
