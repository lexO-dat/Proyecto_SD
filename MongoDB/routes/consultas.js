const express = require('express');
const router = express.Router();
const Consulta = require('../models/Consulta');

// Endpoint 1: guardar consulta normal
router.post('/guardar', async (req, res) => {
  try {
    const nuevaConsulta = new Consulta(req.body);
    await nuevaConsulta.save();
    res.status(201).json({ mensaje: 'Consulta guardada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: guardar con validación simple
router.post('/guardar-validado', async (req, res) => {
  const { nombre, mensaje } = req.body;
  if (!nombre || !mensaje) {
    return res.status(400).json({ error: 'Nombre y mensaje son obligatorios' });
  }

  try {
    const consulta = new Consulta(req.body);
    await consulta.save();
    res.status(201).json({ mensaje: 'Consulta guardada con validación' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
