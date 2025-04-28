// randomQueries.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const COMMUNES = [
  'Santiago', 'Providencia', 'Las Condes', 'Maipu', 'Vitacura', 'La Florida', 'Puente Alto'
];

const ALERT_TYPES = [
  'alert',
  'jam'
];

// ver si fueron insertados los parametros correctamente
if (process.argv.length < 5) {
  console.error('Uso: node randomQueries.js <nro de queries> <prob. de incluir comuna> <prob. de incluir alerta>');
  process.exit(1);
}

const numQueries   = parseInt(process.argv[2], 10);
const probCommune  = parseFloat(process.argv[3]);
const probAlertType= parseFloat(process.argv[4]);

function buildRandomQueryUrl(baseUrl = 'http://localhost:8080/consultas') {
  const useCommune   = Math.random() < probCommune;
  const useAlertType = Math.random() < probAlertType;

  const params = [];
  if (useCommune) {
    const randomCommune = COMMUNES[Math.floor(Math.random() * COMMUNES.length)];
    params.push(`commune=${encodeURIComponent(randomCommune)}`);
  }
  if (useAlertType) {
    const randomAlertType = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
    params.push(`alerttype=${encodeURIComponent(randomAlertType)}`);
  }

  return params.length > 0
    ? `${baseUrl}?${params.join('&')}`
    : baseUrl;
}

async function sendRandomQuery() {
  try {
    const url = buildRandomQueryUrl();
    const response = await fetch(url);
    const result   = await response.json();
    // Sólo mostramos la URL y si vino de cache
    console.log(`[QUERY]  ${url}`);
    console.log(`[CACHED] ${result.fromCache}`);
  } catch (err) {
    console.error('[ERROR]', err);
  }
}

(async () => {
  for (let i = 0; i < numQueries; i++) {
    await sendRandomQuery();
    await new Promise(resolve => setTimeout(resolve, 40));
  }
})();
