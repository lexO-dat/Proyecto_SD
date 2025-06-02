-- SCript para procesar la data

-- Limpiar directorios de salida anteriores
rmf /pig/results/event_counts;
rmf /pig/results/comuna_analysis;
rmf /pig/results/city_analysis;
rmf /pig/results/hourly_analysis;
rmf /pig/results/type_subtype_analysis;
rmf /pig/results/hour_debug_sample;
rmf /pig/results/valid_hour_count;

-- Cargar los datos de eventos filtrados y deduplicados
events = LOAD '/pig/data/cleaned_events.csv' USING PigStorage(',') AS (
    id:chararray,
    type:chararray,
    subtype:chararray,
    commune:chararray,
    city:chararray,
    country:chararray,
    street_name:chararray,
    description:chararray,
    latitude:chararray,
    longitude:chararray,
    user:chararray,
    timestamp:chararray
);

-- Filtrar eventos válidos
clean_events = FILTER events BY type IS NOT NULL AND type != 'TYPE' AND type != '';

-- Contar eventos por tipo
type_groups = GROUP clean_events BY type;
event_counts = FOREACH type_groups GENERATE
    group AS event_type,
    COUNT(clean_events) AS count;

-- Ordenar por cantidad
event_counts_sorted = ORDER event_counts BY count DESC;
STORE event_counts_sorted INTO '/pig/results/event_counts' USING PigStorage(',');

-- -----------------------------------

-- Eventos por comuna
comuna_groups = GROUP clean_events BY commune;
comuna_analysis = FOREACH comuna_groups GENERATE
    group AS commune,
    COUNT(clean_events) AS count;

-- Filtrar comunas válidas y ordenar
valid_comuna = FILTER comuna_analysis BY commune IS NOT NULL AND commune != 'undefined' AND commune != '';
comuna_sorted = ORDER valid_comuna BY count DESC;
STORE comuna_sorted INTO '/pig/results/comuna_analysis' USING PigStorage(',');

-- -----------------------------------

-- Eventos por ciudad
city_groups = GROUP clean_events BY city;
city_analysis = FOREACH city_groups GENERATE
    group AS city,
    COUNT(clean_events) AS count;

-- Filtrar ciudades válidas y ordenar
valid_city = FILTER city_analysis BY city IS NOT NULL AND city != 'undefined' AND city != '';
city_sorted = ORDER valid_city BY count DESC;
STORE city_sorted INTO '/pig/results/city_analysis' USING PigStorage(',');

-- -----------------------------------

-- Análisis por tipo y subtipo combinado
type_subtype_groups = GROUP clean_events BY (type, subtype);
type_subtype_analysis = FOREACH type_subtype_groups GENERATE
    CONCAT(CONCAT(group.type, '-'), (group.subtype IS NULL ? 'NONE' : group.subtype)) AS type_subtype,
    COUNT(clean_events) AS count;

-- Ordenar por cantidad
type_subtype_sorted = ORDER type_subtype_analysis BY count DESC;
STORE type_subtype_sorted INTO '/pig/results/type_subtype_analysis' USING PigStorage(',');

-- -----------------------------------

-- Análisis por hora del día
-- Procesar timestamps y extraer componentes de tiempo usando approach más simple
-- Formato esperado: "2025-06-02T12:06:36.000Z"

-- Paso 1: Extraer hora directamente usando REGEX_EXTRACT
events_with_hour = FOREACH clean_events GENERATE
    *,
    REPLACE(timestamp, '"', '') AS clean_timestamp,
    REGEX_EXTRACT(REPLACE(timestamp, '"', ''), '\\d{4}-\\d{2}-\\d{2}T(\\d{2}):', 1) AS hour_str;

-- Paso 2: Convertir a entero
events_with_hour_int = FOREACH events_with_hour GENERATE
    *,
    (hour_str IS NOT NULL AND hour_str != '' ? (int)hour_str : -1) AS hour_int;

-- Debug: Almacenar muestra para verificar
sample_debug = FOREACH (LIMIT events_with_hour_int 5) GENERATE
    clean_timestamp,
    hour_str,
    hour_int;
STORE sample_debug INTO '/pig/results/hour_debug_sample' USING PigStorage(',');

-- Filtrar eventos con hora válida
valid_timestamp_events = FILTER events_with_hour_int BY hour_int >= 0 AND hour_int < 24;

-- Contar eventos válidos para debug
valid_count = FOREACH (GROUP valid_timestamp_events ALL) GENERATE COUNT(valid_timestamp_events);
STORE valid_count INTO '/pig/results/valid_hour_count' USING PigStorage(',');

-- Agrupar por hora
hourly_groups = GROUP valid_timestamp_events BY hour_int;
hourly_analysis = FOREACH hourly_groups GENERATE
    group AS hour,
    COUNT(valid_timestamp_events) AS count;

-- Ordenar por hora numéricamente
hourly_sorted = ORDER hourly_analysis BY hour;
STORE hourly_sorted INTO '/pig/results/hourly_analysis' USING PigStorage(',');
