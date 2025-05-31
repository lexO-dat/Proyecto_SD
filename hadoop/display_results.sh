#!/bin/bash

# Set proper permissions for this script
chmod +x display_results.sh

echo " Resultados de procesamiento de datos de eventos de tráfico"
echo

# Count total records
total_dedup=$(wc -l < cleaned_events.csv)
echo "DATASET OVERVIEW"
echo "├─ Original records processed: 18,390"
echo "├─ After deduplication: $total_dedup"
echo "└─ Data source: Santiago traffic events"
echo

# Event type analysis
echo "EVENT TYPE DISTRIBUTION"
echo "┌─────────────────────────────┬────────────┬─────────────┐"
echo "│ Event Type                  │ Count      │ Percentage  │"
echo "├─────────────────────────────┼────────────┼─────────────┤"
total_events=$(cat results/event_counts/part-r-00000 | cut -d',' -f2 | paste -sd+ | bc)
while IFS=',' read -r type count; do
    percentage=$(echo "scale=1; $count * 100 / $total_events" | bc)
    printf "│ %-27s │ %10s │ %10s%% │\n" "$type" "$count" "$percentage"
done < results/event_counts/part-r-00000
echo "├─────────────────────────────┼────────────┼─────────────┤"
printf "│ %-27s │ %10s │ %10s%% │\n" "TOTAL" "$total_events" "100.0"
echo "└─────────────────────────────┴────────────┴─────────────┘"
echo

echo "Top 15 comunnas con más eventos"
echo "┌─────────────────────────────┬────────────┐"
echo "│ Comuna                      │ Events     │"
echo "├─────────────────────────────┼────────────┤"
head -15 results/comuna_analysis/part-r-00000 | while IFS=',' read -r comuna count; do
    printf "│ %-27s │ %10s │\n" "$comuna" "$count"
done
echo "├─────────────────────────────┼────────────┤"
total_comunas=$(wc -l < results/comuna_analysis/part-r-00000)
printf "│ %-27s │ %10s │\n" "Total unique comunas" "$total_comunas"
echo "└─────────────────────────────┴────────────┘"
echo

echo "Top 15 sub tipos de eventos"
echo "┌─────────────────────────────┬────────────┐"
echo "│ Type-Subtype                │ Count      │"
echo "├─────────────────────────────┼────────────┤"
head -15 results/type_subtype_analysis/part-r-00000 | while IFS=',' read -r combination count; do
    printf "│ %-27s │ %10s │\n" "$combination" "$count"
done
echo "└─────────────────────────────┴────────────┘"
echo

echo "Distribución por horas"
if [ -s results/hourly_analysis/part-r-00000 ]; then
    echo "┌──────────┬────────────┬─────────────────────────────┐"
    echo "│ Hour     │ Count      │ Distribution                │"
    echo "├──────────┼────────────┼─────────────────────────────┤"
    max_count=$(cat results/hourly_analysis/part-r-00000 | cut -d',' -f2 | sort -n | tail -1)
    while IFS=',' read -r hour count; do
        bar_length=$(echo "scale=0; $count * 25 / $max_count" | bc)
        bar=$(printf "%*s" "$bar_length" | tr ' ' '█')
        printf "│ %8s │ %10s │ %-25s │\n" "${hour}:00" "$count" "$bar"
    done < results/hourly_analysis/part-r-00000
    echo "└──────────┴────────────┴─────────────────────────────┘"
else
    echo "No hourly data available (processing issue detected)"
    echo "   Timestamp format: $(head -1 cleaned_events.csv | cut -d',' -f12)"
    echo "   Sample timestamp analysis needed for debugging"
fi
echo