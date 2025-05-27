// scanPoint.js
const { processTrafficData, sleep } = require('./dataService');
const fs = require('fs');
const path = require('path');

async function scanPoint(page) {
  try {
    await page.waitForSelector('.waze-tour-tooltip__acknowledge', { visible: true, timeout: 5000 });
    await page.click('.waze-tour-tooltip__acknowledge');
  } catch {}

  // zoom out
  try {
    const zoomBtn = await page.waitForSelector('.leaflet-control-zoom-out', { visible: true, timeout: 30000 });
    for (let i = 0; i < 3; i++) {
      await zoomBtn.click();
      await sleep(500);
    }
  } catch (e) {
    console.error('Zoom-out failed:', e);
  }

  let done = false;
  page.on('response', async response => {
    try {
      const contentType = response.headers()['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        return;
      }
      
      const data = await response.json();
      console.log(data);
      if (data && data.alerts) {
        await scanintocsv(data);
      } else {
        console.warn('No alerts found in response data');
      } 
      done = true;
    } catch (error) {
      console.debug('Skipped non-JSON response or parsing error:', error.message);
    }
  });
  

// metodo (nuevamente) para meter los nuevos datos con la nueva estructura al csv
async function scanintocsv(data) {
  const filePath = path.join(__dirname, 'new.csv');
  
  const csvData = data.alerts.map(alert => ({
    ID: alert.id,
    TYPE: alert.type,
    SUB_TYPE: alert.subtype || '',
    COMMUNE: alert.city,
    CITY: alert.city,
    COUNTRY: alert.country,
    STREET_NAME: alert.street,
    DESCRIPTION: alert.reportDescription || '',
    LATITUDE: alert.location.x || '',
    LONGITUDE: alert.location.y || '',
    USER: alert.reportBy || 'guest',
    TIMESTAMP: alert.pubMillis ? new Date(alert.pubMillis).toISOString() : new Date().toISOString(),
  }));
  const fileExists = fs.existsSync(filePath);
  const csvContent = csvData.map(row =>
    `${row.ID},${row.TYPE},${row.SUB_TYPE},${row.COMMUNE},${row.CITY},${row.COUNTRY},${row.STREET_NAME},${row.DESCRIPTION},${row.LATITUDE},${row.LONGITUDE},${row.USER},${row.TIMESTAMP}`
  ).join('\n');
  try {
    fs.writeFileSync(filePath, csvContent, { flag: 'a' });
    console.log('Datos escaneados guardados en new.csv');
  } catch (err) {
    console.error('Error guardando datos en new.csv:', err);
  }
}

  await Promise.race([
    (async () => { while (!done) await sleep(500); })(),
    sleep(30000)
  ]);
  page.removeAllListeners('response');
}

module.exports = { scanPoint };