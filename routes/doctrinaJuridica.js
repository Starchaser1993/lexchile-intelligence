const express = require('express');
const router = express.Router();
const { query } = require('../services/bigquery');

// GET /api/doctrina-juridica - Artículos Doctrinales y Académicos
router.get('/', async (req, res) => {
  try {
    const {
      q,
      area_derecho,
      autor,
      revista,
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
        LOWER(titulo) LIKE @qTerm OR
        LOWER(autores) LIKE @qTerm OR
        LOWER(resumen_abstract) LIKE @qTerm OR
        LOWER(palabras_clave) LIKE @qTerm OR
        LOWER(revista_o_fuente) LIKE @qTerm
      )`);
      params.qTerm = term;
    }

    if (area_derecho && area_derecho.trim()) {
      conditions.push(`LOWER(area_derecho) LIKE @areaTerm`);
      params.areaTerm = `%${area_derecho.trim().toLowerCase()}%`;
    }

    if (autor && autor.trim()) {
      conditions.push(`LOWER(autores) LIKE @autorTerm`);
      params.autorTerm = `%${autor.trim().toLowerCase()}%`;
    }

    if (revista && revista.trim()) {
      conditions.push(`LOWER(revista_o_fuente) LIKE @revTerm`);
      params.revTerm = `%${revista.trim().toLowerCase()}%`;
    }

    if (anio && parseInt(anio, 10)) {
      conditions.push(`anio_publicacion = @anioTerm`);
      params.anioTerm = parseInt(anio, 10);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM \`fallos-juridicos.doctrina_juridica.articulos_doctrina\`
      ${whereClause}
    `;

    const dataSql = `
      SELECT
        id_articulo,
        titulo,
        autores,
        revista_o_fuente,
        facultad_o_editorial,
        anio_publicacion,
        volumen_numero,
        area_derecho,
        SUBSTR(resumen_abstract, 1, 500) as resumen_preview,
        palabras_clave,
        doi_o_url,
        citas_recibidas
      FROM \`fallos-juridicos.doctrina_juridica.articulos_doctrina\`
      ${whereClause}
      ORDER BY anio_publicacion DESC, citas_recibidas DESC
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
    console.error('Error in /api/doctrina-juridica:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/doctrina-juridica/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM \`fallos-juridicos.doctrina_juridica.articulos_doctrina\`
      WHERE id_articulo = @id
      LIMIT 1
    `;
    const { rows } = await query(sql, { id });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Artículo no encontrado' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error in /api/doctrina-juridica/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
