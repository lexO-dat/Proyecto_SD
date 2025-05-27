// index.js
require('dotenv').config({ path: '../Elastic/.env' });
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const { initBrowser, openPage } = require('./browser');
const { processTrafficData, sleep } = require('./dataService');
const { scanPoint } = require('./scanPoint');
const { regionZones, constructURL } = require('./regionZones');

async function importCsvOnStartup() {
  const filePath = path.join(__dirname, 'traffic_data.csv');
  if (!fs.existsSync(filePath)) {
    console.log('ℹNo hay archivo traffic_data.csv, se omite importación');
    return;
  }

  console.log('Importando traffic_data.csv...');
  const jams = [];
  const alerts = [];
  const timestamp = new Date().toISOString();

  // lectura del CSV para poder indexar a elastic
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({
        headers: ['ID', 'TYPE', 'SUB_TYPE', 'COMMUNE', 'CITY', 'COUNTRY', 'STREET_NAME', 'DESCRIPTION', 'LATITUDE', 'LONGITUDE', 'USER', 'TIMESTAMP'],
        skipLines: 0,
      }))
      .on('data', row => {
        // eliminamos el tipo 'jam'
        if (row.TYPE === 'alert') {
          alerts.push({
            id: row.ID,
            type: row.TYPE,
            subtype: row.SUB_TYPE,
            city: row.CITY,
            country: row.COUNTRY,
            commune: row.COMMUNE,
            street: row.STREET_NAME,
            description: row.DESCRIPTION,
            location: {
              x: parseFloat(row.LATITUDE),
              y: parseFloat(row.LONGITUDE),
            },
            reportBy: row.USER,
            timestamp: row.TIMESTAMP ? new Date(row.TIMESTAMP).toISOString() : timestamp,
          });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  try {
    await processTrafficData({ jams, alerts });
    fs.unlinkSync(filePath);
    console.log('traffic_data.csv importado y eliminado');
  } catch (err) {
    console.error('Error indexando CSV:', err);
  }
}

(async () => {
  try {
    // await importCsvOnStartup();

    const browser = await initBrowser();

    while (true) {
      for (const zone of regionZones) {
        console.log(`\nEscaneando: ${zone.lat}, ${zone.lng}`);
        const page = await openPage(browser, constructURL(zone));
        try {
          await scanPoint(page);
          console.log(`Completado: ${zone.lat}, ${zone.lng}`);
        } catch (err) {
          console.error(`Error escaneando ${zone.lat},${zone.lng}:`, err);
        }
        await page.close().catch(() => {});
      }
      console.log('Reiniciando ciclo...');
      await sleep(5000);
    }
  } catch (err) {
    console.error('Error crítico:', err);
    process.exit(1);
  }
})();
