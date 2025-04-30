// randomQueries.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const COMMUNES = [
  'Santiago',
  'Cerrillos',
  'Cerro Navia',
  'Conchalí',
  'El Bosque',
  'Estación Central',
  'Huechuraba',
  'Independencia',
  'La Cisterna',
  'La Florida',
  'La Granja',
  'La Pintana',
  'La Reina',
  'Las Condes',
  'Lo Barnechea',
  'Lo Espejo',
  'Lo Prado',
  'Macul',
  'Maipú',
  'Ñuñoa',
  'Pedro Aguirre Cerda',
  'Peñalolén',
  'Providencia',
  'Pudahuel',
  'Quilicura',
  'Quinta Normal',
  'Recoleta',
  'Renca',
  'San Joaquín',
  'San Miguel',
  'San Ramón',
  'Vitacura',
  'Puente Alto',
  'Pirque',
  'San José de Maipo',
  'Colina',
  'Lampa',
  'Til Til',
  'San Bernardo',
  'Buin',
  'Calera de Tango',
  'Paine',
  'Melipilla',
  'Alhué',
  'Curacaví',
  'María Pinto',
  'San Pedro',
  'Talagante',
  'El Monte',
  'Isla de Maipo',
  'Padre Hurtado',
  'Peñaflor'
];

const ALERT_TYPES = [
  'POLICE',
  'JAM',
  'ACCIDENT'
];

const TYPES = [
  'alert',
  'jam'
];

// ver si fueron insertados los parametros correctamente (FALTA STREETNAME)
if (process.argv.length < 7) {
  console.error('Uso: node randomGenerator.js <nro de queries> <distribucion> <prob. de incluir comuna> <prob. de incluir alerta> <prob. de incluir tipo>');
  process.exit(1);
}

const numQueries   = parseInt(process.argv[2], 10);
const distribution = process.argv[3];
const probCommune  = parseFloat(process.argv[4]);
const probAlertType= parseFloat(process.argv[5]);
const probType     = parseFloat(process.argv[6]);
// const probStreetName = parseFloat(process.argv[6]);

function buildRandomQueryUrl(baseUrl = 'http://localhost:8080/consultas') {
  const useCommune   = Math.random() < probCommune;
  const useAlertType = Math.random() < probAlertType;
  const useType      = Math.random() < probType;
  // const useStreetName = Math.random() < probStreetName;

  const params = [];
  if (useCommune) {
    const randomCommune = COMMUNES[Math.floor(Math.random() * COMMUNES.length)];
    params.push(`commune=${encodeURIComponent(randomCommune)}`);
  }
  if (useAlertType) {
    const randomAlertType = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
    params.push(`alerttype=${encodeURIComponent(randomAlertType)}`);
  }
  if (useType) {
    const randomType = TYPES[Math.floor(Math.random() * TYPES.length)];
    params.push(`type=${encodeURIComponent(randomType)}`);
  }
  // if (useStreetName) {
  //   const randomStreetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
  //   params.push(`streetname=${encodeURIComponent(randomStreetName)}`);
  // }

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
    return result.fromCache;
  } catch (err) {
    console.error('[ERROR]', err);
  }
}

function normalRandom(mean, stdDev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

// Ejecuta la función sendRandomQuery numQueries veces y cuenta los hits en cache
(async () => {
  let conteo = 0;
  const x_m = 40;
  const alpha = 2;

  for (let i = 0; i < numQueries; i++) {
    let hit = await sendRandomQuery();
    if (hit) {
      conteo++;
    }
    
    // distribucion  pareto
    if (distribution == 'pareto'){
      const u = Math.random();
      const delay = x_m / Math.pow(u, 1 / alpha);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // distribucion normal
    if (distribution === 'normal'){
      const sigma = 10;
      let delay = normalRandom(x_m, sigma);
      if(delay < 0) {
        delay = 0;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  console.log(`Total de hits en cache: ${conteo} de ${numQueries}`);
})();