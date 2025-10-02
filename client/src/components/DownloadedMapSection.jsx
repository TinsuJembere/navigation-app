import React, { useEffect, useMemo, useState } from "react";
import { useSettings } from "./SettingContent";
import offlineManager from "../utils/offlineManager";

function estimateSizeMbFromBbox(bbox) {
  if (!bbox) return 100;
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const area = Math.abs((maxLon - minLon) * (maxLat - minLat));
  return Math.max(80, Math.min(400, Math.round(area * 12000)));
}

const DownloadMapSection = ({ onSaved }) => {
  const [query, setQuery] = useState("");
  const [bbox, setBbox] = useState(null);
  const [centerLabel, setCenterLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [zoom, setZoom] = useState(13);
  const settings = useSettings();
  const sizeMb = useMemo(() => estimateSizeMbFromBbox(bbox), [bbox]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setBbox(null);
      setCenterLabel("");
      return;
    }
    const id = setTimeout(async () => {
      try {
        const url = `/api/nominatim/search?format=jsonv2&q=${encodeURIComponent(
          q
        )}&limit=1&polygon_geojson=0&addressdetails=0&bounded=0`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        if (!res.ok) return;
        const data = await res.json();
        const first = data && data[0];
        if (!first) {
          setBbox(null);
          setCenterLabel("");
          return;
        }
        const bb = [
          parseFloat(first.boundingbox[2]),
          parseFloat(first.boundingbox[0]),
          parseFloat(first.boundingbox[3]),
          parseFloat(first.boundingbox[1]),
        ];
        setBbox(bb);
        setCenterLabel(first.display_name);
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  async function handleDownload() {
    if (!centerLabel || !bbox) return;
    setLoading(true);
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const body = {
        name: centerLabel,
        sizeMb,
        bbox,
      };
      const res = await fetch("/api/saved-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const rec = await res.json();

        setDownloadProgress(10);
        await offlineManager.downloadMapTiles(bbox, zoom, rec.id);
        setDownloadProgress(100);

        onSaved && onSaved(rec);
        setQuery("");
        setBbox(null);
        setCenterLabel("");

        setTimeout(() => {
          setDownloading(false);
          setDownloadProgress(0);
        }, 1000);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download map. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`${
        settings?.theme === "dark" ? "bg-slate-800" : "bg-white"
      } p-6 rounded-lg shadow-md mb-6`}
    >
      <h2
        className={`text-xl font-semibold mb-4 ${
          settings?.theme === "dark" ? "text-slate-200" : "text-slate-900"
        }`}
      >
        Download New Map Area
      </h2>

      <div
        className={`flex items-center space-x-2 border ${
          settings?.theme === "dark" ? "border-slate-600" : "border-gray-300"
        } rounded-full px-4 py-2 mb-4`}
      >
        <svg
          className={`h-5 w-5 ${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Search for a region or city..."
          className={`flex-1 focus:outline-none ${
            settings?.theme === "dark"
              ? "bg-transparent text-slate-200 placeholder-slate-400"
              : "bg-transparent text-slate-900 placeholder-gray-500"
          }`}
        />
      </div>

      {centerLabel && (
        <div className="mb-4">
          <label
            className={`block text-sm font-medium mb-2 ${
              settings?.theme === "dark" ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Detail Level (Zoom: {zoom})
          </label>
          <input
            type="range"
            min="10"
            max="16"
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Less Detail</span>
            <span>More Detail</span>
          </div>
        </div>
      )}

      <div
        className={`relative w-full h-48 ${
          settings?.theme === "dark" ? "bg-slate-700" : "bg-gray-100"
        } rounded-lg overflow-hidden flex items-center justify-center mb-2`}
      >
        <span
          className={`${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-500"
          } text-sm text-center px-4`}
        >
          {centerLabel ? `Selected: ${centerLabel}` : "Map selection area"}
        </span>
      </div>

      {centerLabel && (
        <p
          className={`text-xs ${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-500"
          } mb-4`}
        >
          Estimated size: {sizeMb} MB (at zoom level {zoom})
        </p>
      )}

      {downloading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-center mt-2 text-gray-600 dark:text-gray-400">
            Downloading tiles... {downloadProgress}%
          </p>
        </div>
      )}

      <button
        disabled={!centerLabel || loading}
        onClick={handleDownload}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>{loading ? "Downloading…" : "Download Map"}</span>
      </button>
    </section>
  );
};

export default DownloadMapSection;
