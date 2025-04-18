const puppeteer = require('puppeteer'); // Puppeteer allows headless (or visible) automation of Chrome.
const fs = require('fs'); // File System module for checking file existence.
const { createObjectCsvWriter } = require('csv-writer'); // Module to create CSV files from data

// Define the path to the CSV file which will store the traffic data.
const csvFile = 'traffic_data.csv';

// Define the structure (columns and headers) for the CSV file.
// Note: the timestamp column is commented out—uncomment if needed.
const header = [
  // { id: 'timestamp',   title: 'TIMESTAMP' },
  { id: 'type',        title: 'TYPE' },
  { id: 'commune',     title: 'COMMUNE' },
  { id: 'streetName',  title: 'STREET_NAME' },
  { id: 'streetEnd',   title: 'STREET_END' },
  { id: 'speedKmh',    title: 'SPEED_KMH' },
  { id: 'alertType',   title: 'ALERT_TYPE' }
];

// Create a CSV writer instance using 'createObjectCsvWriter'.
// If the CSV file already exists, we set append to true so that
// new records are added rather than overwriting previous data.
const csvWriter = createObjectCsvWriter({
  path: csvFile,
  header,
  append: fs.existsSync(csvFile)
});

// sleep(ms):
// Returns a Promise that resolves after a specified number of milliseconds.
// Useful to pause execution (for waiting for UI updates, network responses, etc.)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// initBrowser():
// Launches a new Puppeteer browser instance.
// The args '--no-sandbox' and '--disable-setuid-sandbox' are provided for system compatibility.
// 'headless: false' means the browser will be visible while running.
async function initBrowser() {
  return await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

// openPage(browser, url):
// Opens a new page in the given browser instance and navigates to the provided URL.
// 'waitUntil: load' ensures the navigation waits until the page fully loads, and 'timeout: 0'
// disables the timeout.
async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 0 });
  return page;
}

// processTrafficData(data):
// Processes the returned traffic data by iterating over two types: jams and alerts.
// For each item, it extracts relevant fields and creates an object record.
// Then it writes the records to CSV and outputs a log to the console.
async function processTrafficData(data) {
  const records = [];
  const timestamp = new Date().toISOString(); // If needed, uncomment and save timestamp in each record.

  // Process traffic jams, if available.
  if (Array.isArray(data.jams)) {
    data.jams.forEach(jam => {
      records.push({
        //timestamp,
        type: 'jam',
        commune: jam.city,
        streetName: jam.street,
        streetEnd: jam.endNode,
        speedKmh: jam.speedKMH,
        alertType: ''
      });
    });
  }

  // Process alerts (for example, police reports or other warnings).
  if (Array.isArray(data.alerts)) {
    data.alerts.forEach(alert => {
      records.push({
        //timestamp,
        type: 'alert',
        commune: alert.city,
        streetName: alert.street,
        streetEnd: '', // Sometimes alerts may not have an end node.
        speedKmh: '',  // Speed might not apply to alerts.
        alertType: alert.type
      });
    });
  }

  // If there are any records to save, write them to the CSV file and log the result.
  if (records.length > 0) {
    await csvWriter.writeRecords(records);
    console.log(`💾 Saved ${records.length} records to ${csvFile}`);
  }
}

// scanPoint(page):
// This function automates the steps necessary to scan the map on the provided page.
// It dismisses any tooltips, zooms out the map to cover a larger area,
// and attaches an event listener to capture network responses that match a pattern.
// When a response with a URL containing '/api/georss' is received, the JSON is parsed
// and processed via processTrafficData. The function waits until either the response is received or 30 seconds pass.
async function scanPoint(page) {
  // Try to dismiss the "tour" tooltip if it appears (to avoid interference with scanning).
  try {
    await page.waitForSelector('.waze-tour-tooltip__acknowledge', { 
      visible: true, 
      timeout: 5000 
    });
    await page.click('.waze-tour-tooltip__acknowledge');
  } catch (e) {
    // If the tooltip is not present, ignore the error.
  }
  
  // Zoom out the map by clicking the zoom-out button three times.
  try {
    await page.waitForSelector('.leaflet-control-zoom-out', { 
      visible: true, 
      timeout: 10000 
    });
    for (let i = 0; i < 5; i++) {
      await page.click('.leaflet-control-zoom-out');
      await sleep(1000); // Small delay between each click for smooth UI transition.
    }
  } catch (e) {
    console.error('Zoom-out failed:', e);
  }
  
  // Set up a mechanism to capture network responses.
  // We define a flag "done" to indicate when our target response has been processed.
  let done = false;
  
  // onResponse callback:
  // Listens for any network response. If the response URL contains '/api/georss',
  // we assume it is the JSON data containing map traffic or alerts.
  const onResponse = async response => {
    if (response.url().includes('/api/georss')) {
      try {
        // Try to parse the JSON data from the response.
        const data = await response.json();
        // Process and save the data via our helper function.
        await processTrafficData(data);
      } catch (err) {
        console.error('Failed to parse georss JSON:', err);
      }
      done = true; // Mark that processing is complete.
    }
  };
  
  // Attach the onResponse callback to the page's 'response' event.
  page.on('response', onResponse);
  
  // Wait for either the desired response (done becomes true) or a timeout of 30 seconds.
  await Promise.race([
    (async function waitForDone() {
      while (!done) await sleep(500); // Poll every 500ms to check if done.
    })(),
    sleep(30000) // Timeout after 30 seconds if no response matches.
  ]);
  
  // Remove the response event listener when finished (or timeout occurs).
  page.off('response', onResponse);
}

// constructURL({lat, lng}, zoom):
// Builds a URL for the Waze map using the provided coordinates and an optional zoom level.
// This URL is used to load the map centered on a particular zone.
function constructURL({ lat, lng }, zoom = 17) {
  return `https://ul.waze.com/ul?ll=${lat}%2C${lng}&navigate=yes&zoom=${zoom}&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location`;
}

// https://ul.waze.com/ul?ll=-33.437222%2C-70.657222&navigate=yes&zoom=17&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location

// regionZones:
// An array of coordinate objects representing various zones (areas) in the metropolitan region.
// Each zone will be scanned individually by generating a URL with its coordinates.
const regionZones = [
    // Provincia de Santiago
    { lat: -33.437222, lng: -70.657222 }, // Santiago
    { lat: -33.500000, lng: -70.716667 }, // Cerrillos
    { lat: -33.422000, lng: -70.735000 }, // Cerro Navia
    { lat: -33.380000, lng: -70.675000 }, // Conchalí
    { lat: -33.567000, lng: -70.675000 }, // El Bosque
    { lat: -33.459000, lng: -70.699000 }, // Estación Central
    { lat: -33.368000, lng: -70.634000 }, // Huechuraba
    { lat: -33.413000, lng: -70.666000 }, // Independencia
    { lat: -33.529000, lng: -70.663000 }, // La Cisterna
    { lat: -33.525000, lng: -70.538000 }, // La Florida
    { lat: -33.533000, lng: -70.625000 }, // La Granja
    { lat: -33.583000, lng: -70.634000 }, // La Pintana
    { lat: -33.443000, lng: -70.532000 }, // La Reina
    { lat: -33.416667, lng: -70.583333 }, // Las Condes
    { lat: -33.350000, lng: -70.516667 }, // Lo Barnechea
    { lat: -33.522000, lng: -70.687000 }, // Lo Espejo
    { lat: -33.445000, lng: -70.726000 }, // Lo Prado
    { lat: -33.487000, lng: -70.604000 }, // Macul
    { lat: -33.516667, lng: -70.766667 }, // Maipú
    { lat: -33.454000, lng: -70.604000 }, // Ñuñoa
    { lat: -33.466000, lng: -70.634000 }, // Pedro Aguirre Cerda
    { lat: -33.486000, lng: -70.533333 }, // Peñalolén
    { lat: -33.435000, lng: -70.616000 }, // Providencia
    { lat: -33.433333, lng: -70.716667 }, // Pudahuel
    // Other zones are defined below (covering additional provinces)
    { lat: -33.361000, lng: -70.729000 }, // Quilicura
    { lat: -33.427000, lng: -70.699000 }, // Quinta Normal
    { lat: -33.406000, lng: -70.640000 }, // Recoleta
    { lat: -33.398000, lng: -70.723000 }, // Renca
    { lat: -33.491000, lng: -70.628000 }, // San Joaquín
    { lat: -33.486000, lng: -70.649000 }, // San Miguel
    { lat: -33.533000, lng: -70.642000 }, // San Ramón
    { lat: -33.400000, lng: -70.600000 }, // Vitacura
  
    // Provincia de Cordillera
    { lat: -33.615999, lng: -70.570000 }, // Puente Alto
    { lat: -33.650000, lng: -70.563999 }, // Pirque
    { lat: -33.643999, lng: -70.352999 }, // San José de Maipo
  
    // Provincia de Chacabuco
    { lat: -33.193999, lng: -70.667999 }, // Colina
    { lat: -33.286000, lng: -70.877999 }, // Lampa
    { lat: -33.085000, lng: -70.925000 }, // Til Til
  
    // Provincia de Maipo
    { lat: -33.582000, lng: -70.687000 }, // San Bernardo
    { lat: -33.727000, lng: -70.739000 }, // Buin
    { lat: -33.628000, lng: -70.785000 }, // Calera de Tango
    { lat: -33.812000, lng: -70.722000 }, // Paine
  
    // Provincia de Melipilla
    { lat: -33.688000, lng: -71.207999 }, // Melipilla
    { lat: -34.033000, lng: -71.100000 }, // Alhué
    { lat: -33.398999, lng: -71.137000 }, // Curacaví
    { lat: -33.515000, lng: -71.119000 }, // María Pinto
    { lat: -33.900000, lng: -71.466999 }, // San Pedro
  
    // Provincia de Talagante
    { lat: -33.667000, lng: -70.930999 }, // Talagante
    { lat: -33.683000, lng: -71.017000 }, // El Monte
    { lat: -33.753999, lng: -70.885999 }, // Isla de Maipo
    { lat: -33.576000, lng: -70.800000 }, // Padre Hurtado
    { lat: -33.606000, lng: -70.876524 }  // Peñaflor
];

// An Immediately Invoked Async Function Expression (IIFE) is used to start the process.
// This function launches the browser, then continuously iterates through each zone.
// For every zone, it constructs the corresponding URL, opens a new page, and calls scanPoint()
// to capture and process the traffic data. Once complete, the page is closed.
(async () => {
  const browser = await initBrowser();
  
  // The outer loop can be designed for continuous scanning.
  // In this example, it loops only once per zone then closes the browser.
  // Adjust this loop to schedule repeated scans as needed.
  while(true){
    for (let zone of regionZones) {
      console.log(`\n🔍 Scanning zone at ${zone.lat}, ${zone.lng}`);
      // Construct the URL for the zone and open it in a new page.
      const page = await openPage(browser, constructURL(zone));
  
      try {
        // Attempt to scan the page (dismiss tooltips, zoom out, capture data)
        await scanPoint(page);
        console.log(`✅ Done scanning ${zone.lat}, ${zone.lng}`);
      } catch (err) {
        console.error(`⚠️ Error scanning ${zone.lat}, ${zone.lng}:`, err);
      }
  
      // Close the page to free resources before moving to the next zone.
      try {
        await page.close();
      } catch {}
    }
    // After scanning all zones, close the browser. 
    // If you wish to continuously scan (e.g. every few minutes), you can instead add a delay here.
    await browser.close();
    break; // Remove or modify this break to allow for repeated scanning.
  }
})();
