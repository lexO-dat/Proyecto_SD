const mongoose = require('mongoose');

const ScrapperEventSchema = new mongoose.Schema({
  type: { type: String, required: true }, // aqui debo ver que onda, si poner el type o alertType
  data: {
    commune: { type: String },
    streetName: { type: String },
    streetEnd: { type: String },
    speedKmh: { type: Number },
    alertType: { type: String }
  }
}, { 
  timestamps: true
});

module.exports = mongoose.model('ScrapperEvent', ScrapperEventSchema);