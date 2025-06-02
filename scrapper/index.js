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
  const filePath = path.join(__dirname, './new.csv');
  if (!fs.existsSync(filePath)) {
    console.log('ℹNo hay archivo new.csv, se omite importación');
    return;
  }

  console.log('Importando new.csv...');
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
          alerts.push({
            id: row.ID || `auto_${Date.now()}_${Math.random()}`,
            type: row.TYPE,
            subtype: row.SUB_TYPE || '',
            city: row.COMMUNE || row.CITY || '',          
            country: row.COUNTRY || 'Chile',
            commune: row.COMMUNE || '',
            street: row.STREET_NAME || '',
            reportDescription: row.DESCRIPTION || '',       
            location: {
              x: parseFloat(row.LATITUDE) || 0,
              y: parseFloat(row.LONGITUDE) || 0,
            },
            reportBy: row.USER || 'guest',
            timestamp: (() => {
              if (!row.TIMESTAMP) return timestamp;
              const date = new Date(row.TIMESTAMP);
              return isNaN(date.getTime()) ? timestamp : date.toISOString();
            })(),
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  try {
    await processTrafficData({ alerts });
    fs.unlinkSync(filePath);
    console.log('new.csv importado y eliminado');
  } catch (err) {
    console.error('Error indexando CSV:', err);
  }
}

(async () => {
  try {
    await importCsvOnStartup();

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
