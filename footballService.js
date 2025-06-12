const axios = require('axios');
require('dotenv').config();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMatches() {
  const allMatches = [];
  const limit = 50;
  let offset = 0;
  const maxRequests = 20;
  let requestsMade = 0;
  const delayMs = 6 * 1000; // 6 segundos para 10 req/min

  while (requestsMade < maxRequests) {
    console.log(`Buscando partidas – offset=${offset}, requisição ${requestsMade + 1}/${maxRequests}`);

    try {
      const res = await axios.get('https://api.football-data.org/v4/matches', {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY },
        params: { limit, offset },
        timeout: 30000,
      });

      const matches = res.data.matches || [];
      if (matches.length === 0) break;

      allMatches.push(...matches);
      offset += matches.length;
      requestsMade++;

      if (requestsMade < maxRequests) await sleep(delayMs);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.error('Erro 429: limite de requisições excedido');
      } else {
        console.error('Erro na requisição:', error.message);
      }
      break;
    }
  }

  return { total: allMatches.length, matches: allMatches };
}

module.exports = { getMatches };
