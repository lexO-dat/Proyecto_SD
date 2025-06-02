-- Script para filtrar y deduplicar datos

-- Cargado de los datos originales
events = LOAD '/pig/data/new.csv' USING PigStorage(',') AS (
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

-- Filtrar eventos válidos y eliminar filas con "undefined"
clean_events = FILTER events BY 
    type IS NOT NULL AND type != 'TYPE' AND type != '' AND
    id IS NOT NULL AND id != 'ID' AND
    id != 'undefined' AND id != '' AND
    type != 'undefined' AND type != '' AND
    (subtype IS NULL OR (subtype != 'undefined' AND subtype != '')) AND
    commune IS NOT NULL AND commune != 'undefined' AND commune != '' AND
    (city IS NULL OR (city != 'undefined' AND city != '')) AND
    country IS NOT NULL AND country != 'undefined' AND country != '' AND
    (street_name IS NULL OR (street_name != 'undefined' AND street_name != '')) AND
    (description IS NULL OR (description != 'undefined' AND description != '')) AND
    (latitude IS NULL OR (latitude != 'undefined' AND latitude != '')) AND
    (longitude IS NULL OR (longitude != 'undefined' AND longitude != '')) AND
    (user IS NULL OR (user != 'undefined' AND user != '')) AND
    timestamp IS NOT NULL AND timestamp != 'undefined' AND timestamp != '';

-- Eliminar duplicados por ID (estamos tomando solo el primer registro de cada ID)
grouped_by_id = GROUP clean_events BY id;
deduplicated_events = FOREACH grouped_by_id GENERATE
    FLATTEN(TOP(1, 0, clean_events)) AS (
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

-- Guardado de los resultados para el procesado
STORE deduplicated_events INTO '/pig/data/clean_new' USING PigStorage(',');
