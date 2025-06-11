// footballService.js
const axios = require('axios');
require('dotenv').config();

async function getMatches(dateFrom, dateTo) {
  try {
    const response = await axios.get('https://api.football-data.org/v4/matches', {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_API_KEY,
      },
      params: {
        dateFrom,
        dateTo,
      },
      timeout: 15000, // 15 segundos de timeout
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados da Football API:', error.message);
    throw new Error('Falha ao buscar partidas');
  }
}

module.exports = { getMatches };
