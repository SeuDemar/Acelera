const express = require('express');
require('dotenv').config();

const matchesRouter = require('./src/routes/matches');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api', matchesRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
