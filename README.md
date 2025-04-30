# Compose

## 📋 Prerrequisitos
- **Docker** y **Docker Compose** instalados.
- **Node.js** (v14+) para los módulos JavaScript.
- Permisos de superusuario si ejecutas Docker con `sudo`.

---

## 🚀 Levantar los servicios con Docker Compose

1. **Detener contenedores activos**  
   ```bash
   sudo docker compose down
   ```
2. **Construir y arrancar**
```bash
sudo docker compose build --no-cache
sudo docker compose up
```
Esto iniciará:

- Elasticsearch en https://localhost:9200 (usuario: elastic, contraseña: changeme)

- Scraper:
1. Indexa traffic_data.csv en batches de 1 000 registros.
2. Comienza a scrapear datos de Waze.

- API de consultas en http://localhost:8080

## 🔀 Generador aleatorio de tráfico

```bash
cd generator
npm install
node randomGenerator.js <número de queries> <distribucion> <p₁: probabilidad de comuna> <p₂: probabilidad de alerta> <p₃: probabilidad de tipo>
```
Es recomendable esperar a que el scraper haya comenzado a procesar los datos de Waze antes de ejecutar el comando del generador de tráfico.

-Ejemplo:
```bash
node randomGenerator.js 1000 pareto 1 1 0
```
La rama main está preparada para emplear LRU (allkeys-lru), mientras que la rama random_metricas utiliza la política aleatoria (allkeys-random). 

## 📡 Scraper
**Instalar dependencias**
```bash
cd scrapper
npm install
```
Arrancar el servicio
```bash
node index.js
```
## 🗄️ Servidor de Base de Datos (Elastic)

**Instalar dependencias**
```bash
cd Elastic
npm install
```
Arrancar el servidor
```bash
node server.js
```
## ⚙️ Pruebas con `curl`

**Obtener todas las consultas:**
```bash
curl 'http://localhost:8080/consultas'
```
**Obtener todas las consultas:**
```bash
curl 'http://localhost:8080/consultas?alerttype=alert'
```

