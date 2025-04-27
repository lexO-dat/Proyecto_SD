// scanPoint.js
const { processTrafficData, sleep } = require('./dataService');

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
    if (response.url().includes('/api/georss')) {
      try {
        const data = await response.json();
        await processTrafficData(data);
      } catch (err) {
        console.error('Failed to parse georss JSON:', err);
      }
      done = true;
    }
  });

  await Promise.race([
    (async () => { while (!done) await sleep(500); })(),
    sleep(30000)
  ]);
  page.removeAllListeners('response');
}

module.exports = { scanPoint };