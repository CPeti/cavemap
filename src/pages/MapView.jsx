import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Import components and hooks
import MapSidebar from '../components/MapSidebar';
import MapControls from '../components/MapControls';
import { useMapbox } from '../components/use_mapbox_hook';

import "mapbox-gl/dist/mapbox-gl.css";

export default function MapView() {
    const location = useLocation();
    const { center = [18.76825, 42.42067], zoom = 11 } = location.state || {};

    const [caves, setCaves] = useState([]);
    const [selectedCave, setSelectedCave] = useState(null);
    const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/outdoors-v12?optimize=true");
    const [is3D, setIs3D] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetch cave data
    useEffect(() => {
        async function fetchCaves() {
            const snapshot = await getDocs(collection(db, "caves"));
            const caveData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCaves(caveData);
        }
        fetchCaves();
    }, []);

    // Handle cave selection
    // Handle cave selection
    const handleCaveSelect = (cave) => {
        // If the same cave is clicked again, just ignore
        if (selectedCave?.id === cave.id) return;

        // If another cave is already selected, clear old KML before setting new one
        if (selectedCave) {
            clearKmlData();
        }

        setSelectedCave(cave);
        setSidebarOpen(true);
    };


    const closeSidebar = () => {
        setSelectedCave(null);
        setSidebarOpen(false);
        clearKmlData();
    };

    // Use custom mapbox hook
    const { mapContainer, toggle3D, clearKmlData } = useMapbox({
        center,
        zoom,
        mapStyle,
        caves,
        selectedCave,
        onCaveSelect: handleCaveSelect,
    });

    // Handle 3D terrain toggle
    useEffect(() => {
        toggle3D(is3D);
    }, [is3D, mapStyle, toggle3D]);

    return (
        <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar */}
            <MapSidebar
                selectedCave={selectedCave}
                isOpen={sidebarOpen}
                onClose={closeSidebar}
            />

            {/* Map Controls */}
            <MapControls
                mapStyle={mapStyle}
                onMapStyleChange={setMapStyle}
                is3D={is3D}
                onToggle3D={setIs3D}
            />

            {/* Map container */}
            <div
                ref={mapContainer}
                className={`h-full w-full transition-all duration-300 ${selectedCave && sidebarOpen ? 'md:ml-80 lg:ml-96' : ''
                    }`}
            />
        </div>
    );
}