require('dotenv').config({ path: '../MongoDB/.env' });
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const ScrapperEvent = require('../MongoDB/models/Consulta');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initBrowser() {
  return await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 0 });
  return page;
}

// processTrafficData: collect all records, then insertMany
async function processTrafficData(data) {
  const records = [];

  // "jams"
  if (Array.isArray(data.jams)) {
    for (let jam of data.jams) {
      records.push({
        type: 'jam',
        data: {
          commune: jam.city,
          streetName: jam.street,
          streetEnd: jam.streetEnd,
          speedKmh: jam.speedKmh,
          alertType: 'JAM'
        }
      });
    }
  }

  // "alerts"
  if (Array.isArray(data.alerts)) {
    for (let alert of data.alerts) {
      records.push({
        type: 'alert',
        data: {
          commune: alert.city,
          streetName: alert.street,
          streetEnd: '',
          speedKmh: '',
          alertType: alert.type
        }
      });
    }
  }

  if (records.length) {
    try {
      const batchSize = 30; // Reducir tamaño de lote
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        let retries = 3;
        while (retries > 0) {
          try {
            const result = await ScrapperEvent.insertMany(batch, { 
              ordered: false,
              bufferTimeoutMS: 30000 // Tiempo de espera por lote
            });
            console.log(`Insertados ${result.length} registros (lote ${i}-${i + batchSize})`);
            break;
          } catch (insertErr) {
            retries--;
            if (retries === 0) {
              console.error('Error insertando lote:', insertErr);
              break;
            }
            console.log(`Reintentando lote... (${retries} intentos restantes)`);
            await sleep(2000);
          }
        }
      }
    } catch (err) {
      console.error('Error crítico insertando datos:', err);
    }
  }
}

async function scanPoint(page) {
  try {
    await page.waitForSelector('.waze-tour-tooltip__acknowledge', {
      visible: true,
      timeout: 5000
    });
    await page.click('.waze-tour-tooltip__acknowledge');
  } catch (e) {
    // Si no aparece el tooltip, se ignora.
  }

  let zoom = 3;
  try {
    await page.waitForSelector('.leaflet-control-zoom-out', {
      visible: true,
      timeout: 30000
    });
    for (let i = 0; i < zoom; i++) {
      await page.click('.leaflet-control-zoom-out');
      await sleep(1000);
    }
  } catch (e) {
    console.error('Zoom-out failed:', e);
  }

  let done = false;
  const onResponse = async response => {
    if (response.url().includes('/api/georss')) {
      try {
        const data = await response.json();
        await processTrafficData(data);
      } catch (err) {
        console.error('Failed to parse georss JSON:', err);
      }
      done = true;
    }
  };

  page.on('response', onResponse);
  await Promise.race([
    (async function waitForDone() {
      while (!done) await sleep(500);
    })(),
    sleep(30000)
  ]);
  page.off('response', onResponse);
}

function constructURL({ lat, lng }, zoom = 17) {
  return `https://ul.waze.com/ul?ll=${lat}%2C${lng}&navigate=yes&zoom=${zoom}&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location`;
}

const regionZones = [
  { lat: -33.437222, lng: -70.657222 },
  { lat: -33.500000, lng: -70.716667 },
  { lat: -33.422000, lng: -70.735000 },
  { lat: -33.380000, lng: -70.675000 },
  { lat: -33.567000, lng: -70.675000 },
  { lat: -33.459000, lng: -70.699000 },
  { lat: -33.368000, lng: -70.634000 },
  { lat: -33.413000, lng: -70.666000 },
  { lat: -33.529000, lng: -70.663000 },
  { lat: -33.525000, lng: -70.538000 },
  { lat: -33.533000, lng: -70.625000 },
  { lat: -33.583000, lng: -70.634000 },
  { lat: -33.443000, lng: -70.532000 },
  { lat: -33.416667, lng: -70.583333 },
  { lat: -33.350000, lng: -70.516667 },
  { lat: -33.522000, lng: -70.687000 },
  { lat: -33.445000, lng: -70.726000 },
  { lat: -33.487000, lng: -70.604000 },
  { lat: -33.516667, lng: -70.766667 },
  { lat: -33.454000, lng: -70.604000 },
  { lat: -33.466000, lng: -70.634000 },
  { lat: -33.486000, lng: -70.533333 },
  { lat: -33.435000, lng: -70.616000 },
  { lat: -33.433333, lng: -70.716667 },
  { lat: -33.361000, lng: -70.729000 },
  { lat: -33.427000, lng: -70.699000 },
  { lat: -33.406000, lng: -70.640000 },
  { lat: -33.398000, lng: -70.723000 },
  { lat: -33.491000, lng: -70.628000 },
  { lat: -33.486000, lng: -70.649000 },
  { lat: -33.533000, lng: -70.642000 },
  { lat: -33.400000, lng: -70.600000 },
  { lat: -33.615999, lng: -70.570000 },
  { lat: -33.650000, lng: -70.563999 },
  { lat: -33.643999, lng: -70.352999 },
  { lat: -33.193999, lng: -70.667999 },
  { lat: -33.286000, lng: -70.877999 },
  { lat: -33.085000, lng: -70.925000 },
  { lat: -33.582000, lng: -70.687000 },
  { lat: -33.727000, lng: -70.739000 },
  { lat: -33.628000, lng: -70.785000 },
  { lat: -33.812000, lng: -70.722000 },
  { lat: -33.688000, lng: -71.207999 },
  { lat: -34.033000, lng: -71.100000 },
  { lat: -33.398999, lng: -71.137000 },
  { lat: -33.515000, lng: -71.119000 },
  { lat: -33.900000, lng: -71.466999 },
  { lat: -33.667000, lng: -70.930999 },
  { lat: -33.683000, lng: -71.017000 },
  { lat: -33.753999, lng: -70.885999 },
  { lat: -33.576000, lng: -70.800000 },
  { lat: -33.606000, lng: -70.876524 }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4 // Forzar IPv4
    });

    const browser = await initBrowser();
    while (true) {
      for (let zone of regionZones) {
        console.log(`\n🔍 Escaneando coordenadas: ${zone.lat}, ${zone.lng}`);
        const page = await openPage(browser, constructURL(zone));
        try {
          await scanPoint(page);
          console.log(`✅ Escaneo completado: ${zone.lat}, ${zone.lng}`);
        } catch (err) {
          console.error(`⚠️ Error escaneando: ${zone.lat}, ${zone.lng}:`, err);
        }
        await page.close().catch(() => {});
      }
      console.log('🔄 Reiniciando ciclo de escaneo...');
      await sleep(5000); // Espera entre ciclos
    }
  } catch (err) {
    console.error('Error crítico:', err);
    process.exit(1);
  }
})();