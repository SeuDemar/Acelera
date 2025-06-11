const express = require('express');
const { getMatches } = require('./footballService.js');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');

const redis = require('redis');
const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

// Swagger Spec Manual
const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Football API",
    version: "1.0.0",
    description: "API para partidas de futebol com cache via Redis",
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    "/matches": {
      get: {
        summary: "Buscar partidas de futebol",
        description: "Busca partidas com filtros opcionais de data (com cache Redis)",
        parameters: [
          {
            name: "dateFrom",
            in: "query",
            required: false,
            description: "Data inicial (YYYY-MM-DD)",
            schema: { type: "string", format: "date", example: "2025-06-01" }
          },
          {
            name: "dateTo",
            in: "query",
            required: false,
            description: "Data final (YYYY-MM-DD)",
            schema: { type: "string", format: "date", example: "2025-06-30" }
          }
        ],
        responses: {
          200: {
            description: "Lista de partidas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    filters: { type: "object" },
                    resultSet: { type: "object" },
                    matches: { type: "array" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Endpoint com cache e filtros
app.get('/matches', async (req, res) => {
  const { dateFrom = 'default', dateTo = 'default' } = req.query;
  const cacheKey = `football_matches:${dateFrom}:${dateTo}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('Cache HIT');
      return res.json(JSON.parse(cachedData));
    }

    console.log('Cache MISS - buscando da API');

    // Aqui você deve adaptar sua função getMatches para aceitar filtros
    const data = await getMatches(dateFrom, dateTo);

    await redisClient.setEx(cacheKey, 600, JSON.stringify(data));
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar os dados' });
  }
});

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Start Server
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Swagger docs em http://localhost:${PORT}/api-docs`);
});
