const express = require('express');
const router = express.Router();
const ScrapperEvent = require('../models/Consulta.js');

// GET /consultas?alerttype=alert&commune=Santiago
router.get('/', async (req, res) => {
  try {
    // If no query parameters are provided, this returns all documents.
    const results = await ScrapperEvent.find({});
    console.log('Found records:', results);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
