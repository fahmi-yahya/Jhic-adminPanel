import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import KnowvioDashboard from "./view";
import Login from "./auth/login";
import UserManagement from "./view/management";
import BeritaPage from "./view/BeritaPage";
import JurusanPage from "./view/JurusanPage";
import PesanPage from "./view/PesanPage";
import PrestasiPage from "./view/PrestasiPage";
import LingkunganPage from "./view/LingkunganPage";
import { User } from "lucide-react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/index" element={<KnowvioDashboard />} />
          <Route path="/i" element={<UserManagement />} />
          <Route path="/berita" element={<BeritaPage />} />
          <Route path="/jurusan" element={<JurusanPage />} />
          <Route path="/lingkungan" element={<LingkunganPage />} />
          <Route path="/prestasi" element={<PrestasiPage />} />
          <Route path="/pesan" element={<PesanPage />} />
          <Route path="/management" element={<UserManagement/>}/>
          {/* Default Redirect */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/berita" replace />}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
