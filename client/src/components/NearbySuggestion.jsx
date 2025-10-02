import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "./SettingContent";

async function fetchNearby(lat, lon) {
  const radius = 1200; // meters

  // Try multiple data sources for better reliability
  try {
    // First try: Overpass API (OpenStreetMap data)
    const data = await fetchFromOverpass(lat, lon, radius);
    return { data, source: "OpenStreetMap (Live)" };
  } catch (error) {
    console.warn("Overpass API failed, trying Nominatim:", error);
    try {
      // Fallback: Nominatim reverse geocoding with nearby search
      const data = await fetchFromNominatim(lat, lon, radius);
      return { data, source: "Nominatim (Live)" };
    } catch (error2) {
      console.warn("Nominatim failed, using mock data:", error2);
      // Final fallback: Generate realistic mock data based on location
      const data = generateMockNearbyData(lat, lon);
      return { data, source: "Sample Data" };
    }
  }
}

async function fetchFromOverpass(lat, lon, radius) {
  const categories = [
    "amenity=cafe",
    "amenity=restaurant",
    "tourism=museum",
    "amenity=fuel",
    "leisure=park",
    "tourism=attraction",
    "amenity=fast_food",
    "amenity=hospital",
    "amenity=bank",
    "shop=supermarket",
  ];
  const filters = categories
    .map(
      (c) =>
        `node[${c}](around:${radius},${lat},${lon});way[${c}](around:${radius},${lat},${lon});relation[${c}](around:${radius},${lat},${lon});`
    )
    .join("");
  const query = `[out:json][timeout:15];(${filters});out center 20;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: new URLSearchParams({ data: query }).toString(),
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const data = await res.json();

  return (data.elements || [])
    .map((el) => {
      const name = el.tags?.name || getDefaultName(el.tags);
      const latC = el.lat || el.center?.lat;
      const lonC = el.lon || el.center?.lon;
      const kind =
        el.tags?.amenity ||
        el.tags?.tourism ||
        el.tags?.leisure ||
        el.tags?.shop ||
        "place";
      return { id: `${el.type}/${el.id}`, name, lat: latC, lon: lonC, kind };
    })
    .filter((p) => p.lat && p.lon && p.name !== "Unnamed");
}

async function fetchFromNominatim(lat, lon, radius) {
  // Search for nearby places using Nominatim
  const radiusKm = radius / 1000;
  const bbox = [
    lon - radiusKm * 0.01, // left
    lat - radiusKm * 0.01, // bottom
    lon + radiusKm * 0.01, // right
    lat + radiusKm * 0.01, // top
  ];

  const categories = [
    "restaurant",
    "cafe",
    "fuel",
    "hospital",
    "bank",
    "supermarket",
    "park",
    "museum",
  ];
  const results = [];

  for (const category of categories.slice(0, 4)) {
    // Limit to avoid rate limiting
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=3&viewbox=${bbox.join(
        ","
      )}&bounded=1&amenity=${category}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        results.push(
          ...data.map((item) => ({
            id: `nominatim/${item.place_id}`,
            name: item.display_name.split(",")[0],
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            kind: category,
          }))
        );
      }
    } catch (e) {
      console.warn(`Failed to fetch ${category} from Nominatim:`, e);
    }
  }

  return results;
}

function getDefaultName(tags) {
  if (tags?.amenity === "cafe") return "Local Cafe";
  if (tags?.amenity === "restaurant") return "Restaurant";
  if (tags?.amenity === "fuel") return "Gas Station";
  if (tags?.amenity === "hospital") return "Hospital";
  if (tags?.amenity === "bank") return "Bank";
  if (tags?.shop === "supermarket") return "Supermarket";
  if (tags?.leisure === "park") return "Park";
  if (tags?.tourism === "museum") return "Museum";
  return "Local Business";
}

function generateMockNearbyData(lat, lon) {
  // Generate realistic mock data based on location
  const mockPlaces = [
    { name: "Coffee Corner", kind: "cafe", offsetLat: 0.002, offsetLon: 0.001 },
    {
      name: "City Restaurant",
      kind: "restaurant",
      offsetLat: -0.001,
      offsetLon: 0.003,
    },
    {
      name: "Local Market",
      kind: "supermarket",
      offsetLat: 0.003,
      offsetLon: -0.002,
    },
    { name: "Gas Station", kind: "fuel", offsetLat: -0.002, offsetLon: -0.001 },
    {
      name: "Community Park",
      kind: "park",
      offsetLat: 0.001,
      offsetLon: 0.002,
    },
    {
      name: "Quick Bites",
      kind: "fast_food",
      offsetLat: -0.003,
      offsetLon: 0.001,
    },
    { name: "City Bank", kind: "bank", offsetLat: 0.002, offsetLon: -0.003 },
    {
      name: "Local Pharmacy",
      kind: "pharmacy",
      offsetLat: -0.001,
      offsetLon: -0.002,
    },
  ];

  return mockPlaces.map((place, index) => ({
    id: `mock/${index}`,
    name: place.name,
    lat: lat + place.offsetLat,
    lon: lon + place.offsetLon,
    kind: place.kind,
  }));
}

function formatDistanceKm(dMeters) {
  if (dMeters < 1000) return `${Math.round(dMeters)} m`;
  return `${(dMeters / 1000).toFixed(1)} km`;
}

function getPositionOnce(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function getPositionSmart() {
  if (!navigator.geolocation)
    throw Object.assign(new Error("unsupported"), { code: -1 });
  try {
    const pos = await getPositionOnce({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    });
    return pos;
  } catch {}
  try {
    const pos = await getPositionOnce({
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 15000,
    });
    return pos;
  } catch {}
  const pos = await new Promise((resolve, reject) => {
    let cleared = false;
    const clear = (id) => {
      if (!cleared) {
        cleared = true;
        if (id && navigator.geolocation.clearWatch)
          navigator.geolocation.clearWatch(id);
      }
    };
    const timer = setTimeout(() => {
      clear(watchId);
      reject(Object.assign(new Error("timeout"), { code: 3 }));
    }, 12000);
    let watchId = navigator.geolocation.watchPosition(
      (p) => {
        clearTimeout(timer);
        clear(watchId);
        resolve(p);
      },
      (err) => {
        clearTimeout(timer);
        clear(watchId);
        reject(err);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  });
  return pos;
}

const NearbySuggestions = () => {
  const navigate = useNavigate();
  const settings = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState(null);
  const [denied, setDenied] = useState(false);
  const [useLastKnown, setUseLastKnown] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataSource, setDataSource] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setDenied(false);

      try {
        const cached = localStorage.getItem("sg_last_geo");
        if (cached) {
          const o = JSON.parse(cached);
          if (o && typeof o.lat === "number" && typeof o.lon === "number") {
            if (!cancelled) {
              setOrigin(o);
              if (o.ts) setLastUpdated(new Date(o.ts));
              const result = await fetchNearby(o.lat, o.lon);
              if (!cancelled) {
                setDataSource(result.source);
                const withDistance = result.data
                  .map((p) => {
                    const dLat = ((p.lat - o.lat) * Math.PI) / 180;
                    const dLon = ((p.lon - o.lon) * Math.PI) / 180;
                    const a =
                      Math.sin(dLat / 2) ** 2 +
                      Math.cos((o.lat * Math.PI) / 180) *
                        Math.cos((p.lat * Math.PI) / 180) *
                        Math.sin(dLon / 2) ** 2;
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const dist = 6371000 * c;
                    return { ...p, distanceM: dist };
                  })
                  .sort((a, b) => a.distanceM - b.distanceM)
                  .slice(0, 8);
                setItems(withDistance);
              }
            }
          }
        }
      } catch {}

      try {
        const status = await (navigator.permissions?.query?.({
          name: "geolocation",
        }) || Promise.resolve({ state: "prompt" }));
        if (status.state === "denied") {
          if (!items.length) setDenied(true);
          return;
        }
        if (!useLastKnown || !items.length) {
          const pos = await getPositionSmart();
          const o = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          if (!cancelled) {
            localStorage.setItem(
              "sg_last_geo",
              JSON.stringify({ ...o, ts: Date.now() })
            );
            setOrigin(o);
            setLastUpdated(new Date());
            const result = await fetchNearby(o.lat, o.lon);
            if (!cancelled) {
              setDataSource(result.source);
              const withDistance = result.data
                .map((p) => {
                  const dLat = ((p.lat - o.lat) * Math.PI) / 180;
                  const dLon = ((p.lon - o.lon) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) ** 2 +
                    Math.cos((o.lat * Math.PI) / 180) *
                      Math.cos((p.lat * Math.PI) / 180) *
                      Math.sin(dLon / 2) ** 2;
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  const dist = 6371000 * c;
                  return { ...p, distanceM: dist };
                })
                .sort((a, b) => a.distanceM - b.distanceM)
                .slice(0, 8);
              setItems(withDistance);
            }
          }
        }
      } catch (e) {
        if (e && typeof e.code === "number" && e.code === 1) {
          if (!items.length) setDenied(true);
        } else if (!items.length) {
          setError("Could not get current location (timeout or unavailable).");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const retryLocate = useCallback(async () => {
    setLoading(true);
    setDenied(false);
    try {
      const pos = await getPositionSmart();
      const o = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      localStorage.setItem(
        "sg_last_geo",
        JSON.stringify({ ...o, ts: Date.now() })
      );
      setOrigin(o);
      setLastUpdated(new Date());
      const result = await fetchNearby(o.lat, o.lon);
      setDataSource(result.source);
      const withDistance = result.data
        .map((p) => {
          const dLat = ((p.lat - o.lat) * Math.PI) / 180;
          const dLon = ((p.lon - o.lon) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((o.lat * Math.PI) / 180) *
              Math.cos((p.lat * Math.PI) / 180) *
              Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = 6371000 * c;
          return { ...p, distanceM: dist };
        })
        .sort((a, b) => a.distanceM - b.distanceM)
        .slice(0, 8);
      setItems(withDistance);
    } catch (e) {
      setDenied(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const iconFor = useCallback((kind) => {
    if (kind === "cafe") return "☕";
    if (kind === "fast_food") return "🍔";
    if (kind === "restaurant") return "🍽️";
    if (kind === "museum") return "🏛️";
    if (kind === "fuel") return "⛽";
    if (kind === "park") return "🌳";
    if (kind === "attraction") return "🎯";
    if (kind === "hospital") return "🏥";
    if (kind === "bank") return "🏦";
    if (kind === "supermarket") return "🛒";
    if (kind === "pharmacy") return "💊";
    return "📍";
  }, []);

  return (
    <section>
      <h2
        className={`text-xl font-semibold mb-4 ${
          settings?.theme === "dark" ? "text-slate-200" : "text-slate-900"
        }`}
      >
        Nearby Suggestions
      </h2>
      {loading && (
        <div
          className={`flex items-center space-x-2 text-sm ${
            settings?.theme === "dark" ? "text-slate-400" : "text-slate-600"
          } mb-4`}
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading nearby places…</span>
        </div>
      )}
      {denied && (
        <div
          className={`text-sm ${
            settings?.theme === "dark"
              ? "text-amber-300 bg-amber-900/20 border-amber-700"
              : "text-amber-700 bg-amber-50 border-amber-200"
          } border rounded-md p-3 mb-3`}
        >
          Location access is blocked for this site. Please allow location in
          your browser settings and reload, or{" "}
          <button
            onClick={retryLocate}
            className="ml-1 underline font-semibold"
          >
            try again
          </button>
          .
        </div>
      )}
      {error && (
        <div
          className={`text-sm ${
            settings?.theme === "dark" ? "text-red-400" : "text-red-600"
          }`}
        >
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <label
            className={`flex items-center gap-2 text-sm ${
              settings?.theme === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <input
              type="checkbox"
              checked={useLastKnown}
              onChange={(e) => setUseLastKnown(e.target.checked)}
              className={settings?.theme === "dark" ? "accent-blue-500" : ""}
            />
            Use last known location
          </label>
          {!loading && (
            <button
              onClick={retryLocate}
              className={`text-xs px-2 py-1 rounded ${
                settings?.theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-700"
              } transition-colors`}
              title="Refresh nearby places"
            >
              🔄 Refresh
            </button>
          )}
        </div>
        <div className="text-right">
          {dataSource && (
            <div
              className={`text-xs ${
                settings?.theme === "dark" ? "text-slate-400" : "text-slate-500"
              } mb-1`}
            >
              Source: {dataSource}
            </div>
          )}
          {lastUpdated && (
            <div
              className={`text-xs ${
                settings?.theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      {!loading && !error && !denied && (
        <>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`flex items-center space-x-4 ${
                    settings?.theme === "dark"
                      ? "bg-slate-800 hover:bg-slate-700 border-slate-600"
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  } p-4 rounded-lg shadow-sm text-left border transition-colors`}
                  onClick={() =>
                    navigate(
                      `/map?q=${encodeURIComponent(item.name)}&mode=drive`
                    )
                  }
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 grid place-items-center ${
                      settings?.theme === "dark"
                        ? "bg-blue-900/50 text-blue-300"
                        : "bg-blue-50 text-blue-700"
                    } rounded-full text-lg`}
                  >
                    <span>{iconFor(item.kind)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold ${
                        settings?.theme === "dark"
                          ? "text-slate-200"
                          : "text-slate-900"
                      } truncate`}
                    >
                      {item.name}
                    </p>
                    {origin && (
                      <p
                        className={`text-sm ${
                          settings?.theme === "dark"
                            ? "text-slate-400"
                            : "text-gray-500"
                        }`}
                      >
                        {formatDistanceKm(item.distanceM)} away
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div
              className={`text-center py-8 ${
                settings?.theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm">No nearby places found</p>
              <p className="text-xs mt-1">
                Try refreshing or check your location
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default NearbySuggestions;
