const express = require('express');
const router = express.Router();
const client = require('../models/elasticClient');
// const { getFromCache, saveToCache } = require('../../redis/redis');


// redis
const redis = require('redis');

const redisclient = redis.createClient({
  url: 'redis://redis:6379' 
});

redisclient.connect().catch(console.error);

async function getFromCache(key) {
  const data = await redisclient.get(key);
  if (!data) return null;
  return JSON.parse(data);
}

async function saveToCache(key, value, ttlSeconds = 20) {
  await redisclient.set(key, JSON.stringify(value), {
    EX: ttlSeconds
  });
}


router.get('/', async (req, res) => {
  try {
    const key = generateCacheKey(req.query);
    
    // verificacion de cache
    const cached = await getFromCache(key);
    if (cached) {
      return res.json({
        fromCache: true,
        data: cached
      });
    }

    //  No estaba en caché -> consulta a Elasticsearch
    const esResponse = await client.search({
      index: 'scrapperevents',
      body: buildElasticQuery(req.query)
    });

    const hits = esResponse.hits.hits.map(doc => doc._source || doc);

    //  Guardar en Redis y retornar
    await saveToCache(key, hits, 15); // el ultimo parámetro es el TTL en segundos
    return res.json({
      fromCache: false,
      data: hits
    });
  } catch (error) {
    console.error('Error en /consultas:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

function generateCacheKey(queryObj) {
  return JSON.stringify(queryObj);
}

function buildElasticQuery(queryObj) {
  const must = [];
  if (queryObj.alerttype) {
    must.push({ match: { "type": queryObj.alerttype } });
  }
  if (queryObj.commune) {
    must.push({ match: { "data.commune": queryObj.commune } });
  }
  return { query: { bool: { must } }, size: 1000 };
}

module.exports = router;

/*
testeo:

tipos de eventos: jam y alert

curl 'http://localhost:3000/consultas' -> retorna todos los eventos con un limit de 1000 
curl 'http://localhost:3000/consultas?alerttype=alert' -> retorna todos los eventos de tipo alert
curl 'http://localhost:3000/consultas?commune=Santiago' -> retorna todos los eventos de la comuna de Santiago
curl 'http://localhost:3000/consultas?alerttype=alert&commune=Santiago' -> retorna todos los eventos de tipo alert en la comuna de Santiago
*/