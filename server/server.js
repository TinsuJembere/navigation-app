import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

app.get("/", (req, res) => res.send("API running"));

// Production proxy routes for client
// Nominatim proxy - use middleware pattern
app.use("/api/nominatim", async (req, res, next) => {
  try {
    const target = `https://nominatim.openstreetmap.org${req.url}`;
    console.log("Proxying Nominatim:", target);

    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        "User-Agent": "SmartGuide/1.0 (+contact@example.com)",
        "Accept-Language": "en",
      },
    });

    const contentType = upstream.headers.get("content-type");
    res.status(upstream.status);
    res.setHeader("content-type", contentType || "application/json");

    const text = await upstream.text();
    res.send(text);
  } catch (e) {
    console.error("Nominatim proxy error:", e.message);
    res
      .status(502)
      .json({ error: "Nominatim proxy failed", details: e.message });
  }
});

// OSRM proxy
app.use("/api/osrm", async (req, res, next) => {
  try {
    const target = `https://router.project-osrm.org${req.url}`;
    console.log("Proxying OSRM:", target);

    const upstream = await fetch(target, {
      method: req.method,
    });

    const contentType = upstream.headers.get("content-type");
    res.status(upstream.status);
    res.setHeader("content-type", contentType || "application/json");

    const text = await upstream.text();
    res.send(text);
  } catch (e) {
    console.error("OSRM proxy error:", e.message);
    res.status(502).json({ error: "OSRM proxy failed", details: e.message });
  }
});

// Overpass proxy (for Nearby)
app.use("/api/overpass", async (req, res, next) => {
  try {
    const target = `https://overpass-api.de${req.url}`;
    console.log("Proxying Overpass:", target);

    let body = undefined;
    if (req.method === "POST") {
      // For POST requests, reconstruct the body
      if (typeof req.body === "string") {
        body = req.body;
      } else if (
        req.headers["content-type"]?.includes("x-www-form-urlencoded")
      ) {
        body = new URLSearchParams(req.body).toString();
      } else {
        body = JSON.stringify(req.body);
      }
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        "Content-Type":
          req.headers["content-type"] ||
          "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: body,
    });

    const contentType = upstream.headers.get("content-type");
    res.status(upstream.status);
    res.setHeader("content-type", contentType || "application/json");

    const text = await upstream.text();
    res.send(text);
  } catch (e) {
    console.error("Overpass proxy error:", e.message);
    res
      .status(502)
      .json({ error: "Overpass proxy failed", details: e.message });
  }
});

// Speed limit endpoints (using Overpass OSM maxspeed tags)
app.get("/api/speed-limit", async (req, res) => {
  try {
    const { lat, lon } = req.query || {};
    if (!lat || !lon)
      return res.status(400).json({ error: "lat and lon required" });
    // Find nearest way with maxspeed within 60m
    const query = `[
      out:json
    ];
    way(around:60,${lat},${lon})[highway][maxspeed];
    out tags center 1;`;
    const upstream = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({ data: query }).toString(),
    });
    const data = upstream.ok ? await upstream.json() : { elements: [] };
    const el = (data.elements || []).find((e) => e.tags && e.tags.maxspeed);
    if (!el) return res.json(null);
    const raw = el.tags.maxspeed;
    // Normalize common formats (e.g., "50", "50 km/h", "30 mph")
    let unit = "kmh";
    let speed = null;
    const mMph = /([0-9]+)\s*mph/i.exec(raw);
    const mKmh = /([0-9]+)\s*(km\/h|kph)?/i.exec(raw);
    if (mMph) {
      speed = parseInt(mMph[1], 10);
      unit = "mph";
    } else if (mKmh) {
      speed = parseInt(mKmh[1], 10);
      unit = "kmh";
    }
    if (!speed || Number.isNaN(speed)) return res.json(null);
    res.json({ speedLimit: speed, unit, roadName: el.tags.name || null });
  } catch (e) {
    res.json(null);
  }
});

app.post("/api/speed-limit/route", async (req, res) => {
  try {
    const { coordinates } = req.body || {};
    if (!Array.isArray(coordinates) || coordinates.length === 0)
      return res.json([]);
    const sample = coordinates.filter(
      (_, i) => i % Math.ceil(coordinates.length / 10) === 0
    ); // sample up to ~10 points
    const results = [];
    for (const [lat, lon] of sample) {
      const resp = await fetch(
        `${req.protocol}://${req.get(
          "host"
        )}/api/speed-limit?lat=${lat}&lon=${lon}`
      );
      const data = resp.ok ? await resp.json() : null;
      if (data) results.push({ lat, lon, ...data });
    }
    res.json(results);
  } catch {
    res.json([]);
  }
});

// Traffic endpoints (demo/heuristics; no paid provider)
app.post("/api/traffic/flow", async (req, res) => {
  try {
    const { coordinates } = req.body || {};
    if (!Array.isArray(coordinates) || coordinates.length < 2)
      return res.json(null);
    // Build simple segments with heuristic speeds (simulate congestion near mid-route)
    const segments = [];
    for (let i = 1; i < coordinates.length; i++) {
      const [lat1, lon1] = coordinates[i - 1];
      const [lat2, lon2] = coordinates[i];
      const ratio = i / coordinates.length;
      const freeFlow = 60; // km/h
      const current =
        ratio > 0.45 && ratio < 0.6
          ? Math.max(12, freeFlow * 0.35)
          : Math.max(25, freeFlow * (0.7 + 0.3 * Math.sin(ratio * Math.PI)));
      segments.push({
        coordinates: [
          [lon1, lat1],
          [lon2, lat2],
        ],
        currentSpeed: current,
        freeFlowSpeed: freeFlow,
      });
    }
    res.json({ segments });
  } catch {
    res.json(null);
  }
});

app.get("/api/traffic/incidents", async (req, res) => {
  try {
    const bboxStr = req.query.bbox;
    if (!bboxStr) return res.json([]);
    const [minLon, minLat, maxLon, maxLat] = bboxStr.split(",").map(Number);
    // Use Overpass to fetch road construction/closure notes as incidents
    const query = `[
      out:json
    ];
    (
      way[highway][construction](bbox:${minLat},${minLon},${maxLat},${maxLon});
      node[highway=traffic_signals](bbox:${minLat},${minLon},${maxLat},${maxLon});
    );
    out center 20;`;
    const upstream = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({ data: query }).toString(),
    });
    const data = upstream.ok ? await upstream.json() : { elements: [] };
    const incidents = (data.elements || []).slice(0, 20).map((el) => ({
      geometry: {
        coordinates: el.center
          ? [el.center.lon, el.center.lat]
          : [el.lon, el.lat],
      },
      properties: {
        iconCategory: el.tags?.construction ? "Road Works" : "Signal",
        events: [
          {
            description: el.tags?.note || el.tags?.name || "Traffic disruption",
          },
        ],
        delay: el.tags?.construction ? 300 : undefined,
      },
    }));
    res.json(incidents);
  } catch {
    res.json([]);
  }
});

app.post("/api/traffic/eta", async (req, res) => {
  try {
    const { start, end, mode = "drive" } = req.body || {};
    if (!start || !end)
      return res.status(400).json({ error: "start and end required" });
    const profile = mode === "walk" ? "foot" : "driving";
    const coords = `${start.lon},${start.lat};${end.lon},${end.lat}`;
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=false&geometries=geojson`;
    const upstream = await fetch(url);
    const data = upstream.ok ? await upstream.json() : null;
    const route = data?.routes?.[0];
    if (!route) return res.json(null);
    // Apply simple peak-hour factor
    const hour = new Date().getHours();
    let factor = 1;
    if (hour >= 7 && hour <= 9) factor = 1.25;
    if (hour >= 16 && hour <= 19) factor = Math.max(factor, 1.35);
    const duration = Math.round(route.duration * factor);
    res.json({ distance: route.distance, duration });
  } catch {
    res.json(null);
  }
});

// Simple JSON file persistence for saved maps
const dataDir = path.resolve(process.cwd(), "data");
const savedMapsFile = path.join(dataDir, "saved-maps.json");

function ensureDataFile() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(savedMapsFile))
      fs.writeFileSync(savedMapsFile, JSON.stringify({ maps: [] }, null, 2));
  } catch (e) {
    // fallthrough
  }
}

function readSavedMaps() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(savedMapsFile, "utf-8");
    const json = JSON.parse(raw || "{}");
    return Array.isArray(json.maps) ? json.maps : [];
  } catch {
    return [];
  }
}

function writeSavedMaps(maps) {
  ensureDataFile();
  fs.writeFileSync(savedMapsFile, JSON.stringify({ maps }, null, 2));
}

// CRUD routes
app.get("/api/saved-maps", (req, res) => {
  const maps = readSavedMaps();
  res.json(maps);
});

app.post("/api/saved-maps", (req, res) => {
  const { name, sizeMb, downloadedAt, imageUrl, bbox } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const maps = readSavedMaps();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const record = {
    id,
    name,
    sizeMb: typeof sizeMb === "number" ? sizeMb : null,
    downloadedAt: downloadedAt || new Date().toISOString(),
    imageUrl: imageUrl || null,
    bbox: bbox || null,
  };
  maps.push(record);
  writeSavedMaps(maps);
  res.status(201).json(record);
});

app.delete("/api/saved-maps/:id", (req, res) => {
  const { id } = req.params;
  const maps = readSavedMaps();
  const idx = maps.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const [removed] = maps.splice(idx, 1);
  writeSavedMaps(maps);
  res.json(removed);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
