const axios = require('axios');

const getMatches = async () => {
  const response = await axios.get('https://api.football-data.org/v4/matches', {
    headers: {
      'X-Auth-Token': process.env.FOOTBALL_API_KEY
    }
  });
  return response.data;
};

module.exports = { getMatches };
