const express = require('express');
const router = express.Router();
const { query } = require('../services/bigquery');

// GET /api/causas - Búsqueda de expedientes y causas judiciales 2026
router.get('/', async (req, res) => {
  try {
    const {
      q,
      rit,
      ruc,
      tribunal,
      corte,
      competencia,
      procedimiento,
      parte,
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
        LOWER(rit) LIKE @qTerm OR
        LOWER(ruc) LIKE @qTerm OR
        LOWER(demandante_o_fiscal) LIKE @qTerm OR
        LOWER(demandado_o_imputado) LIKE @qTerm OR
        LOWER(materia_o_delito) LIKE @qTerm OR
        LOWER(tribunal) LIKE @qTerm
      )`);
      params.qTerm = term;
    }

    if (rit && rit.trim()) {
      conditions.push(`LOWER(rit) LIKE @ritTerm`);
      params.ritTerm = `%${rit.trim().toLowerCase()}%`;
    }

    if (ruc && ruc.trim()) {
      conditions.push(`LOWER(ruc) LIKE @rucTerm`);
      params.rucTerm = `%${ruc.trim().toLowerCase()}%`;
    }

    if (tribunal && tribunal.trim()) {
      conditions.push(`LOWER(tribunal) LIKE @tribunalTerm`);
      params.tribunalTerm = `%${tribunal.trim().toLowerCase()}%`;
    }

    if (corte && corte.trim()) {
      conditions.push(`LOWER(corte) LIKE @corteTerm`);
      params.corteTerm = `%${corte.trim().toLowerCase()}%`;
    }

    if (competencia && competencia.trim()) {
      conditions.push(`LOWER(competencia) LIKE @compTerm`);
      params.compTerm = `%${competencia.trim().toLowerCase()}%`;
    }

    if (procedimiento && procedimiento.trim()) {
      conditions.push(`LOWER(procedimiento) LIKE @procTerm`);
      params.procTerm = `%${procedimiento.trim().toLowerCase()}%`;
    }

    if (parte && parte.trim()) {
      const parteTerm = `%${parte.trim().toLowerCase()}%`;
      conditions.push(`(LOWER(demandante_o_fiscal) LIKE @parteTerm OR LOWER(demandado_o_imputado) LIKE @parteTerm)`);
      params.parteTerm = parteTerm;
    }

    if (fecha_desde && fecha_desde.trim()) {
      conditions.push(`fecha_ingreso >= @fechaDesde`);
      params.fechaDesde = fecha_desde.trim();
    }

    if (fecha_hasta && fecha_hasta.trim()) {
      conditions.push(`fecha_ingreso <= @fechaHasta`);
      params.fechaHasta = fecha_hasta.trim();
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM \`fallos-juridicos.causas.causas_2026\`
      ${whereClause}
    `;

    const dataSql = `
      SELECT
        id_causa,
        rit,
        ruc,
        tribunal,
        tipo_tribunal,
        corte,
        competencia,
        caratulado,
        demandante_o_fiscal,
        demandado_o_imputado,
        materia_o_delito,
        procedimiento,
        jueces_o_ministros,
        CAST(fecha_ingreso AS STRING) as fecha_ingreso,
        estado_causa,
        url_expediente
      FROM \`fallos-juridicos.causas.causas_2026\`
      ${whereClause}
      ORDER BY fecha_ingreso DESC
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
    console.error('Error in /api/causas:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/causas/filters - Filtros rápidos para causas
router.get('/filters', async (req, res) => {
  try {
    const sql = `
      WITH competencias AS (
        SELECT competencia, COUNT(*) as cnt
        FROM \`fallos-juridicos.causas.causas_2026\`
        WHERE competencia IS NOT NULL AND competencia != ''
        GROUP BY competencia
        ORDER BY cnt DESC
      ),
      tribunales AS (
        SELECT tribunal, COUNT(*) as cnt
        FROM \`fallos-juridicos.causas.causas_2026\`
        WHERE tribunal IS NOT NULL AND tribunal != ''
        GROUP BY tribunal
        ORDER BY cnt DESC
        LIMIT 20
      ),
      procedimientos AS (
        SELECT procedimiento, COUNT(*) as cnt
        FROM \`fallos-juridicos.causas.causas_2026\`
        WHERE procedimiento IS NOT NULL AND procedimiento != ''
        GROUP BY procedimiento
        ORDER BY cnt DESC
        LIMIT 15
      )
      SELECT 
        (SELECT TO_JSON_STRING(ARRAY_AGG(STRUCT(competencia as label, cnt as count))) FROM competencias) as comp_json,
        (SELECT TO_JSON_STRING(ARRAY_AGG(STRUCT(tribunal as label, cnt as count))) FROM tribunales) as trib_json,
        (SELECT TO_JSON_STRING(ARRAY_AGG(STRUCT(procedimiento as label, cnt as count))) FROM procedimientos) as proc_json
    `;

    const { rows } = await query(sql);
    const filterData = {
      competencias: JSON.parse(rows[0].comp_json || '[]'),
      tribunales: JSON.parse(rows[0].trib_json || '[]'),
      procedimientos: JSON.parse(rows[0].proc_json || '[]')
    };

    res.json({ success: true, filters: filterData });
  } catch (err) {
    console.error('Error in /api/causas/filters:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/causas/:id - Detalle completo de una causa
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM \`fallos-juridicos.causas.causas_2026\`
      WHERE id_causa = @id
      LIMIT 1
    `;
    const { rows } = await query(sql, { id });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Causa no encontrada' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error in /api/causas/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
