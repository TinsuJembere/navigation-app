// Traffic Service - Fetches real-time traffic data

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://navigation-app-2.onrender.com";

class TrafficService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getTrafficFlow(coordinates) {
    const cacheKey = `flow_${coordinates.map((c) => c.join(",")).join("_")}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/api/traffic/flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates }),
      });

      if (!response.ok) {
        throw new Error("Traffic flow request failed");
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error("Traffic flow error:", error);
      return null;
    }
  }

  async getTrafficIncidents(bbox) {
    const cacheKey = `incidents_${bbox.join(",")}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/traffic/incidents?bbox=${bbox.join(",")}`
      );

      if (!response.ok) {
        throw new Error("Traffic incidents request failed");
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error("Traffic incidents error:", error);
      return [];
    }
  }

  async getETAWithTraffic(start, end, mode = "drive") {
    try {
      const response = await fetch(`${API_BASE}/api/traffic/eta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, end, mode }),
      });

      if (!response.ok) {
        throw new Error("ETA request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("ETA error:", error);
      return null;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new TrafficService();
