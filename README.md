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