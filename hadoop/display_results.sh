#!/bin/bash

chmod +x display_results.sh

echo " Resultados de procesamiento de datos de eventos de tráfico"
echo

# Analisis por tipo de evento
echo "EVENT TYPE DISTRIBUTION"
echo "│ Event Type                  │ Count      │ Percentage  │"
total_events=$(cat results/event_counts/part-r-00000 | cut -d',' -f2 | paste -sd+ | bc)
while IFS=',' read -r type count; do
    percentage=$(echo "scale=1; $count * 100 / $total_events" | bc)
    printf "│ %-27s │ %10s │ %10s%% │\n" "$type" "$count" "$percentage"
done < results/event_counts/part-r-00000
echo "├─────────────────────────────┼────────────┼─────────────┤"
printf "│ %-27s │ %10s │ %10s%% │\n" "TOTAL" "$total_events" "100.0"
echo

echo "Top 15 comunnas con más eventos"
echo "│ Comuna                      │ Events     │"
head -15 results/comuna_analysis/part-r-00000 | while IFS=',' read -r comuna count; do
    printf "│ %-27s │ %10s │\n" "$comuna" "$count"
done
echo "├─────────────────────────────┼────────────┤"
total_comunas=$(wc -l < results/comuna_analysis/part-r-00000)
printf "│ %-27s │ %10s │\n" "Total unique comunas" "$total_comunas"
echo

echo "Top 15 sub tipos de eventos"
echo "│ Type-Subtype                │ Count      │"
head -15 results/type_subtype_analysis/part-r-00000 | while IFS=',' read -r combination count; do
    printf "│ %-27s │ %10s │\n" "$combination" "$count"
done
echo

echo "Distribución por horas"
if [ -s results/hourly_analysis/part-r-00000 ]; then
    echo "│ Hour     │ Count      │ Distribution                │"
    max_count=$(cat results/hourly_analysis/part-r-00000 | cut -d',' -f2 | sort -n | tail -1)
    while IFS=',' read -r hour count; do
        bar_length=$(echo "scale=0; $count * 25 / $max_count" | bc)
        bar=$(printf "%*s" "$bar_length" | tr ' ' '█')
        printf "│ %8s │ %10s │ %-25s │\n" "${hour}:00" "$count" "$bar"
    done < results/hourly_analysis/part-r-00000
else
    echo "No hourly data available (processing issue detected)"
    echo "   Debugging information:"
    if [ -s results/hour_debug_sample/part-r-00000 ]; then
        echo "   Sample hour extraction (first 3 rows):"
        head -3 results/hour_debug_sample/part-r-00000 | while IFS=',' read -r data; do
            echo "   $data"
        done
    fi
    if [ -s results/valid_hour_count/part-r-00000 ]; then
        valid_count=$(cat results/valid_hour_count/part-r-00000)
        echo "   Valid timestamp events found: $valid_count"
    fi
    echo "   Original timestamp format: $(head -1 cleaned_events.csv | cut -d',' -f12)"
fi
echo