const express = require('express');
const { getMatches } = require('./footballService');
const cacheMiddleware = require('./cacheMiddleware');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = process.env.PORT || 3000;

// Swagger Spec
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Football API',
    version: '1.0.0',
    description: 'API para partidas de futebol com e sem cache',
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/matches': {
      get: {
        summary: 'Buscar partidas com cache (Redis)',
        responses: {
          200: {
            description: 'Lista de partidas com cache',
          }
        }
      }
    },
    '/matches/live': {
      get: {
        summary: 'Buscar partidas direto da API externa (sem cache)',
        responses: {
          200: {
            description: 'Lista de partidas sem cache',
          }
        }
      }
    },
    '/matches/cache': {
      delete: {
        summary: 'Limpar o cache de /matches',
        responses: {
          200: {
            description: 'Cache limpo com sucesso',
          }
        }
      }
    }
  }
};

// Rota COM cache via Redis
app.get('/matches', cacheMiddleware(600), async (req, res) => {
  try {
    const data = await getMatches();
    res.json(data);
  } catch (err) {
    console.error('Erro na rota /matches:', err.message);
    res.status(500).json({ error: 'Falha ao buscar partidas' });
  }
});

// Rota SEM cache (força requisição nova à API)
app.get('/matches/live', async (req, res) => {
  try {
    const data = await getMatches();
    res.json(data);
  } catch (err) {
    console.error('Erro na rota /matches/live:', err.message);
    res.status(500).json({ error: 'Falha ao buscar partidas (live)' });
  }
});

// Rota para limpar o cache
app.delete('/matches/cache', async (req, res) => {
  const redis = require('redis');
  const redisClient = redis.createClient({ url: process.env.REDIS_URL });

  try {
    await redisClient.connect();
    const cacheKey = 'cache:GET:/matches';
    await redisClient.del(cacheKey);
    res.json({ message: 'Cache removido com sucesso' });
  } catch (err) {
    console.error('Erro ao limpar cache:', err.message);
    res.status(500).json({ error: 'Erro ao remover cache' });
  } finally {
    await redisClient.disconnect();
  }
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
