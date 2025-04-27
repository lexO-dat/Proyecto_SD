const redis = require('redis');

const client = redis.createClient({
  url: 'redis://redis:6379' 
});

client.connect().catch(console.error);

async function getFromCache(key) {
  const data = await client.get(key);
  if (!data) return null;
  return JSON.parse(data);
}

async function saveToCache(key, value, ttlSeconds = 60) {
  await client.set(key, JSON.stringify(value), {
    EX: ttlSeconds
  });
}

module.exports = { getFromCache, saveToCache };