#!/bin/bash

# configuramos elastic 
ELASTIC_URL="http://es01:9200"
ELASTIC_USER="elastic"
ELASTIC_PASS="changeme"
INDEX_NAME="scrapperevents"

# archivos csv
CSV_FILE="/pig/data/new.csv"
BACKUP_FILE="/pig/data/new_backup.csv"

# Hacer backup del CSV existente si existe
if [ -f "$CSV_FILE" ]; then
    echo "Creando backup del CSV existente..."
    cp "$CSV_FILE" "$BACKUP_FILE"
fi

# Verificar conexión a Elasticsearch
echo "Verificando conexión a Elasticsearch..."
if ! curl -s -u "$ELASTIC_USER:$ELASTIC_PASS" "$ELASTIC_URL/_cluster/health" > /dev/null; then
    echo "Error: No se puede conectar a Elasticsearch"
    if [ -f "$BACKUP_FILE" ]; then
        echo "Usando archivo backup existente..."
        cp "$BACKUP_FILE" "$CSV_FILE"
        exit 0
    else
        echo "No hay archivo backup disponible. Abortando."
        exit 1
    fi
fi

echo "Conexión a Elasticsearch exitosa"

# obtenemos el total de documentos
TOTAL_DOCS=$(curl -s -u "$ELASTIC_USER:$ELASTIC_PASS" "$ELASTIC_URL/$INDEX_NAME/_count" | jq -r '.count')
echo "Total de documentos en $INDEX_NAME: $TOTAL_DOCS"

if [ "$TOTAL_DOCS" -eq 0 ]; then
    echo "No hay documentos en el índice. Creando CSV vacío..."
    echo "ID,TYPE,SUB_TYPE,COMMUNE,CITY,COUNTRY,STREET_NAME,DESCRIPTION,LATITUDE,LONGITUDE,USER,TIMESTAMP" > "$CSV_FILE"
    exit 0
fi

# creamos el csv temporal
TEMP_CSV="/tmp/elasticsearch_export.csv"

# Escribir encabezado CSV
echo "ID,TYPE,SUB_TYPE,COMMUNE,CITY,COUNTRY,STREET_NAME,DESCRIPTION,LATITUDE,LONGITUDE,USER,TIMESTAMP" > "$TEMP_CSV"

echo "Extrayendo datos de Elasticsearch..."

# Configurar scroll para manejar grandes volúmenes de datos
SCROLL_SIZE=1000
SCROLL_TIME="5m"

SCROLL_ID=$(curl -s -u "$ELASTIC_USER:$ELASTIC_PASS" \
    -H "Content-Type: application/json" \
    "$ELASTIC_URL/$INDEX_NAME/_search?scroll=$SCROLL_TIME&size=$SCROLL_SIZE" \
    -d '{
        "query": {"match_all": {}},
        "_source": ["data.*", "createdAt"]
    }' | jq -r '._scroll_id')

# contador
PROCESSED=0

while true; do
# batch de documentos
    RESPONSE=$(curl -s -u "$ELASTIC_USER:$ELASTIC_PASS" \
        -H "Content-Type: application/json" \
        "$ELASTIC_URL/_search/scroll" \
        -d "{\"scroll\": \"$SCROLL_TIME\", \"scroll_id\": \"$SCROLL_ID\"}")
    
    HITS_COUNT=$(echo "$RESPONSE" | jq -r '.hits.hits | length')
    
    if [ "$HITS_COUNT" -eq 0 ]; then
        break
    fi

    # procesado y conversion a CSV    
    echo "$RESPONSE" | jq -r '.hits.hits[]._source | 
        select(.data.commune != null and .data.commune != "undefined" and .data.commune != "") |
        [
            (.data.idEvent // "no-id"),
            (.data.alertType // "alert"),
            (.data.alertSubtype // ""),
            (.data.commune),
            (.data.city // .data.commune),
            (.data.country // "CL"),
            (.data.streetName // ""),
            (.data.description // ""),
            (.data.location.lat // "0"),
            (.data.location.lon // "0"),
            (.data.user // "guest"),
            (.data.timestamp // .createdAt // "")
        ] | @csv' >> "$TEMP_CSV"
    
    PROCESSED=$((PROCESSED + HITS_COUNT))
    echo "Procesados: $PROCESSED/$TOTAL_DOCS documentos"
    
    SCROLL_ID=$(echo "$RESPONSE" | jq -r '._scroll_id')
done

# limpieza del scroll
curl -s -u "$ELASTIC_USER:$ELASTIC_PASS" \
    -X DELETE "$ELASTIC_URL/_search/scroll" \
    -H "Content-Type: application/json" \
    -d "{\"scroll_id\": [\"$SCROLL_ID\"]}" > /dev/null

# movemos el temp CSV al destino final
mv "$TEMP_CSV" "$CSV_FILE"

# verificaciones
CSV_LINES=$(wc -l < "$CSV_FILE")
DATA_LINES=$((CSV_LINES - 1))  # Restar encabezado

# Mostrar muestra de los datos
echo ""
echo "Muestra de los primeros 3 registros:"
head -4 "$CSV_FILE" | tail -3 | while IFS=',' read -r id type subtype commune city country street desc lat lon user timestamp; do
    echo "  - ID: $id, Type: $type, Comuna: $commune"
done
