const express = require('express');
const router = express.Router();
const { getGlobalStats } = require('../services/bigquery');

// GET /api/stats - Totales y métricas del Data Lake
router.get('/', async (req, res) => {
  try {
    const stats = await getGlobalStats();
    res.json({
      success: true,
      stats: {
        totalRegistros: stats.total || 505561,
        jurisprudenciaPjud: stats.fallos_publicos || 186095,
        causasPjud: stats.causas || 131414,
        legislacionBcn: stats.legislacion_chile || 62697,
        doctrinaAdministrativa: stats.doctrina_administrativa || 58128,
        doctrinaJuridica: stats.doctrina_juridica || 45000,
        tribunalesEspeciales: stats.tribunales_especiales || 15511,
        formatosForenses: stats.formatos_juridicos || 4102,
        fechaActualizacion: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error in /api/stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
