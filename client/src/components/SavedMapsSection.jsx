import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "./SettingContent";
import MapPreview from "./MapPreview";

const SavedMapsSection = () => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();
  const settings = useSettings();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/saved-maps");
      const data = res.ok ? await res.json() : [];
      setMaps(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // Listen for online/offline events
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  async function handleDelete(id) {
    const prev = maps;
    setMaps((m) => m.filter((x) => x.id !== id));
    const res = await fetch(`/api/saved-maps/${id}`, { method: "DELETE" });
    if (!res.ok) setMaps(prev);
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`text-xl font-semibold ${
            settings?.theme === "dark" ? "text-slate-200" : "text-slate-900"
          }`}
        >
          Your Saved Maps
        </h2>
        {isOffline && (
          <div className="flex items-center space-x-2 text-sm">
            <div
              className={`px-3 py-1 rounded-full ${
                settings?.theme === "dark"
                  ? "bg-amber-900/30 text-amber-300 border border-amber-700"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <div className="flex items-center space-x-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
                </svg>
                <span>Offline Mode</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {loading && (
        <p
          className={`text-sm ${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Loading…
        </p>
      )}
      {!loading && maps.length === 0 && (
        <p
          className={`text-sm ${
            settings?.theme === "dark" ? "text-slate-400" : "text-gray-500"
          }`}
        >
          No saved maps yet. Use the search above to add one.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {maps.map((map) => (
          <div
            key={map.id}
            className={`${
              settings?.theme === "dark" ? "bg-slate-800" : "bg-white"
            } rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200`}
          >
            <MapPreview
              bbox={map.bbox}
              name={map.name}
              className="w-full h-36"
              onClick={() =>
                navigate(
                  `/map?q=${encodeURIComponent(map.name)}${
                    Array.isArray(map.bbox)
                      ? `&bbox=${encodeURIComponent(JSON.stringify(map.bbox))}`
                      : ""
                  }`
                )
              }
            />
            <div className="p-4">
              <h3
                className={`text-lg font-semibold mb-2 ${
                  settings?.theme === "dark"
                    ? "text-slate-200"
                    : "text-slate-900"
                } line-clamp-2`}
                title={map.name}
              >
                {map.name}
              </h3>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <svg
                      className={`w-4 h-4 ${
                        settings?.theme === "dark"
                          ? "text-slate-400"
                          : "text-gray-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8"
                      />
                    </svg>
                    <span
                      className={`text-sm ${
                        settings?.theme === "dark"
                          ? "text-slate-400"
                          : "text-gray-500"
                      }`}
                    >
                      {map.sizeMb ? `${map.sizeMb} MB` : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <svg
                    className={`w-4 h-4 ${
                      settings?.theme === "dark"
                        ? "text-slate-400"
                        : "text-gray-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span
                    className={`text-xs ${
                      settings?.theme === "dark"
                        ? "text-slate-500"
                        : "text-gray-400"
                    }`}
                  >
                    {formatDate(map.downloadedAt)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    navigate(
                      `/map?q=${encodeURIComponent(map.name)}${
                        Array.isArray(map.bbox)
                          ? `&bbox=${encodeURIComponent(
                              JSON.stringify(map.bbox)
                            )}`
                          : ""
                      }`
                    )
                  }
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium ${
                    settings?.theme === "dark"
                      ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  } transition-colors flex items-center justify-center space-x-1`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleDelete(map.id)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium ${
                    settings?.theme === "dark"
                      ? "border-red-500 text-red-400 hover:bg-red-900/20"
                      : "border-red-500 text-red-500 hover:bg-red-50"
                  } transition-colors flex items-center justify-center space-x-1`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SavedMapsSection;
