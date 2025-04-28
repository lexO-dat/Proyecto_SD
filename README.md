# Compose
Para ejecutar el compose solo usa:
``` bash
sudo docker compose build --no-cache
sudo docker compose up
```

Esto ejecutará: 
- elastic en https:localhost:9200 con el user elastic y la pass changeme.
- El server del scraper el cual primero indexará el csv en batches de a 1000 para luego comenzar a scrapear waze.
- El server de consultas para la base de datos en localhost:8080, a este server se le pueden hacer las consultas que están especificadas más abajo.

# Random generator
Para ejecutar la funcion de generacion de trafico usa:
``` bash
cd generator
npm i
node node randomGenerator.js <nro de queries> <prob. de incluir comuna> <prob. de incluir alerta>
```

Esto enviara las x queries cada 40 ms

# Scrapper
Para instalar las dependencias del scrapper usa:

``` bash
cd /scrapper/
npm install
```
luego, para correr el servidor:
``` bash
node index.js
```

# Db server 
Para instalar las dependencias del modulo de la db:

``` bash
cd Elastic
npm install
```

luego, para correr el servidor:
``` bash
node server.js
```

curls para probar:
``` bash
curl 'http://localhost:3000/consultas'
```

``` bash
curl 'http://localhost:3000/consultas?alerttype=alert'
```

``` bash
curl 'http://localhost:3000/consultas?commune=Santiago'
```

``` bash
curl 'http://localhost:3000/consultas?alerttype=alert&commune=Santiago'
```
