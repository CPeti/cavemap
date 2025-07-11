import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MapView from "./pages/MapView";
import Database from "./pages/Database";
import Upload from "./pages/Upload";
import CaveDetail from "./pages/CaveDetail";

export default function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/caves" element={<Database />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/cave/:caveId" element={<CaveDetail />} />
        </Routes>
      </div>
      </div>
    </Router>
  );
}
