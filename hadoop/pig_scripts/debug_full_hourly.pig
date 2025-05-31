-- Load cleaned events
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

-- Take first 5 records for debugging
sample_events = LIMIT events 5;

-- Extract hour information
events_with_hour = FOREACH sample_events GENERATE
    timestamp,
    SUBSTRING(timestamp, 11, 2) AS hour_str,
    (int)SUBSTRING(timestamp, 11, 2) AS hour_int;

-- Store debug output
STORE events_with_hour INTO '/pig/data/debug_hour_extraction' USING PigStorage(',');

-- Now test the full hourly analysis logic
all_events_with_hour = FOREACH events GENERATE
    *,
    (int)SUBSTRING(timestamp, 11, 2) AS hour_int;

-- Filter valid hours
valid_timestamp_events = FILTER all_events_with_hour BY hour_int IS NOT NULL AND hour_int >= 0 AND hour_int < 24;

-- Count valid events
valid_count = FOREACH (GROUP valid_timestamp_events ALL) GENERATE COUNT(valid_timestamp_events);
STORE valid_count INTO '/pig/data/debug_valid_count' USING PigStorage(',');

-- Group by hour
hourly_groups = GROUP valid_timestamp_events BY hour_int;
hourly_analysis = FOREACH hourly_groups GENERATE
    group AS hour,
    COUNT(valid_timestamp_events) AS count;

-- Store hourly results
STORE hourly_analysis INTO '/pig/data/debug_hourly_results' USING PigStorage(',');
