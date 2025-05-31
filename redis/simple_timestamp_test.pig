-- Test basic hourly extraction logic with hardcoded data

-- Create test data
test_data = LOAD '/pig/data/cleaned_events.csv' USING PigStorage(',') AS (
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

-- Take first record only
first_record = LIMIT test_data 1;

-- Extract components step by step
test_extraction = FOREACH first_record GENERATE
    timestamp,
    SIZE(timestamp) AS timestamp_length,
    SUBSTRING(timestamp, 0, 10) AS date_part,
    SUBSTRING(timestamp, 11, 8) AS time_part,
    SUBSTRING(timestamp, 11, 2) AS hour_str;

STORE test_extraction INTO '/pig/results/timestamp_debug' USING PigStorage(',');
