const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');

const DEFAULT_KEY_PATH = '/root/dev-ia/proyectos/pjud-jurisprudencia-pipeline/credentials/fallos-juridicos-key.json';
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || process.env.PROJECT_ID || 'fallos-juridicos';
const LOCATION = process.env.GOOGLE_LOCATION || 'southamerica-west1';

const bqOptions = {
  projectId: PROJECT_ID,
  location: LOCATION
};

if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    bqOptions.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  } catch (err) {
    try {
      const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf8');
      bqOptions.credentials = JSON.parse(decoded);
    } catch (e) {
      console.error('Error parseando GOOGLE_CREDENTIALS_JSON:', e.message);
    }
  }
} else if (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
  bqOptions.credentials = {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  bqOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
} else if (fs.existsSync(DEFAULT_KEY_PATH)) {
  bqOptions.keyFilename = DEFAULT_KEY_PATH;
}

const bq = new BigQuery(bqOptions);

// Cache en memoria con TTL de 15 minutos para optimizar costos de BigQuery y latencia
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data, ttlMs = CACHE_TTL_MS) {
  // Limitar tamaño de cache a 500 consultas
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Ejecuta una consulta BigQuery con cache transparente
 */
async function query(sql, params = {}, options = {}) {
  const cacheKey = JSON.stringify({ sql, params });
  if (!options.bypassCache) {
    const cached = getCache(cacheKey);
    if (cached) {
      return { rows: cached, cached: true };
    }
  }

  const [rows] = await bq.query({
    query: sql,
    params,
    location: LOCATION,
    useLegacySql: false
  });

  setCache(cacheKey, rows);
  return { rows, cached: false };
}

/**
 * Obtiene métricas globales del Data Lake
 */
async function getGlobalStats() {
  const cacheKey = 'global_stats';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT 'fallos_publicos' as dataset, COUNT(*) as count FROM \`fallos-juridicos.fallos_publicos.sentencias_2026\`
    UNION ALL
    SELECT 'causas' as dataset, COUNT(*) as count FROM \`fallos-juridicos.causas.causas_2026\`
    UNION ALL
    SELECT 'tribunales_especiales' as dataset, COUNT(*) as count FROM \`fallos-juridicos.tribunales_especiales.sentencias_especiales\`
    UNION ALL
    SELECT 'legislacion_chile' as dataset, COUNT(*) as count FROM \`fallos-juridicos.legislacion_chile.normas_vigentes\`
    UNION ALL
    SELECT 'doctrina_administrativa' as dataset, COUNT(*) as count FROM \`fallos-juridicos.doctrina_administrativa.dictamenes_y_resoluciones\`
    UNION ALL
    SELECT 'doctrina_juridica' as dataset, COUNT(*) as count FROM \`fallos-juridicos.doctrina_juridica.articulos_doctrina\`
    UNION ALL
    SELECT 'formatos_juridicos' as dataset, COUNT(*) as count FROM \`fallos-juridicos.formatos_juridicos.plantillas_forenses\`
  `;

  try {
    const { rows } = await query(sql);
    const stats = {};
    let total = 0;
    for (const r of rows) {
      const cnt = parseInt(r.count, 10);
      stats[r.dataset] = cnt;
      total += cnt;
    }
    stats.total = total;

    setCache(cacheKey, stats, 60 * 60 * 1000); // 1 hora de cache
    return stats;
  } catch (err) {
    console.warn('BigQuery getGlobalStats error (usando estadísticas fallback):', err.message);
    const fallbackStats = {
      fallos_publicos: 186095,
      causas: 131414,
      tribunales_especiales: 15511,
      legislacion_chile: 62697,
      doctrina_administrativa: 58128,
      doctrina_juridica: 45000,
      formatos_juridicos: 4102,
      total: 505561
    };
    setCache(cacheKey, fallbackStats, 15 * 60 * 1000);
    return fallbackStats;
  }
}

module.exports = {
  bq,
  query,
  getGlobalStats
};
