-- Simple count script

-- Cargar datos limpios
clean_events = LOAD '/pig/data/cleaned_events.csv' USING PigStorage(',') AS (
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

-- Contar registros totales
total_count = FOREACH (GROUP clean_events ALL) GENERATE COUNT(clean_events);
STORE total_count INTO '/pig/data/total_count' USING PigStorage(',');

-- Extraer hora y contar registros válidos
events_with_hour = FOREACH clean_events GENERATE
    timestamp,
    (int)SUBSTRING(timestamp, 11, 2) AS hour_int;

-- Filtrar eventos con hora válida
valid_timestamp_events = FILTER events_with_hour BY hour_int IS NOT NULL AND hour_int >= 0 AND hour_int < 24;

-- Contar registros con timestamp válido
valid_count = FOREACH (GROUP valid_timestamp_events ALL) GENERATE COUNT(valid_timestamp_events);
STORE valid_count INTO '/pig/data/valid_count' USING PigStorage(',');
