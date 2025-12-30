// Transit Service - Fetches real-time transit data

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://navigation-app-2.onrender.com";

class TransitService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
  }

  async getNearbyStops(lat, lon, radius = 500) {
    const cacheKey = `stops_${lat}_${lon}_${radius}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/transit/stops?lat=${lat}&lon=${lon}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error("Transit stops request failed");
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error("Transit stops error:", error);
      return [];
    }
  }

  async getStopArrivals(stopId) {
    try {
      const response = await fetch(
        `${API_BASE}/api/transit/arrivals/${stopId}`
      );

      if (!response.ok) {
        throw new Error("Transit arrivals request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Transit arrivals error:", error);
      return [];
    }
  }

  async getTransitRoute(start, end, time = null) {
    try {
      const params = new URLSearchParams({
        fromLat: start.lat,
        fromLon: start.lon,
        toLat: end.lat,
        toLon: end.lon,
      });

      if (time) {
        params.append("time", time);
      }

      const response = await fetch(`${API_BASE}/api/transit/route?${params}`);

      if (!response.ok) {
        throw new Error("Transit route request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Transit route error:", error);
      return null;
    }
  }

  async getTransitLines(bbox) {
    const cacheKey = `lines_${bbox.join(",")}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout * 5) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/transit/lines?bbox=${bbox.join(",")}`
      );

      if (!response.ok) {
        throw new Error("Transit lines request failed");
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error("Transit lines error:", error);
      return [];
    }
  }

  async getServiceAlerts(lat, lon, radius = 5000) {
    try {
      const response = await fetch(
        `${API_BASE}/api/transit/alerts?lat=${lat}&lon=${lon}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error("Service alerts request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Service alerts error:", error);
      return [];
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new TransitService();
