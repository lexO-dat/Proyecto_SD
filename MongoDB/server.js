require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const consultasRoutes = require('./routes/consultas');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Conexión a MongoDB (usa tu URL si estás en MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
.then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Rutas
app.use('/consultas', consultasRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
