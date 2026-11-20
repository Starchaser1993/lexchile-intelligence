const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const fallosRouter = require('./routes/fallos');
const causasRouter = require('./routes/causas');
const especialesRouter = require('./routes/especiales');
const leyesRouter = require('./routes/leyes');
const doctrinaAdminRouter = require('./routes/doctrinaAdmin');
const doctrinaJuridicaRouter = require('./routes/doctrinaJuridica');
const formatosRouter = require('./routes/formatos');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/stats', statsRouter);
app.use('/api/fallos', fallosRouter);
app.use('/api/causas', causasRouter);
app.use('/api/especiales', especialesRouter);
app.use('/api/leyes', leyesRouter);
app.use('/api/doctrina-admin', doctrinaAdminRouter);
app.use('/api/doctrina-juridica', doctrinaJuridicaRouter);
app.use('/api/formatos', formatosRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'LexChile Intelligence API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for SPA routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor de Inteligencia Jurídica',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n⚖️  ==============================================================`);
    console.log(`🏛️  LexChile Intelligence - Plataforma de Inteligencia Jurídica`);
    console.log(`🌐  Servidor activo en: http://localhost:${PORT}`);
    console.log(`📊  Conectado a Google BigQuery: fallos-juridicos (southamerica-west1)`);
    console.log(`⚖️  ==============================================================\n`);
  });
}

module.exports = app;
