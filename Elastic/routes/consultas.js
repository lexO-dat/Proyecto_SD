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

async function saveToCache(key, value, ttlSeconds) {
  await redisclient.set(key, JSON.stringify(value), {
    EX: ttlSeconds
  });
}

// url de la api: http://localhost:3000/consultas/
/*
// parametros de la consulta:
type: tipo de evento (jam o alert)
commune: comuna del evento (Santiago, Valparaíso, etc)
streetName: calle del evento (Alameda, etc)
alertType: tipo de alerta (policia, hazard, etc)
*/
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
    await saveToCache(key, hits, 60); // el ultimo parámetro es el TTL en segundos
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

  // Filtrado por el tipo de documento: "alert" o "jam"
  if (queryObj.type) {
      must.push({ match: { "type": queryObj.type } });
  }

  // Filtrado por el subtipo alert: por ejemplo, policia, hazard, etc.
  if (queryObj.alertType) {
      must.push({ match: { "data.alertType": queryObj.alertType } });
  }

  // Filtrado por nombre de calle
  if (queryObj.streetName) {
      must.push({ match: { "data.streetName": queryObj.streetName } });
  }

  // Filtrado por comuna
  if (queryObj.commune) {
      must.push({ match: { "data.commune": queryObj.commune } });
  }

  return { query: { bool: { must } }, size: 1000 };
}

module.exports = router;

/*
testeo:

curl 'http://localhost:3000/consultas' -> retorna todos los eventos con un limit de 1000 
curl 'http://localhost:3000/consultas?alertType=POLICE' -> retorna todos los eventos de tipo POLICE
curl 'http://localhost:3000/consultas?commune=Santiago' -> retorna todos los eventos de la comuna de Santiago
curl 'http://localhost:3000/consultas?type=alert&commune=Santiago' -> retorna todos los eventos alert en la comuna de Santiago
*/