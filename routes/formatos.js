const express = require('express');
const router = express.Router();
const { query } = require('../services/bigquery');

// GET /api/formatos - Modelos y Escritos Procesales Forenses
router.get('/', async (req, res) => {
  try {
    const {
      q,
      categoria,
      subcategoria,
      tipo_documento,
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
        LOWER(sumilla) LIKE @qTerm OR
        LOWER(descripcion) LIKE @qTerm OR
        LOWER(normativa_asociada) LIKE @qTerm OR
        LOWER(palabras_clave) LIKE @qTerm
      )`);
      params.qTerm = term;
    }

    if (categoria && categoria.trim()) {
      conditions.push(`LOWER(categoria) LIKE @catTerm`);
      params.catTerm = `%${categoria.trim().toLowerCase()}%`;
    }

    if (subcategoria && subcategoria.trim()) {
      conditions.push(`LOWER(subcategoria) LIKE @subcatTerm`);
      params.subcatTerm = `%${subcategoria.trim().toLowerCase()}%`;
    }

    if (tipo_documento && tipo_documento.trim()) {
      conditions.push(`LOWER(tipo_documento) LIKE @tipoTerm`);
      params.tipoTerm = `%${tipo_documento.trim().toLowerCase()}%`;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM \`fallos-juridicos.formatos_juridicos.plantillas_forenses\`
      ${whereClause}
    `;

    const dataSql = `
      SELECT
        id_formato,
        titulo,
        categoria,
        subcategoria,
        tipo_documento,
        tribunal_sugerido,
        normativa_asociada,
        sumilla,
        descripcion,
        variables_requeridas,
        palabras_clave,
        SUBSTR(contenido_template, 1, 300) as preview_texto
      FROM \`fallos-juridicos.formatos_juridicos.plantillas_forenses\`
      ${whereClause}
      ORDER BY categoria ASC, titulo ASC
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
    console.error('Error in /api/formatos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/formatos/categorias - Categorías disponibles
router.get('/categorias', async (req, res) => {
  try {
    const sql = `
      SELECT categoria, COUNT(*) as cnt
      FROM \`fallos-juridicos.formatos_juridicos.plantillas_forenses\`
      GROUP BY categoria
      ORDER BY cnt DESC
    `;
    const { rows } = await query(sql);
    res.json({ success: true, categorias: rows });
  } catch (err) {
    console.error('Error in /api/formatos/categorias:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/formatos/:id - Formato completo editable
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT *
      FROM \`fallos-juridicos.formatos_juridicos.plantillas_forenses\`
      WHERE id_formato = @id
      LIMIT 1
    `;
    const { rows } = await query(sql, { id });
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Formato no encontrado' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error in /api/formatos/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
