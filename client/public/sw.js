const CACHE = 'sg-offline-v4';
const RUNTIME = 'runtime';
const TILES_CACHE = 'map-tiles';
const ROUTES_CACHE = 'offline-routes';
const CORE = [
  '/',
  '/index.html',
];

// IndexedDB for offline route storage
const DB_NAME = 'OfflineRoutesDB';
const DB_VERSION = 1;
const ROUTES_STORE = 'routes';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ROUTES_STORE)) {
        db.createObjectStore(ROUTES_STORE, { keyPath: 'id' });
      }
    };
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => ![CACHE, RUNTIME, TILES_CACHE, ROUTES_CACHE].includes(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Message handler for offline map downloads
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DOWNLOAD_TILES') {
    const { bbox, zoom, mapId } = event.data;
    downloadTilesForArea(bbox, zoom, mapId).then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  } else if (event.data && event.data.type === 'CACHE_ROUTE') {
    const { routeData } = event.data;
    cacheRouteData(routeData).then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  } else if (event.data && event.data.type === 'GET_OFFLINE_ROUTE') {
    const { start, end } = event.data;
    getOfflineRoute(start, end).then((route) => {
      event.ports[0].postMessage({ success: true, route });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  } else if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ success: true, size });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  }
});

// Download map tiles for a specific area
async function downloadTilesForArea(bbox, zoom, mapId) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const cache = await caches.open(TILES_CACHE);
  const tiles = [];
  
  // Calculate tile coordinates
  for (let z = Math.max(zoom - 2, 1); z <= Math.min(zoom + 2, 18); z++) {
    const minTileX = lon2tile(minLon, z);
    const maxTileX = lon2tile(maxLon, z);
    const minTileY = lat2tile(maxLat, z);
    const maxTileY = lat2tile(minLat, z);
    
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  
  // Download tiles in batches
  const batchSize = 10;
  for (let i = 0; i < tiles.length; i += batchSize) {
    const batch = tiles.slice(i, i + batchSize);
    await Promise.all(batch.map(async ({ z, x, y }) => {
      const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'SmartGuide/1.0' }
        });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (e) {
        // Continue on error
      }
    }));
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

function lon2tile(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

// Cache route data for offline use
async function cacheRouteData(routeData) {
  const db = await openDB();
  const transaction = db.transaction([ROUTES_STORE], 'readwrite');
  const store = transaction.objectStore(ROUTES_STORE);
  
  const id = `${routeData.start.lat},${routeData.start.lon}_${routeData.end.lat},${routeData.end.lon}`;
  await store.put({
    id,
    ...routeData,
    cachedAt: Date.now()
  });
}

// Get offline route
async function getOfflineRoute(start, end) {
  const db = await openDB();
  const transaction = db.transaction([ROUTES_STORE], 'readonly');
  const store = transaction.objectStore(ROUTES_STORE);
  
  const id = `${start.lat},${start.lon}_${end.lat},${end.lon}`;
  const cached = await store.get(id);
  
  if (cached) {
    return cached;
  }
  
  // Fallback: create simple straight-line route
  return {
    coordinates: [[start.lon, start.lat], [end.lon, end.lat]],
    distance: calculateDistance(start.lat, start.lon, end.lat, end.lon),
    duration: calculateDistance(start.lat, start.lon, end.lat, end.lon) / 1000 * 60,
    steps: [{
      instruction: `Head towards destination (${calculateDistance(start.lat, start.lon, end.lat, end.lon).toFixed(0)}m)`,
      distance: calculateDistance(start.lat, start.lon, end.lat, end.lon)
    }]
  };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Get cache size
async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentage: (estimate.usage / estimate.quota * 100).toFixed(2)
    };
  }
  return null;
}

// Enhanced cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  const isTile = /tile\.openstreetmap\.org/.test(url.hostname);
  const isApi = url.pathname.startsWith('/api/osrm') || url.pathname.startsWith('/api/nominatim');
  const isOverpass = url.pathname.startsWith('/api/overpass');

  if (isTile) {
    event.respondWith(
      caches.open(TILES_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  if (isApi || isOverpass) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});