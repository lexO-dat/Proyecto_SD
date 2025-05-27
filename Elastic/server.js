require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const consultasRoutes = require('./routes/consultas');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

app.use('/consultas', consultasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
