import "./App.css";
import Map from "../src/pages/Map.jsx";
import { Routes, Route } from "react-router-dom";
import Home from "../src/pages/Home.jsx";
import "leaflet/dist/leaflet.css";
import SettingsPage from "./pages/SettingsPage.jsx";
import Saved from "./pages/Saved.jsx";
import VoiceAssistant, {
  VoicePermissionProvider,
} from "./components/VoiceAssistant.jsx";
import { SettingsProvider } from "./components/SettingContent.jsx";

function App() {
  return (
    <SettingsProvider>
      <VoicePermissionProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Map />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <VoiceAssistant />
      </VoicePermissionProvider>
    </SettingsProvider>
  );
}

export default App;
