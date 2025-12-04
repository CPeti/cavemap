import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MapView from "./pages/MapView";
import Database from "./pages/Database";
import Upload from "./pages/Upload";
import CaveDetail from "./pages/CaveDetail";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="flex flex-col h-screen">
      {!isLoginPage && <Navbar />}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/caves" element={<Database />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/cave/:caveId" element={<CaveDetail />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
