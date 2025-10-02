// Speed Limit Service - Fetches speed limit data

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

class SpeedLimitService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  async getSpeedLimit(lat, lon) {
    const cacheKey = `speed_${lat.toFixed(4)}_${lon.toFixed(4)}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/speed-limit?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        throw new Error("Speed limit request failed");
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error("Speed limit error:", error);
      return null;
    }
  }

  async getSpeedLimitsForRoute(coordinates) {
    try {
      const response = await fetch(`${API_BASE}/api/speed-limit/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates }),
      });

      if (!response.ok) {
        throw new Error("Route speed limits request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Route speed limits error:", error);
      return [];
    }
  }

  convertSpeed(speed, fromUnit, toUnit) {
    if (fromUnit === toUnit) return speed;

    if (fromUnit === "kmh" && toUnit === "mph") {
      return Math.round(speed * 0.621371);
    }
    if (fromUnit === "mph" && toUnit === "kmh") {
      return Math.round(speed * 1.60934);
    }

    return speed;
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new SpeedLimitService();
