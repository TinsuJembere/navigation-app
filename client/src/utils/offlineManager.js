// Offline Manager - Handles communication with Service Worker for offline functionality

class OfflineManager {
  constructor() {
    this.sw = null;
    this.init();
  }

  async init() {
    if ("serviceWorker" in navigator) {
      try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;
        this.sw = registration.active;

        // If still not active, wait for it
        if (!this.sw && registration.installing) {
          await new Promise((resolve) => {
            registration.installing.addEventListener("statechange", (e) => {
              if (e.target.state === "activated") {
                this.sw = registration.active;
                resolve();
              }
            });
          });
        }
      } catch (error) {
        console.error("Service Worker not available:", error);
      }
    }
  }

  async downloadMapTiles(bbox, zoom, mapId) {
    // Ensure service worker is ready
    if (!this.sw) {
      await this.init();
    }

    if (!this.sw) {
      throw new Error("Service Worker not available. Please refresh the page.");
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error("Download timeout - please try again"));
      }, 300000); // 5 minutes timeout

      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error || "Download failed"));
        }
      };

      this.sw.postMessage(
        {
          type: "DOWNLOAD_TILES",
          bbox,
          zoom,
          mapId,
        },
        [messageChannel.port2]
      );
    });
  }

  async cacheRoute(routeData) {
    if (!this.sw) {
      throw new Error("Service Worker not available");
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error || "Cache failed"));
        }
      };

      this.sw.postMessage(
        {
          type: "CACHE_ROUTE",
          routeData,
        },
        [messageChannel.port2]
      );
    });
  }

  async getOfflineRoute(start, end) {
    if (!this.sw) {
      throw new Error("Service Worker not available");
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.route);
        } else {
          reject(new Error(event.data.error || "Route not found"));
        }
      };

      this.sw.postMessage(
        {
          type: "GET_OFFLINE_ROUTE",
          start,
          end,
        },
        [messageChannel.port2]
      );
    });
  }

  async getCacheSize() {
    if (!this.sw) {
      throw new Error("Service Worker not available");
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.size);
        } else {
          reject(new Error(event.data.error || "Failed to get cache size"));
        }
      };

      this.sw.postMessage(
        {
          type: "GET_CACHE_SIZE",
        },
        [messageChannel.port2]
      );
    });
  }

  isOnline() {
    return navigator.onLine;
  }

  onConnectionChange(callback) {
    window.addEventListener("online", () => callback(true));
    window.addEventListener("offline", () => callback(false));
  }
}

export default new OfflineManager();
