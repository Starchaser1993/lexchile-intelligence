// Cliente de API para LexChile Intelligence
const API = (() => {
  const cache = new Map();

  async function get(endpoint, params = {}) {
    const url = new URL(endpoint, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    const cacheKey = url.toString();
    if (cache.has(cacheKey)) {
      return { ...cache.get(cacheKey), fromClientCache: true };
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de red' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const json = await res.json();
    cache.set(cacheKey, json);
    return json;
  }

  return {
    getStats: () => get('/api/stats'),
    getFallos: (params) => get('/api/fallos', params),
    getFalloById: (id) => get(`/api/fallos/${encodeURIComponent(id)}`),
    getFallosFilters: () => get('/api/fallos/filters'),

    getCausas: (params) => get('/api/causas', params),
    getCausaById: (id) => get(`/api/causas/${encodeURIComponent(id)}`),
    getCausasFilters: () => get('/api/causas/filters'),

    getEspeciales: (params) => get('/api/especiales', params),
    getEspecialById: (id) => get(`/api/especiales/${encodeURIComponent(id)}`),

    getLeyes: (params) => get('/api/leyes', params),
    getCodigos: () => get('/api/leyes/codigos'),
    getLeyById: (id) => get(`/api/leyes/${encodeURIComponent(id)}`),

    getDoctrinaAdmin: (params) => get('/api/doctrina-admin', params),
    getDoctrinaAdminById: (id) => get(`/api/doctrina-admin/${encodeURIComponent(id)}`),

    getDoctrinaJuridica: (params) => get('/api/doctrina-juridica', params),
    getDoctrinaJuridicaById: (id) => get(`/api/doctrina-juridica/${encodeURIComponent(id)}`),

    getFormatos: (params) => get('/api/formatos', params),
    getFormatosCategorias: () => get('/api/formatos/categorias'),
    getFormatoById: (id) => get(`/api/formatos/${encodeURIComponent(id)}`)
  };
})();
