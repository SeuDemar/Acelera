const express = require('express');
const { getMatches } = require('../services/footballService');

const router = express.Router();

router.get('/matches', async (req, res) => {
  try {
    const data = await getMatches();
    res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao buscar dados:', error.message);
    res.status(500).json({ error: 'Erro ao buscar partidas' });
  }
});

module.exports = router;
