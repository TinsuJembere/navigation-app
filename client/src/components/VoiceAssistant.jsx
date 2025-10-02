import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "./SettingContent";

// Voice Permission Context
const VoicePermissionContext = createContext({
  isVoiceEnabled: false,
  speak: () => {},
  enableVoice: () => {},
  disableVoice: () => {},
});

export const useVoicePermission = () => useContext(VoicePermissionContext);

export function VoicePermissionProvider({ children }) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const settings = useSettings();

  const speak = (text) => {
    // Only speak if voice is explicitly enabled by user
    if (!isVoiceEnabled || !("speechSynthesis" in window)) return;

    const utter = new SpeechSynthesisUtterance(text);

    // Use settings from context if available, fallback to localStorage
    if (settings) {
      utter.volume = settings.voiceVolume || 1;
      utter.lang = settings.voiceLang || "en-US";
    } else {
      try {
        const stored = localStorage.getItem("sg_settings");
        if (stored) {
          const s = JSON.parse(stored);
          if (typeof s.voiceVolume === "number") utter.volume = s.voiceVolume;
          if (s.voiceLang) utter.lang = s.voiceLang;
        }
      } catch {}
    }

    window.speechSynthesis.speak(utter);
  };

  const enableVoice = () => setIsVoiceEnabled(true);
  const disableVoice = () => setIsVoiceEnabled(false);

  return (
    <VoicePermissionContext.Provider
      value={{ isVoiceEnabled, speak, enableVoice, disableVoice }}
    >
      {children}
    </VoicePermissionContext.Provider>
  );
}

function useSpeechRecognition(language = "en-US") {
  const Rec = useMemo(
    () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
    []
  );
  const [supported, setSupported] = useState(!!Rec);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const handlersRef = useRef({ onResult: null, onError: null, onEnd: null });

  useEffect(() => {
    if (!Rec) return;
    const r = new Rec();
    r.lang = language;
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const transcript =
        last && last[0] && last[0].transcript ? last[0].transcript.trim() : "";
      if (handlersRef.current.onResult && transcript)
        handlersRef.current.onResult(transcript);
    };
    r.onerror = (e) => {
      if (handlersRef.current.onError) handlersRef.current.onError(e);
    };
    r.onend = () => {
      setListening(false);
      if (handlersRef.current.onEnd) handlersRef.current.onEnd();
    };
    recognitionRef.current = r;
  }, [Rec, language]);

  function start(onResult, onError, onEnd) {
    if (!recognitionRef.current) return false;
    handlersRef.current = { onResult, onError, onEnd };
    try {
      recognitionRef.current.start();
      setListening(true);
      return true;
    } catch {
      return false;
    }
  }
  function stop() {
    try {
      recognitionRef.current && recognitionRef.current.stop();
    } catch {}
  }

  return { supported, listening, start, stop };
}

export default function VoiceAssistant() {
  const settings = useSettings();
  const { isVoiceEnabled, speak, enableVoice, disableVoice } =
    useVoicePermission();
  const { supported, listening, start, stop } = useSpeechRecognition(
    settings?.voiceLang || "en-US"
  );
  const [lastHeard, setLastHeard] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Multilingual responses
  const responses = {
    "en-US": {
      openingHome: "Opening home",
      openingMap: "Opening map",
      openingSaved: "Opening saved maps",
      openingSettings: "Opening settings",
      locatingYou: "Locating you",
      driveMode: "Drive mode",
      walkMode: "Walk mode",
      transitMode: "Transit mode",
      stopping: "Stopping",
      voiceEnabled: "Voice assistant enabled",
      notUnderstood: "Sorry, I did not understand.",
    },
    "es-ES": {
      openingHome: "Abriendo inicio",
      openingMap: "Abriendo mapa",
      openingSaved: "Abriendo mapas guardados",
      openingSettings: "Abriendo configuración",
      locatingYou: "Localizándote",
      driveMode: "Modo conducir",
      walkMode: "Modo caminar",
      transitMode: "Modo transporte público",
      stopping: "Parando",
      voiceEnabled: "Asistente de voz activado",
      notUnderstood: "Lo siento, no entendí.",
    },
    "fr-FR": {
      openingHome: "Ouverture de l'accueil",
      openingMap: "Ouverture de la carte",
      openingSaved: "Ouverture des cartes sauvegardées",
      openingSettings: "Ouverture des paramètres",
      locatingYou: "Vous localiser",
      driveMode: "Mode conduite",
      walkMode: "Mode marche",
      transitMode: "Mode transport en commun",
      stopping: "Arrêt",
      voiceEnabled: "Assistant vocal activé",
      notUnderstood: "Désolé, je n'ai pas compris.",
    },
    "am-ET": {
      openingHome: "ቤት እየከፈተ ነው",
      openingMap: "ካርታ እየከፈተ ነው",
      openingSaved: "የተቀመጡ ካርታዎች እየከፈተ ነው",
      openingSettings: "ቅንብሮች እየከፈተ ነው",
      locatingYou: "እርስዎን እየፈለገ ነው",
      driveMode: "የመንዳት ሁኔታ",
      walkMode: "የእግር ጉዞ ሁኔታ",
      transitMode: "የህዝብ ትራንስፖርት ሁኔታ",
      stopping: "እያቆመ ነው",
      voiceEnabled: "የድምጽ ረዳት ተነቅቷል",
      notUnderstood: "ይቅርታ፣ አልገባኝም።",
    },
    "om-ET": {
      openingHome: "Mana banuu jira",
      openingMap: "Kaartaa banuu jira",
      openingSaved: "Kaartoota olkaa'aman banuu jira",
      openingSettings: "Qindaa'ina banuu jira",
      locatingYou: "Si barbaaduu jira",
      driveMode: "Haalata konkolaachisuu",
      walkMode: "Haalata miilaan deemuu",
      transitMode: "Haalata geejjibaa ummataa",
      stopping: "Dhaabuu jira",
      voiceEnabled: "Gargaaraan sagalee ka'eera",
      notUnderstood: "Dhiifama, hin hubanne.",
    },
  };

  function getResponse(key) {
    const currentLang = settings?.voiceLang || "en-US";
    return responses[currentLang]?.[key] || responses["en-US"][key];
  }

  // Remove the local speak function - use the one from context

  function handleCommand(text) {
    const t = text.toLowerCase();
    setLastHeard(t);
    if (t.startsWith("go to ") || t.startsWith("open ")) {
      const target = t.replace(/^go to\s+|^open\s+/, "");
      if (target.includes("home")) {
        navigate("/");
        speak(getResponse("openingHome"));
        return;
      }
      if (target.includes("map")) {
        navigate("/map");
        speak(getResponse("openingMap"));
        return;
      }
      if (target.includes("saved")) {
        navigate("/saved");
        speak(getResponse("openingSaved"));
        return;
      }
      if (target.includes("settings")) {
        navigate("/settings");
        speak(getResponse("openingSettings"));
        return;
      }
    }
    if (
      t.startsWith("navigate to ") ||
      t.startsWith("search ") ||
      t.startsWith("find ")
    ) {
      const place = t.replace(/^navigate to\s+|^search\s+|^find\s+/, "");
      navigate(`/map?q=${encodeURIComponent(place)}`);
      // Removed automatic speech when searching
      return;
    }
    if (t.includes("locate me") || t.includes("my location")) {
      window.dispatchEvent(new CustomEvent("va:locate"));
      speak(getResponse("locatingYou"));
      return;
    }
    if (t.includes("drive mode") || t.includes("driving mode")) {
      navigate("/map?mode=drive");
      speak(getResponse("driveMode"));
      return;
    }
    if (t.includes("walk mode") || t.includes("walking mode")) {
      navigate("/map?mode=walk");
      speak(getResponse("walkMode"));
      return;
    }
    if (t.includes("transit mode") || t.includes("bus mode")) {
      navigate("/map?mode=transit");
      speak(getResponse("transitMode"));
      return;
    }
    if (t.includes("stop")) {
      stop();
      speak(getResponse("stopping"));
      return;
    }
    speak(getResponse("notUnderstood"));
  }

  function toggle() {
    if (listening) {
      stop();
      disableVoice(); // Disable voice when stopping
      return;
    }
    // Enable voice when starting
    enableVoice();
    start((txt) => handleCommand(txt));
    speak(getResponse("voiceEnabled"));
  }

  // No auto-start functionality - only activate when button is clicked

  if (!supported) return null;
  return (
    <button
      onClick={toggle}
      title={listening ? "Stop voice assistant" : "Start voice assistant"}
      className={`fixed bottom-20 md:bottom-4 right-4 z-40 rounded-full shadow-lg px-3 md:px-4 py-2 md:py-3 text-white text-sm md:text-base ${
        listening
          ? "bg-red-600 hover:bg-red-700"
          : "bg-blue-600 hover:bg-blue-700"
      } transition-colors`}
    >
      <span className="flex items-center gap-2">
        <svg
          className="w-4 h-4 md:w-5 md:h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
        </svg>
        <span className="hidden sm:inline">{listening ? "Stop" : "Voice"}</span>
      </span>
      {lastHeard && (
        <div className="absolute -top-8 right-0 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-32 truncate">
          {lastHeard}
        </div>
      )}
    </button>
  );
}
