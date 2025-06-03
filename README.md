# 📦 Proyecto Sistemas Distribuidos – Entrega 2

Este sistema permite recolectar, almacenar, filtrar y analizar eventos de tráfico extraídos desde Waze, utilizando tecnologías distribuidas como **Elasticsearch**, **Apache Pig** y **Hadoop**. A través de un pipeline completo, los datos se normalizan, se procesan en paralelo y se preparan para la toma de decisiones geográficas y temporales.

---

## ✅ Requisitos previos

- **Docker** y **Docker Compose** instalados.
- **Node.js v14+** para ejecutar los módulos JavaScript.
- Permisos de superusuario (`sudo`) si el entorno lo requiere.

---

## 🚀 Despliegue con Docker Compose

### 1. Detener contenedores previos (opcional)
```bash
sudo docker compose down
```

### 2. Construir y levantar los servicios
```bash
sudo docker compose build --no-cache
sudo docker compose up
```

Esto iniciará los siguientes componentes:

- **Elasticsearch** (https://localhost:9200)  
  - Usuario: `elastic`  
  - Contraseña: `changeme`

- **Scraper**
  - Indexa el archivo inicial `traffic_data.csv` (usado como dataset base).
  - Inicia el scraping en tiempo real de eventos desde Waze.

- **Servidor de consultas internas** (http://localhost:8080)  
  - Permite ejecutar búsquedas simples sobre los eventos almacenados.

---

## 🧠 Filtrado y análisis distribuido (Apache Pig)

### 1. Asegurarse de que Docker esté corriendo y que `traffic_data.csv` ya esté indexado en Elasticsearch.

### 2. Ejecutar el análisis
```bash
cd hadoop/
./run_analysis.sh
```

Este script ejecuta el perfil `hadoop-analytics` de Docker Compose y realiza:

1. Extracción de eventos desde Elasticsearch (`fetch_from_elastic.sh`)
2. Filtrado y normalización (`filter_data.pig`)
3. Procesamiento analítico (`process_events.pig`)

### 3. Visualizar los resultados

Una vez finalizado el análisis, espera a que el sistema muestre el mensaje:

> `Análisis completado, ejecuta ./hadoop/display_results.sh para ver los resultados.`

Luego, ejecuta el siguiente comando para visualizar los resultados procesados:

```bash
./display_results.sh
```

Este script mostrará en consola los archivos de salida generados por Apache Pig, los cuales contienen las consultas analíticas realizadas, como el conteo de eventos por tipo, distribución por comuna y evolución temporal. Estas salidas representan la fase final del pipeline de análisis.

---

## 🔍 Scraper – Recolección de eventos

Ubicación: `Proyecto_SD/scrapper/`

### Instalación y ejecución
```bash
cd scrapper
npm install
node index.js
```

El scraper extrae datos desde Waze usando Puppeteer, procesándolos y enviándolos directamente a Elasticsearch. Incluye mejoras como extracción de ID de evento, hora reportada y nombre de usuario.

---

## 🗄️ Servidor de consultas internas (Elasticsearch)

Ubicación: `Proyecto_SD/Elastic/`

Este módulo permite realizar consultas básicas sobre los datos almacenados.

### Instalación y ejecución
```bash
cd Elastic
npm install
node server.js
```

### Ejemplos de consulta con `curl`
```bash
curl 'http://localhost:8080/consultas'
curl 'http://localhost:8080/consultas?alerttype=alert'
```

---

## 🧪 Generador de tráfico aleatorio (Entrega 1)

Ubicación: `Proyecto_SD/generator/`

Simula peticiones de consulta al sistema usando distintas distribuciones.

### Uso
```bash
cd generator
npm install
node randomGenerator.js <n_consultas> <distribucion> <p1> <p2> <p3>
```

Ejemplo:
```bash
node randomGenerator.js 1000 pareto 1 1 0
```

- `p1`: probabilidad de filtro por comuna  
- `p2`: probabilidad de filtro por tipo de alerta  
- `p3`: probabilidad de filtro por tipo de incidente  

> 🔁 La rama `main` usa política de cacheo LRU (`allkeys-lru`).  
> 🔀 La rama `random_metricas` usa política aleatoria (`allkeys-random`).
