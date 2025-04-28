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
  'HAZARD',
  'POLICE',
  'CHIT_CHAT',
  'JAM',
  'ROAD_CLOSED',
  'ACCIDENT'
];

const TYPES = [
  'alert',
  'jam'
];

// ver si fueron insertados los parametros correctamente (FALTA STREETNAME)
if (process.argv.length < 6) {
  console.error('Uso: node randomGenerator.js <nro de queries> <prob. de incluir comuna> <prob. de incluir alerta> <prob. de incluir tipo>');
  process.exit(1);
}

const numQueries   = parseInt(process.argv[2], 10);
const probCommune  = parseFloat(process.argv[3]);
const probAlertType= parseFloat(process.argv[4]);
const probType     = parseFloat(process.argv[5]);
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

// Ejecuta la función sendRandomQuery numQueries veces con un delay de 40ms entre cada llamada y cuenta los hits en cache
(async () => {
  let conteo=0;
  for (let i = 0; i < numQueries; i++) {
    let hit = await sendRandomQuery();
    if (hit) {
      conteo++;
    }
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  console.log(`Total de hits en cache: ${conteo} de ${numQueries}`);
})();