// dataService.js
require('dotenv').config({ path: '../Elastic/.env' });
const { Client } = require('@elastic/elasticsearch');

console.log(process.env.ELASTIC_URL, process.env.ELASTIC_USER, process.env.ELASTIC_PASS);

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
 * Envío de los datos a Elasticsearch usando Bulk API y lotes.
 */
async function processTrafficData(data, batchSize = 50) {
  const bulkOps = [];
  const timestamp = new Date().toISOString();

  if (Array.isArray(data.jams)) {
    for (const jam of data.jams) {
      bulkOps.push({ index: { _index: 'scrapperevents' } });
      bulkOps.push({
        type: 'jam',
        data: {
          commune: jam.city,
          streetName: jam.street,
          streetEnd: jam.endNode,
          speedKmh: jam.speedKMH,
          alertType: 'JAM'
        },
        createdAt: timestamp
      });
    }
  }
  if (Array.isArray(data.alerts)) {
    for (const alert of data.alerts) {
      bulkOps.push({ index: { _index: 'scrapperevents' } });
      bulkOps.push({
        type: 'alert',
        data: {
          commune: alert.city,
          streetName: alert.street,
          streetEnd: '',
          speedKmh: '',
          alertType: alert.type
        },
        createdAt: timestamp
      });
    }
  }

  // Indexación en lotes
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
        console.log(`✅ Lote ${Math.floor(i / (batchSize * 2)) + 1} indexado (${batch.length / 2} docs)`);
      }
    } catch (err) {
      console.error(`⚠️ Bulk error lote ${Math.floor(i / (batchSize * 2)) + 1}:`, err);
    }
    await sleep(500);
  }
}

module.exports = { processTrafficData, sleep };