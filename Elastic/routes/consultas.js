// routes/consultasElastic.js
require('dotenv').config({ path: '../Elastic/.env' });
const express = require('express');
const router = express.Router();
const client = require('../models/elasticClient');

// GET /consultas?alerttype=alert&commune=Santiago
router.get('/', async (req, res) => {
  try {
    const alerttype = req.query.alerttype || req.query.alertType;
    const commune   = req.query.commune;

    const must = [];

    if (alerttype) {
      must.push({ term: { type: alerttype } });
    }

    if (commune) {
      must.push({ match: { 'data.commune': commune } });
    }

    const queryBody = must.length
      ? { bool: { must } }
      : { match_all: {} };

    console.log('🔍 ES query:', JSON.stringify({ query: queryBody, sort: [{ createdAt: 'desc' }] }, null, 2));

    const esResponse = await client.search({
      index: 'scrapperevents',
      size: 1000,     
      body: {
        query: queryBody,
        sort: [{ createdAt: { order: 'desc' } }]
      }
    });

    const result = esResponse.body ?? esResponse;
    const hits   = result.hits.hits.map(hit => hit._source);

    res.json(hits);

  } catch (error) {
    console.error('Error al buscar en Elastic:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

/*
testeo:

tipos de eventos: jam y alert

curl 'http://localhost:3000/consultas' -> retorna todos los eventos con un limit de 1000 
curl 'http://localhost:3000/consultas?alerttype=alert' -> retorna todos los eventos de tipo alert
curl 'http://localhost:3000/consultas?commune=Santiago' -> retorna todos los eventos de la comuna de Santiago
curl 'http://localhost:3000/consultas?alerttype=alert&commune=Santiago' -> retorna todos los eventos de tipo alert en la comuna de Santiago
*/