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

    // Handle cave selection - FIXED
    const handleCaveSelect = (cave) => {
        // Always clear old KML data when selecting any cave
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
    const { mapContainer, toggle3D, clearKmlData, mapRef } = useMapbox({
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

    // Handle map resize when sidebar opens/closes
    useEffect(() => {
        // Also listen for transition end events
        const mapElement = mapRef.current.getContainer();
        const handleTransitionEnd = () => {
            mapRef.current?.resize();
        };

        mapElement.addEventListener('transitionend', handleTransitionEnd);

        return () => {
            mapElement.removeEventListener('transitionend', handleTransitionEnd);
        };
    }, [sidebarOpen, mapRef]);

    return (
        <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
            {/* Map container */}
            <div
                ref={mapContainer}
                className="absolute inset-0 h-full w-full"
            />

            {/* Sidebar */}
            <div className={`absolute top-0 left-0 h-full z-10 transform transition-transform duration-300 ${
                selectedCave && sidebarOpen 
                    ? 'translate-x-0' 
                    : '-translate-x-full'
            }`}>
                <MapSidebar
                    selectedCave={selectedCave}
                    isOpen={sidebarOpen}
                    onClose={closeSidebar}
                />
            </div>

            {/* Map Controls */}
            <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${
                selectedCave && sidebarOpen ? 'md:right-4' : 'right-4'
            }`}>
                <MapControls
                    mapStyle={mapStyle}
                    onMapStyleChange={setMapStyle}
                    is3D={is3D}
                    onToggle3D={setIs3D}
                />
            </div>
        </div>
    );
}