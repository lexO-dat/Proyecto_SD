// index.js
require('dotenv').config({ path: '../Elastic/.env' });
const { initBrowser, openPage } = require('./browser');
const { processTrafficData, sleep } = require('./dataService');
const { scanPoint } = require('./scanPoint');
const { regionZones, constructURL } = require('./regionZones');

(async () => {
  try {
    const browser = await initBrowser();
    while (true) {
      for (const zone of regionZones) {
        console.log(`\n🔍 Escaneando: ${zone.lat}, ${zone.lng}`);
        const page = await openPage(browser, constructURL(zone));
        try {
          await scanPoint(page);
          console.log(`✅ Completado: ${zone.lat}, ${zone.lng}`);
        } catch (err) {
          console.error(`⚠️ Error escaneando ${zone.lat},${zone.lng}:`, err);
        }
        await page.close().catch(() => {});
      }
      console.log('🔄 Reiniciando ciclo...');
      await sleep(5000);
    }
  } catch (err) {
    console.error('Error crítico:', err);
    process.exit(1);
  }
})();