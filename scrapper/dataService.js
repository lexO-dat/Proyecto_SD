// dataService.js
require('dotenv').config({ path: '../Elastic/.env' });
const { Client } = require('@elastic/elasticsearch');

console.log(process.env.ELASTIC_URL, process.env.ELASTIC_USER, process.env.ELASTIC_PASS);

// variables de entorno y conexión a elastic
const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Envío de los datos a Elasticsearch
*/
async function processTrafficData(data, batchSize = 1000) {
  const bulkOps = [];
  const timestamp = new Date().toISOString();

  // nueva version de extraccion de datos agregamos : location, reportBy, pubMillis, alertSubtype, timestamp, user
  if (Array.isArray(data.alerts)) {
    for (const alert of data.alerts) {
      bulkOps.push({ index: { _index: 'scrapperevents' } });
      bulkOps.push({
        type: alert.type,
        data: {
          country: alert.country,
          commune: alert.city,
          streetName: alert.street,
          alertType: alert.type,
          alertSubtype: alert.subtype || '',
          description: alert.reportDescription || '',
          location: {
            lat: alert.location.x || '',
            lon: alert.location.y || '',
          },
          idEvent: alert.id,
          timestamp: alert.pubMillis ? new Date(alert.pubMillis).toISOString() : timestamp,
          user: alert.reportBy || 'guest',
        },
      });
    }
  }

  // Indexación en lotes en elasticsearch
  for (let i = 0; i < bulkOps.length; i += batchSize * 2) {
    const batch = bulkOps.slice(i, i + batchSize * 2);
    try {
      const response = await client.bulk({ refresh: false, body: batch });
      const result = response.body ?? response;

      if (result.errors) {
        result.items.forEach((item, idx) => {
          const op = Object.keys(item)[0];
          if (item[op].error) {
            console.warn(`Error doc ${i / 2 + idx}:`, item[op].error);
          }
        });
      } else {
        console.log(`Lote ${Math.floor(i / (batchSize * 2)) + 1} indexado (${batch.length / 2} docs)`);
      }
    } catch (err) {
      console.error(`Bulk error lote ${Math.floor(i / (batchSize * 2)) + 1}:`, err);
    }
    await sleep(500);
  }
}

module.exports = { processTrafficData, sleep };