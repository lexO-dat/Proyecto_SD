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

-- Filtrar eventos válidos
clean_events = FILTER events BY type IS NOT NULL AND type != 'TYPE' AND type != '';

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
