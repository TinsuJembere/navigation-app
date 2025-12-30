import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SettingsContext = createContext(null);

// Initialize theme from localStorage before rendering
const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem("sg_settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.theme) {
        document.documentElement.dataset.theme = settings.theme;
        return settings.theme;
      }
    }
  } catch {}
  return "light";
};

export function SettingsProvider({ children }) {
  const [avoidTolls, setAvoidTolls] = useState(true);
  const [avoidHighways, setAvoidHighways] = useState(true);
  const [preferShortest, setPreferShortest] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const [speedUnit, setSpeedUnit] = useState("kmh");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sg_settings");
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.avoidTolls === "boolean") setAvoidTolls(s.avoidTolls);
        if (typeof s.avoidHighways === "boolean")
          setAvoidHighways(s.avoidHighways);
        if (typeof s.preferShortest === "boolean")
          setPreferShortest(s.preferShortest);
        if (s.theme) setTheme(s.theme);
        if (typeof s.voiceVolume === "number") setVoiceVolume(s.voiceVolume);
        if (s.voiceLang) {
          // Migrate old language codes to new format
          const langMigration = {
            en: "en-US",
            am: "am-ET",
            om: "om-ET",
          };
          setVoiceLang(langMigration[s.voiceLang] || s.voiceLang);
        }
        if (s.speedUnit) setSpeedUnit(s.speedUnit);
      }
    } catch {}
  }, []);

  // Persist settings and apply theme immediately
  useEffect(() => {
    try {
      const s = {
        avoidTolls,
        avoidHighways,
        preferShortest,
        theme,
        voiceVolume,
        voiceLang,
        speedUnit,
      };
      localStorage.setItem("sg_settings", JSON.stringify(s));
      if (theme) {
        document.documentElement.dataset.theme = theme;
      }
    } catch {}
  }, [
    avoidTolls,
    avoidHighways,
    preferShortest,
    theme,
    voiceVolume,
    voiceLang,
    speedUnit,
  ]);

  const value = useMemo(
    () => ({
      avoidTolls,
      setAvoidTolls,
      avoidHighways,
      setAvoidHighways,
      preferShortest,
      setPreferShortest,
      theme,
      setTheme,
      voiceVolume,
      setVoiceVolume,
      voiceLang,
      setVoiceLang,
      speedUnit,
      setSpeedUnit,
    }),
    [
      avoidTolls,
      avoidHighways,
      preferShortest,
      theme,
      voiceVolume,
      voiceLang,
      speedUnit,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

const SettingsContent = () => {
  const s = useSettings();
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header and User Icon */}
      <header className="flex items-center justify-between mb-8">
        <h1
          className={`text-3xl font-bold ${
            s.theme === "dark" ? "text-slate-200" : "text-slate-900"
          }`}
        >
          Settings
        </h1>
      </header>

      {/* Route Preferences Section */}
      <section
        className={`${
          s.theme === "dark" ? "bg-slate-800" : "bg-white"
        } p-6 rounded-lg shadow-md mb-6`}
      >
        <h2
          className={`text-xl font-semibold mb-4 ${
            s.theme === "dark" ? "text-slate-200" : "text-slate-900"
          }`}
        >
          Route Preferences
        </h2>
        <div
          className={`divide-y ${
            s.theme === "dark" ? "divide-slate-600" : "divide-slate-200"
          }`}
        >
          <div className="flex items-center justify-between py-3">
            <div
              className={
                s.theme === "dark" ? "text-slate-300" : "text-slate-700"
              }
            >
              Avoid Tolls
            </div>
            <button
              onClick={() => s.setAvoidTolls(!s.avoidTolls)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                s.avoidTolls
                  ? "bg-blue-600"
                  : s.theme === "dark"
                  ? "bg-slate-600"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  s.avoidTolls ? "translate-x-5" : "translate-x-1"
                }`}
              ></span>
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div
              className={
                s.theme === "dark" ? "text-slate-300" : "text-slate-700"
              }
            >
              Avoid Highways
            </div>
            <button
              onClick={() => s.setAvoidHighways(!s.avoidHighways)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                s.avoidHighways
                  ? "bg-blue-600"
                  : s.theme === "dark"
                  ? "bg-slate-600"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  s.avoidHighways ? "translate-x-5" : "translate-x-1"
                }`}
              ></span>
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div
              className={
                s.theme === "dark" ? "text-slate-300" : "text-slate-700"
              }
            >
              Prefer Shortest Route
            </div>
            <button
              onClick={() => s.setPreferShortest(!s.preferShortest)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                s.preferShortest
                  ? "bg-blue-600"
                  : s.theme === "dark"
                  ? "bg-slate-600"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  s.preferShortest ? "translate-x-5" : "translate-x-1"
                }`}
              ></span>
            </button>
          </div>
        </div>
      </section>

      {/* Map Theme Section */}
      <section
        className={`${
          s.theme === "dark" ? "bg-slate-800" : "bg-white"
        } p-6 rounded-lg shadow-md mb-6`}
      >
        <h2
          className={`text-xl font-semibold mb-4 ${
            s.theme === "dark" ? "text-slate-200" : "text-slate-900"
          }`}
        >
          Map Theme
        </h2>
        <div
          className={`flex ${
            s.theme === "dark" ? "bg-slate-700" : "bg-slate-100"
          } rounded-full p-1`}
        >
          <button
            onClick={() => s.setTheme("light")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              s.theme === "light"
                ? "bg-blue-600 text-white shadow"
                : s.theme === "dark"
                ? "text-slate-300"
                : "text-slate-600"
            }`}
          >
            Light Mode
          </button>
          <button
            onClick={() => s.setTheme("dark")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              s.theme === "dark"
                ? "bg-slate-900 text-white shadow"
                : s.theme === "dark"
                ? "text-slate-300"
                : "text-slate-600"
            }`}
          >
            Dark Mode
          </button>
        </div>
      </section>

      {/* Voice Assistant Section */}
      <section
        className={`${
          s.theme === "dark" ? "bg-slate-800" : "bg-white"
        } p-6 rounded-lg shadow-md mb-6`}
      >
        <h2
          className={`text-xl font-semibold mb-4 ${
            s.theme === "dark" ? "text-slate-200" : "text-slate-900"
          }`}
        >
          Voice Assistant
        </h2>
        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm mb-1 ${
                s.theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              Voice Volume
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={s.voiceVolume}
              onChange={(e) => s.setVoiceVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label
              className={`block text-sm mb-1 ${
                s.theme === "dark" ? "text-slate-400" : "text-gray-600"
              }`}
            >
              Voice Language
            </label>
            <select
              value={s.voiceLang}
              onChange={(e) => s.setVoiceLang(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 ${
                s.theme === "dark"
                  ? "bg-slate-700 border-slate-600 text-slate-200"
                  : "bg-white border-gray-300 text-slate-900"
              }`}
            >
              <option value="en-US">English</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
            </select>
          </div>
        </div>
      </section>
      {/* Speed Unit Section */}
      <section
        className={`${
          s.theme === "dark" ? "bg-slate-800" : "bg-white"
        } p-6 rounded-lg shadow-md mb-6`}
      >
        <h2
          className={`text-xl font-semibold mb-4 ${
            s.theme === "dark" ? "text-slate-200" : "text-slate-900"
          }`}
        >
          Speed Unit
        </h2>
        <div>
          <label
            className={`block text-sm mb-2 ${
              s.theme === "dark" ? "text-slate-400" : "text-gray-600"
            }`}
          >
            Preferred Speed Unit
          </label>
          <select
            value={s.speedUnit}
            onChange={(e) => s.setSpeedUnit(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 ${
              s.theme === "dark"
                ? "bg-slate-700 border-slate-600 text-slate-200"
                : "bg-white border-gray-300 text-slate-900"
            }`}
          >
            <option value="kmh">Kilometers per hour (km/h)</option>
            <option value="mph">Miles per hour (mph)</option>
          </select>
        </div>
      </section>
    </div>
  );
};

export default SettingsContent;
