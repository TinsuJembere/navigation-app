import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MapContainer as RLMap,
  TileLayer,
  Marker,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useSettings } from "./SettingContent";
import { useVoicePermission } from "./VoiceAssistant";
import { useSearchParams } from "react-router-dom";
import UpcomingTurns from "./UpcomingTurns";
import LaneGuidance from "./LaneGuidance";
import offlineManager from "../utils/offlineManager";
import TrafficLayer from "./TrafficLayer";
import SpeedLimitDisplay from "./SpeedLimitDisplay";
// Removed leaflet-routing-machine in favor of direct OSRM fetch + Polyline rendering

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function SetView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function InvalidateSizeOnMount({ deps = [] }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

// RoutingLayer removed

async function geocodeNominatim(query) {
  const url = `/api/nominatim/search?format=jsonv2&limit=1&q=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Failed to geocode");
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const { lat, lon, display_name } = data[0];
  return { center: [parseFloat(lat), parseFloat(lon)], label: display_name };
}

async function geocodePhoton(query) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
    query
  )}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to geocode");
  const data = await res.json();
  const f = data.features && data.features[0];
  if (!f) return null;
  const [lon, lat] = f.geometry.coordinates;
  const label =
    (f.properties && (f.properties.name || f.properties.label)) || query;
  return { center: [lat, lon], label };
}

async function geocodeAny(query) {
  try {
    const n = await geocodeNominatim(query);
    if (n) return n;
  } catch {}
  try {
    const p = await geocodePhoton(query);
    if (p) return p;
  } catch {}
  return null;
}

// Function to select the best route based on user preferences
function selectBestRoute(routes, settings) {
  if (!routes || routes.length === 0) return null;
  if (routes.length === 1) return routes[0];

  // Score routes based on preferences
  const scoredRoutes = routes.map((route) => {
    let score = 0;
    const legs = route.legs || [];

    // Analyze route steps for tolls and highways
    for (const leg of legs) {
      const steps = leg.steps || [];
      for (const step of steps) {
        const name = (step.name || "").toLowerCase();
        const maneuver = step.maneuver || {};

        // Check for toll roads
        if (
          settings?.avoidTolls &&
          (name.includes("toll") ||
            name.includes("turnpike") ||
            name.includes("parkway") ||
            maneuver.type === "toll")
        ) {
          score -= 100; // Heavy penalty for tolls
        }

        // Check for highways
        if (
          settings?.avoidHighways &&
          (name.includes("highway") ||
            name.includes("interstate") ||
            name.includes("freeway") ||
            name.includes("expressway") ||
            maneuver.type === "highway")
        ) {
          score -= 50;
        }
      }
    }

    if (settings?.preferShortest) {
      score += (1000 - route.distance) / 100;
    } else {
      score += (1000 - route.duration) / 10;
    }

    return { route, score };
  });

  scoredRoutes.sort((a, b) => b.score - a.score);
  return scoredRoutes[0].route;
}

const MapContainer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const settings = useSettings?.() || null;
  const { isVoiceEnabled, speak } = useVoicePermission();
  const initialCenter = useMemo(() => [40.7128, -74.006], []);
  const [center, setCenter] = useState(initialCenter);
  const [markerPos, setMarkerPos] = useState(null);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const mode = searchParams.get("mode") || "drive";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const speechRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [transitPath, setTransitPath] = useState(null);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [routePath, setRoutePath] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [geoError, setGeoError] = useState("");
  const [followMe, setFollowMe] = useState(true);
  const [preferenceNotification, setPreferenceNotification] = useState("");
  const [laneInfo, setLaneInfo] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(null);
  const [mapStyle, setMapStyle] = useState(
    () => localStorage.getItem("mapStyle") || "standard"
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasAnnouncedStep, setHasAnnouncedStep] = useState(false);
  const searchFormRef = useRef(null);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const curr = [pos.coords.latitude, pos.coords.longitude];
        if (followMe) setCenter(curr);
        setMarkerPos(curr);
        setOrigin(curr);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [followMe]);

  // Listen for map style changes
  useEffect(() => {
    const handleMapStyleChange = (event) => {
      setMapStyle(event.detail);
    };

    window.addEventListener("mapStyleChange", handleMapStyleChange);
    return () =>
      window.removeEventListener("mapStyleChange", handleMapStyleChange);
  }, []);

  // Voice guidance for step-by-step navigation
  useEffect(() => {
    if (!isVoiceEnabled || !routeSummary?.instructions || !origin) return;

    const instructions = routeSummary.instructions;
    if (currentStepIndex >= instructions.length) return;

    // Calculate distance to next turn based on current location
    // This is a simplified version - in a real app you'd use more precise positioning
    const currentInstruction = instructions[currentStepIndex];

    // Announce current step if not already announced
    if (!hasAnnouncedStep && currentInstruction) {
      speak(currentInstruction);
      setHasAnnouncedStep(true);
    }

    // Auto-advance to next step (simplified logic)
    const timer = setTimeout(() => {
      if (currentStepIndex < instructions.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        setHasAnnouncedStep(false);
      }
    }, 15000); // Advance every 15 seconds for demo purposes

    return () => clearTimeout(timer);
  }, [
    isVoiceEnabled,
    routeSummary,
    currentStepIndex,
    hasAnnouncedStep,
    origin,
    speak,
  ]);

  // Reset step tracking when route changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setHasAnnouncedStep(false);
  }, [routeSummary]);

  // Track live speed from geolocation (approximate)
  useEffect(() => {
    if (!navigator.geolocation) return;
    let last = null;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const point = {
          t: now,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        if (last) {
          const meters = haversineMeters(
            [last.lat, last.lon],
            [point.lat, point.lon]
          );
          const seconds = (now - last.t) / 1000;
          if (seconds > 0) {
            const mps = meters / seconds;
            const kmh = mps * 3.6;
            setCurrentSpeedKmh(kmh);
          }
        }
        last = point;
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch?.(id);
  }, []);

  useEffect(() => {
    function onLocate() {
      try {
        handleLocate();
      } catch {}
    }
    window.addEventListener("va:locate", onLocate);
    return () => window.removeEventListener("va:locate", onLocate);
  }, [handleLocate]);

  // When origin is acquired for the first time, center the map on it
  useEffect(() => {
    if (origin && !markerPos) {
      setCenter(origin);
      setMarkerPos(origin);
    }
  }, [origin, markerPos]);

  const performSearch = useCallback(async (q) => {
    if (!q) return;
    try {
      setLoading(true);
      setError("");
      const result = await geocodeAny(q);
      if (result) {
        setCenter(result.center);
        setMarkerPos(result.center);
        setSuggestions([]);
        setSuggestionsOpen(false);
      } else {
        setError("No results found");
      }
    } catch (e) {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const bboxParam = searchParams.get("bbox");
    if (bboxParam) {
      try {
        const bbox = JSON.parse(decodeURIComponent(bboxParam));
        if (Array.isArray(bbox) && bbox.length === 4) {
          const [minLon, minLat, maxLon, maxLat] = bbox.map(Number);
          const lat = (minLat + maxLat) / 2;
          const lon = (minLon + maxLon) / 2;
          const c = [lat, lon];
          setCenter(c);
          setMarkerPos(c);
          return; // Skip geocoding if bbox is provided
        }
      } catch {}
    }
    const q = searchParams.get("q");
    if (q) performSearch(q);
  }, [searchParams, performSearch]);

  useEffect(() => {
    // establish initial origin without forcing permission if already granted
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Watch live location updates to keep origin in sync
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError("");
        const curr = [pos.coords.latitude, pos.coords.longitude];
        setOrigin(curr);
        if (followMe) setCenter(curr);
      },
      (err) => {
        if (err?.code === 1) setGeoError("Location permission denied");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch?.(id);
  }, []);

  // Removed local speak function - using the one from useVoicePermission hook

  function haversineMeters(a, b) {
    if (!a || !b) return 0;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const la1 = toRad(lat1);
    const la2 = toRad(lat2);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  // Compute transit estimate and line when needed
  useEffect(() => {
    if (mode === "transit" && origin && markerPos) {
      const meters = Math.round(haversineMeters(origin, markerPos));
      // Transit estimate: average speed varies by time of day
      const hour = new Date().getHours();
      let speedKmh = 25; // base
      if (hour >= 7 && hour <= 9) speedKmh = 20; // morning peak
      if (hour >= 16 && hour <= 19) speedKmh = 18; // evening peak
      const durationMin = Math.max(
        1,
        Math.round((meters / 1000 / speedKmh) * 60)
      );
      setTransitPath([origin, markerPos]);
      setRouteSummary({
        distanceKm: (meters / 1000).toFixed(1),
        durationMin,
        mode: "transit",
      });
      setRoutePath(null);
    } else {
      setTransitPath(null);
    }
  }, [mode, origin, markerPos]);

  // Fetch OSRM route for drive/walk and draw a blue polyline
  useEffect(() => {
    async function fetchRoute() {
      if (!origin || !markerPos || mode === "transit") {
        setRoutePath(null);
        return;
      }
      try {
        setRouteError("");
        const profile = mode === "walk" ? "foot" : "driving";
        const coords = `${origin[1]},${origin[0]};${markerPos[1]},${markerPos[0]}`; // lon,lat;lon,lat
        // helper with timeout
        const fetchWithTimeout = (u, ms = 8000) => {
          const ctrl = new AbortController();
          const id = setTimeout(() => ctrl.abort(), ms);
          return fetch(u, { signal: ctrl.signal }).finally(() =>
            clearTimeout(id)
          );
        };
        // try primary OSRM via proxy
        let route = null;
        try {
          const params = new URLSearchParams({
            overview: "full",
            geometries: "geojson",
            steps: "true",
          });

          // Apply route preferences
          if (settings?.preferShortest) {
            params.set("alternatives", "false");
          }

          // For toll and highway avoidance, we'll try multiple routes and pick the best one
          if (settings?.avoidTolls || settings?.avoidHighways) {
            params.set("alternatives", "true");
            params.set("steps", "true");
          }

          const url = `/api/osrm/route/v1/${profile}/${coords}?${params.toString()}`;
          const res = await fetchWithTimeout(url);
          if (res.ok) {
            const data = await res.json();
            const routes = data.routes || [];

            if (routes.length > 0) {
              // If we have multiple routes and preferences, pick the best one
              if (
                routes.length > 1 &&
                (settings?.avoidTolls || settings?.avoidHighways)
              ) {
                route = selectBestRoute(routes, settings);
              } else {
                route = routes[0];
              }
            }
          }
        } catch {}
        // fallback: OSM DE routing (supports CORS); uses routed-car/foot
        if (!route) {
          const altProfile = profile === "foot" ? "routed-foot" : "routed-car";
          const altUrl = `https://routing.openstreetmap.de/${altProfile}/route/v1/${
            profile === "foot" ? "foot" : "driving"
          }/${coords}?overview=full&geometries=geojson`;
          const res2 = await fetchWithTimeout(altUrl, 9000);
          if (res2.ok) {
            const data2 = await res2.json();
            route = data2.routes && data2.routes[0];
          }
        }
        if (!route) {
          // attempt offline fallback via service worker cache
          try {
            const offline = await offlineManager.getOfflineRoute(
              { lat: origin[0], lon: origin[1] },
              { lat: markerPos[0], lon: markerPos[1] }
            );
            if (offline && Array.isArray(offline.coordinates)) {
              const coordsLatLngOff = offline.coordinates.map(([lon, lat]) => [
                lat,
                lon,
              ]);
              setRoutePath(coordsLatLngOff);
              setRouteSummary({
                distanceKm: (offline.distance / 1000).toFixed(1),
                durationMin: Math.round((offline.duration || 0) / 60),
                instructions: offline.steps?.map((s) => s.instruction) || [
                  "Offline route available",
                ],
                mode,
              });
              setLaneInfo(null);
              return;
            }
          } catch {}
          throw new Error("no route");
        }
        const baseMinutes = Math.round(route.duration / 60);
        let minutes = baseMinutes;
        if (mode === "drive") {
          const hour = new Date().getHours();
          let factor = 1;
          if (hour >= 7 && hour <= 9) factor = 1.25;
          if (hour >= 16 && hour <= 19) factor = Math.max(factor, 1.35);
          minutes = Math.round(baseMinutes * factor);
        }
        // Build turn-by-turn instructions from OSRM steps
        const legs = route.legs || [];
        const instructions = [];
        for (const leg of legs) {
          const steps = leg.steps || [];
          for (const step of steps) {
            const name = step.name || "";
            const maneuver = step.maneuver || {};
            const type = maneuver.type || "turn";
            const modifier = maneuver.modifier || "";
            const dist = Math.round(step.distance);
            const human = `${type}${modifier ? " " + modifier : ""}${
              name ? " onto " + name : ""
            } in ${dist} m`;
            instructions.push(human);
          }
          // Extract lane guidance from intersections
          try {
            const laneSteps = steps.filter(
              (s) =>
                Array.isArray(s.intersections) &&
                s.intersections.some(
                  (i) => Array.isArray(i.lanes) && i.lanes.length
                )
            );
            if (laneSteps.length) {
              const firstWithLanes = laneSteps[0];
              const inter = firstWithLanes.intersections.find(
                (i) => Array.isArray(i.lanes) && i.lanes.length
              );
              if (inter) {
                const lanes = inter.lanes.map((l) => ({
                  directions: (l.indications || []).map((x) => x || "straight"),
                  active: !!l.valid,
                }));
                const distTo = Math.round(firstWithLanes.distance || 0);
                setLaneInfo({ lanes, distance: distTo });
              } else {
                setLaneInfo(null);
              }
            } else {
              setLaneInfo(null);
            }
          } catch {
            setLaneInfo(null);
          }
        }
        // Build route preferences info
        const preferences = [];
        if (settings?.avoidTolls) preferences.push("No Tolls");
        if (settings?.avoidHighways) preferences.push("No Highways");
        if (settings?.preferShortest) preferences.push("Shortest Route");

        setRouteSummary({
          distanceKm: (route.distance / 1000).toFixed(1),
          durationMin: minutes,
          instructions,
          mode,
          preferences: preferences.length > 0 ? preferences.join(", ") : null,
        });
        const coordsLatLng = route.geometry.coordinates.map(([lon, lat]) => [
          lat,
          lon,
        ]);
        setRoutePath(coordsLatLng);
        // Only speak if voice is enabled
        if (isVoiceEnabled) {
          speak(
            `Starting ${mode} route. ${(route.distance / 1000).toFixed(
              1
            )} kilometers, approximately ${minutes} minutes.`
          );
        }
      } catch (e) {
        setRoutePath(null);
        setRouteError("Route server timeout. Try again or change mode.");
      }
    }
    fetchRoute();
  }, [
    origin,
    markerPos,
    mode,
    settings?.avoidTolls,
    settings?.avoidHighways,
    settings?.preferShortest,
  ]);

  // Show notification when route preferences change
  useEffect(() => {
    if (origin && markerPos && mode !== "transit") {
      const preferences = [];
      if (settings?.avoidTolls) preferences.push("No Tolls");
      if (settings?.avoidHighways) preferences.push("No Highways");
      if (settings?.preferShortest) preferences.push("Shortest Route");

      if (preferences.length > 0) {
        setPreferenceNotification(
          `Route updated with: ${preferences.join(", ")}`
        );
        setTimeout(() => setPreferenceNotification(""), 3000);
      }
    }
  }, [
    settings?.avoidTolls,
    settings?.avoidHighways,
    settings?.preferShortest,
    origin,
    markerPos,
    mode,
  ]);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      // Close suggestions immediately when search is submitted
      setSuggestionsOpen(false);
      setSuggestions([]);
      setSearchParams({ q, mode });
    },
    [query, mode, setSearchParams]
  );

  // Debounced autocomplete (Photon fallback, CORS-friendly)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    // Don't show suggestions if we're coming from a saved map (bbox parameter)
    const bboxParam = searchParams.get("bbox");
    if (bboxParam) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const id = setTimeout(async () => {
      try {
        // Try Photon first
        let opts = [];
        try {
          const urlPhoton = `https://photon.komoot.io/api/?q=${encodeURIComponent(
            q
          )}&limit=5`;
          const resP = await fetch(urlPhoton);
          if (resP.ok) {
            const dataP = await resP.json();
            opts = (dataP.features || []).map((f) => ({
              label:
                (f.properties && (f.properties.name || f.properties.label)) ||
                q,
              center: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            }));
          }
        } catch {}
        if (opts.length === 0) {
          const urlNom = `/api/nominatim/search?format=jsonv2&q=${encodeURIComponent(
            q
          )}&limit=5`;
          const resN = await fetch(urlNom, {
            headers: { "Accept-Language": "en" },
          });
          if (resN.ok) {
            const dataN = await resN.json();
            opts = (dataN || []).map((d) => ({
              label: d.display_name,
              center: [parseFloat(d.lat), parseFloat(d.lon)],
            }));
          }
        }
        setSuggestions(opts);
        setSuggestionsOpen(opts.length > 0);
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [query, searchParams]);

  // Close suggestions when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchFormRef.current &&
        !searchFormRef.current.contains(event.target)
      ) {
        setSuggestionsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <main
      className={`relative w-full ${
        settings?.theme === "dark" ? "bg-slate-900" : "bg-gray-100"
      }`}
    >
      {/* Map wrapper - stays in normal document flow */}
      <div
        className="relative w-full h-[60vh] sm:h-[65vh] md:h-[70vh] z-0"
        style={{ zIndex: 0 }}
      >
        <RLMap
          center={center}
          zoom={14}
          className="w-full h-full"
          whenCreated={(map) => {
            try {
              const update = () => setMapBounds(map.getBounds());
              map.on("moveend", update);
              map.on("zoomend", update);
              update();
            } catch {}
          }}
        >
          {mapStyle === "standard" && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={settings?.theme === "dark" ? 0.7 : 1}
              className={settings?.theme === "dark" ? "dark-map-tiles" : ""}
            />
          )}
          {mapStyle === "satellite" && (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              opacity={settings?.theme === "dark" ? 0.8 : 1}
            />
          )}
          <InvalidateSizeOnMount deps={[center]} />
          <SetView center={center} zoom={14} />
          {origin && (
            <CircleMarker
              center={origin}
              radius={8}
              pathOptions={{
                color: "#16a34a",
                fillColor: "#22c55e",
                fillOpacity: 0.8,
              }}
            />
          )}
          {markerPos && <Marker position={markerPos} icon={markerIcon} />}
          {origin && markerPos && mode !== "transit" && routePath && (
            <Polyline
              positions={routePath}
              pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.9 }}
            />
          )}
          {routePath && (
            <TrafficLayer routeCoordinates={routePath} bounds={mapBounds} />
          )}
          {origin && markerPos && mode === "transit" && transitPath && (
            <Polyline
              positions={transitPath}
              pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.9 }}
            />
          )}
        </RLMap>
      </div>

      {/* Overlays container (sibling of the map wrapper) */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 w-[min(720px,95%)] sm:w-[min(720px,92%)] pointer-events-auto">
          <form
            ref={searchFormRef}
            onSubmit={onSubmit}
            className={`flex items-center space-x-1 sm:space-x-2 ${
              settings?.theme === "dark" ? "bg-slate-800" : "bg-white"
            } p-2 rounded-full shadow-md relative`}
          >
            <input
              type="text"
              placeholder="Search places"
              className={`flex-1 px-2 sm:px-3 py-2 text-sm sm:text-base ${
                settings?.theme === "dark"
                  ? "text-slate-200 placeholder-slate-400"
                  : "text-gray-700"
              } focus:outline-none bg-transparent min-w-0`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                // Only show suggestions if we have them and not coming from saved map
                const bboxParam = searchParams.get("bbox");
                if (suggestions.length > 0 && !bboxParam) {
                  setSuggestionsOpen(true);
                }
              }}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 sm:px-5 py-2 rounded-full text-sm sm:text-base font-semibold hover:bg-blue-700 flex-shrink-0"
            >
              {loading ? "Searching…" : "Search"}
            </button>
            {suggestionsOpen && suggestions.length > 0 && (
              <div
                className={`absolute left-0 right-0 top-[110%] ${
                  settings?.theme === "dark"
                    ? "bg-slate-800 border-slate-600"
                    : "bg-white border-slate-200"
                } border rounded-lg shadow overflow-hidden`}
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuery(s.label);
                      setCenter(s.center);
                      setMarkerPos(s.center);
                      setSuggestions([]);
                      setSuggestionsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 ${
                      settings?.theme === "dark"
                        ? "text-slate-200 hover:bg-slate-700"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </form>
          {error && (
            <div
              className={`mt-2 text-sm text-red-600 ${
                settings?.theme === "dark" ? "bg-slate-800/90" : "bg-white/90"
              } rounded px-3 py-2 inline-block shadow`}
            >
              {error}
            </div>
          )}
          {preferenceNotification && (
            <div
              className={`mt-2 text-sm ${
                settings?.theme === "dark"
                  ? "text-green-400 bg-slate-800/90"
                  : "text-green-600 bg-white/90"
              } rounded px-3 py-2 inline-block shadow`}
            >
              {preferenceNotification}
            </div>
          )}
        </div>

        <div className="absolute right-4 bottom-105 flex flex-col space-y-3 z-50 pointer-events-auto">
          {/* Auto-follow Location Toggle */}
          <button
            onClick={() => setFollowMe((v) => !v)}
            className={`p-3 rounded-full shadow-lg border transition-all duration-200 ${
              followMe
                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                : settings?.theme === "dark"
                ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                : "bg-white border-slate-200 text-gray-700 hover:bg-gray-50"
            }`}
            title={
              followMe
                ? "Auto-follow ON - Click to disable"
                : "Auto-follow OFF - Click to enable"
            }
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v3m0 12v3m9-9h-3M6 12H3m13.364-5.364l-2.121 2.121M8.757 15.243l-2.121 2.121m0-9.9l2.121 2.121m6.486 6.486l2.121 2.121"
              />
            </svg>
            {followMe && (
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </button>

          {/* Show My Location */}
          <button
            onClick={handleLocate}
            className={`p-3 rounded-full shadow-lg border transition-all duration-200 ${
              settings?.theme === "dark"
                ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                : "bg-white border-slate-200 text-gray-700 hover:bg-gray-50"
            }`}
            title="Center map on my current location"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Voice Route Summary */}
          {routeSummary && (
            <button
              onClick={() => {
                const intro = `Route is ${routeSummary.distanceKm} kilometers, ${routeSummary.durationMin} minutes.`;
                speak(intro);
                if (Array.isArray(routeSummary.instructions)) {
                  for (const line of routeSummary.instructions.slice(0, 8)) {
                    speak(line);
                  }
                }
              }}
              className={`p-3 rounded-full shadow-lg border transition-all duration-200 ${
                settings?.theme === "dark"
                  ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "bg-white border-slate-200 text-gray-700 hover:bg-gray-50"
              }`}
              title="Listen to route summary and directions"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a1 1 0 01-1-1V8a1 1 0 011-1h1a1 1 0 011 1v3a1 1 0 01-1 1H9z"
                />
              </svg>
            </button>
          )}

          {/* Map Layers Toggle - New Feature */}
          <button
            onClick={() => {
              // Toggle between different map layers/styles
              const nextStyle =
                mapStyle === "standard" ? "satellite" : "standard";
              localStorage.setItem("mapStyle", nextStyle);
              // Force map refresh by dispatching custom event
              window.dispatchEvent(
                new CustomEvent("mapStyleChange", { detail: nextStyle })
              );
            }}
            className={`p-3 rounded-full shadow-lg border transition-all duration-200 ${
              mapStyle === "satellite"
                ? "bg-green-600 border-green-600 text-white hover:bg-green-700"
                : settings?.theme === "dark"
                ? "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                : "bg-white border-slate-200 text-gray-700 hover:bg-gray-50"
            }`}
            title={`Switch to ${
              mapStyle === "standard" ? "Satellite" : "Standard"
            } view`}
          >
            {mapStyle === "standard" ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            )}
            {mapStyle === "satellite" && (
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </button>
        </div>
      </div>

      {/* Route summary, Turn-by-turn and lane guidance panels */}
      <div className="max-w-3xl mx-auto px-2 sm:px-4 mt-2 sm:mt-4 mb-16 md:mb-4">
        {/* Route Summary Panel */}
        {(routeSummary || routeError) && (
          <div className="mb-4">
            <div
              className={`${
                settings?.theme === "dark"
                  ? "bg-slate-800/95 border-slate-600"
                  : "bg-white/98 border-slate-400"
              } border-2 rounded-xl shadow-xl px-4 py-3 text-sm backdrop-blur-lg`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`font-semibold ${
                    settings?.theme === "dark"
                      ? "text-slate-100"
                      : "text-slate-900"
                  }`}
                >
                  {routeSummary ? (
                    <div>
                      <div
                        className={`${
                          settings?.theme === "dark"
                            ? "text-slate-100"
                            : "text-slate-900"
                        }`}
                      >
                        {routeSummary.distanceKm} km •{" "}
                        {routeSummary.durationMin} min
                        {routeSummary.mode ? ` • ${routeSummary.mode}` : ""}
                      </div>
                      {routeSummary.preferences && (
                        <div
                          className={`text-xs ${
                            settings?.theme === "dark"
                              ? "text-blue-300"
                              : "text-blue-800"
                          } mt-1 font-medium`}
                        >
                          ✓ {routeSummary.preferences}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span
                      className={`${
                        settings?.theme === "dark"
                          ? "text-slate-300"
                          : "text-slate-700"
                      }`}
                    >
                      Enter a destination
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={`${
                    settings?.theme === "dark"
                      ? "text-slate-300 hover:text-slate-100"
                      : "text-slate-800 hover:text-slate-900"
                  } font-medium`}
                  onClick={() => setBottomOpen((v) => !v)}
                >
                  {bottomOpen ? "Hide" : "Show"}
                </button>
              </div>
              {bottomOpen && (
                <div
                  className={`mt-2 text-xs ${
                    settings?.theme === "dark"
                      ? "text-slate-300"
                      : "text-slate-700"
                  }`}
                >
                  {routeError ? (
                    <span
                      className={`${
                        settings?.theme === "dark"
                          ? "text-red-300"
                          : "text-red-600"
                      }`}
                    >
                      {routeError}
                    </span>
                  ) : origin && markerPos ? (
                    routeSummary?.instructions?.[0] ||
                    "From your location to destination"
                  ) : (
                    "Use the search to pick a destination"
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Turns */}
        {routeSummary?.instructions && (
          <UpcomingTurns
            instructions={routeSummary.instructions}
            currentStepIndex={isVoiceEnabled ? currentStepIndex : -1}
          />
        )}

        {/* Lane Guidance */}
        {laneInfo?.lanes && (
          <LaneGuidance lanes={laneInfo.lanes} distance={laneInfo.distance} />
        )}
      </div>

      {/* Speed limit display */}
      {origin && (
        <SpeedLimitDisplay
          currentLocation={{ lat: origin[0], lon: origin[1] }}
          currentSpeed={currentSpeedKmh}
        />
      )}
    </main>
  );
};

export default MapContainer;
