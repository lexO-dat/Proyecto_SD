const mongoose = require('mongoose');

const ConsultaSchema = new mongoose.Schema({
  nombre: String,
  correo: String,
  mensaje: String,
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Consulta', ConsultaSchema);
