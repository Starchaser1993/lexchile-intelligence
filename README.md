# ⚖️ LexChile Intelligence

> **Plataforma de Inteligencia Jurídica y Litigación Estratégica de Chile**  
> Data Lake Judicial conectado a Google BigQuery con más de 500.000 registros indexados y motor de búsqueda para litigantes y abogados.

---

## 🏛️ Descripción General

**LexChile Intelligence** es una aplicación web y API unificada de alta velocidad diseñada específicamente para la práctica jurídica chilena. Integra y consolida en tiempo real múltiples fuentes judiciales y regulatorias a través de Google BigQuery:

- 🏛️ **Jurisprudencia Judicial PJUD:** 186.000+ sentencias definitivas e interlocutorias de la Corte Suprema y Cortes de Apelaciones.
- 📂 **Expedientes Judiciales 2026:** 131.000+ causas en tramitación de tribunales civiles, laborales y de familia.
- ⚖️ **Tribunales Especiales:** 15.500+ resoluciones y fallos del Tribunal Constitucional (TC), Tribunales Tributarios y Aduaneros (TTA) y Tribunal de Defensa de la Libre Competencia (TDLC).
- 📜 **Legislación Vigente BCN:** 62.000+ leyes, decretos y códigos de la República actualizados según la Biblioteca del Congreso Nacional.
- 📑 **Doctrina Administrativa CGR:** 58.000+ dictámenes e interpretaciones normativas de la Contraloría General de la República.
- 📚 **Doctrina Jurídica Especializada:** 45.000+ artículos de doctrina y revistas de derecho.
- 📝 **Formatos y Minutas Forenses:** 4.100+ modelos forenses y escritos estructurados para litigación procesal.

---

## 🚀 Arquitectura y Stack Tecnológico

Siguiendo las directrices de alto rendimiento y diseño premium de `AGENTS.md`:

1. **Frontend:**
   - HTML5 semántico y accesible.
   - CSS vainilla ultra optimizado con tokens de diseño (`tokens.css`, `layout.css`, `components.css`, `viewer.css`) en modo oscuro elegante.
   - JavaScript moderno (ES6+) sin frameworks pesados, con visor modal de expedientes, copiado de citas jurídicas en formato estándar y filtros dinámicos.
2. **Backend & API:**
   - Node.js & Express 5.
   - Conexión optimizada a Google BigQuery (`@google-cloud/bigquery`) con cache en memoria (TTL de 15 minutos) para minimizar costos y latencia.
   - Compresión GZIP (`compression`) y soporte CORS.
3. **Despliegue Serverless en Vercel:**
   - Arquitectura compatible con Serverless Functions (`api/index.js` y `vercel.json`).
   - Frontend estático distribuido a través de la Edge Network de Vercel.

---

## 📁 Estructura del Proyecto

```bash
lexchile-intelligence/
├── api/
│   └── index.js             # Entrada para Serverless Functions en Vercel
├── public/                  # Frontend estático servido en el root (/)
│   ├── css/
│   │   ├── tokens.css       # Tokens de diseño y variables CSS
│   │   ├── layout.css       # Layout y rejilla responsiva
│   │   ├── components.css   # Componentes UI (tarjetas, botones, filtros)
│   │   └── viewer.css       # Visor modal de fallos y expedientes
│   ├── js/
│   │   ├── api.js           # Cliente API con cache transparente
│   │   ├── ui.js            # Renderizado de listas, badges y tabs
│   │   ├── citations.js     # Formateador de citas jurídicas
│   │   └── app.js           # Lógica principal y eventos
│   └── index.html           # Interfaz principal de la plataforma
├── routes/                  # Endpoints REST de Express
│   ├── stats.js             # Métricas y contadores del Data Lake
│   ├── fallos.js            # Jurisprudencia PJUD
│   ├── causas.js            # Causas y expedientes
│   ├── especiales.js        # Tribunales especiales (TC, TTA, TDLC)
│   ├── leyes.js             # Normativa y códigos
│   ├── doctrinaAdmin.js     # Dictámenes CGR
│   ├── doctrinaJuridica.js  # Artículos y dogmática
│   └── formatos.js          # Plantillas de escritos
├── services/
│   └── bigquery.js          # Conector a BigQuery con fallback y cache
├── .env.example             # Plantilla de variables de entorno
├── .gitignore               # Archivos excluidos del control de versiones
├── package.json             # Dependencias y scripts
├── server.js                # Servidor Express local y middleware
└── vercel.json              # Configuración de rutas para Vercel
```

---

## 💻 Ejecución Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar credenciales (opcional):**
   Copia `.env.example` a `.env` y configura tus variables de Google Cloud o tu archivo de credenciales de BigQuery:
   ```bash
   cp .env.example .env
   ```

3. **Iniciar servidor:**
   ```bash
   npm start
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ☁️ Despliegue en Vercel

Para desplegar este proyecto en Vercel y tenerlo en la web:

1. **Crear / Importar el Proyecto:**
   - Ve a tu panel de control en [vercel.com](https://vercel.com).
   - Haz clic en **"Add New"** > **"Project"**.
   - Conecta tu cuenta de GitHub y selecciona el repositorio `lexchile-intelligence`.

2. **Configurar Variables de Entorno (Environment Variables):**
   En la pantalla de configuración del proyecto en Vercel, agrega las siguientes variables de entorno:
   
   | Variable | Valor / Descripción |
   |---|---|
   | `GOOGLE_PROJECT_ID` | `fallos-juridicos` |
   | `GOOGLE_LOCATION` | `southamerica-west1` |
   | `GOOGLE_CREDENTIALS_JSON` | Contenido JSON completo (en una sola línea) de la clave de servicio de Google Cloud. |

   > **Nota de Seguridad:** Nunca expongas la clave de servicio en el repositorio público de GitHub. La variable `GOOGLE_CREDENTIALS_JSON` en Vercel se almacena de forma cifrada y segura.

3. **Desplegar:**
   - Haz clic en **"Deploy"**.
   - En segundos, tu aplicación estará disponible en una URL como `https://lexchile-intelligence.vercel.app`.

---

## 📡 Endpoints de la API

- `GET /api/stats` - Estadísticas y conteo global del Data Lake.
- `GET /api/fallos` - Búsqueda de jurisprudencia judicial (parámetros: `q`, `corte`, `sala`, `materia`, `page`, `limit`).
- `GET /api/fallos/:id` - Detalle completo de una sentencia.
- `GET /api/causas` - Búsqueda en expedientes 2026.
- `GET /api/especiales` - Resoluciones de tribunales especiales (TC, TTA, TDLC).
- `GET /api/leyes` - Consulta de normas y legislación vigente.
- `GET /api/doctrina-admin` - Dictámenes de la Contraloría General de la República.
- `GET /api/doctrina-juridica` - Artículos de doctrina jurídica.
- `GET /api/formatos` - Plantillas y modelos de escritos forenses.
- `GET /api/health` - Estado de salud del servicio.

---

## ⚖️ Licencia
ISC License. Desarrollado por Sebastian Torres Mattisen.
