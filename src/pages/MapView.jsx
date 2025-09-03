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
        if (!mapRef.current) return;

        const handleResize = () => {
            // Small delay to ensure transitions complete
            setTimeout(() => {
                mapRef.current?.resize();
            }, 350);
        };

        // Only handle resize on desktop when sidebar state changes
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        if (mediaQuery.matches) {
            handleResize();
        }
    }, [sidebarOpen, mapRef]);

    // Prevent scrolling and ensure proper mobile viewport handling
    useEffect(() => {
        // Set viewport height CSS custom property for mobile browsers
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        return () => {
            window.removeEventListener('resize', setVH);
            window.removeEventListener('orientationchange', setVH);
            // Reset body scrolling when component unmounts
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 top-16 overflow-hidden">
            {/* Map container - NO margin changes to prevent black screen */}
            <div
                ref={mapContainer}
                className="absolute inset-0 h-full w-full"
            />

            {/* Sidebar - let it handle its own positioning */}
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
        </div>
    );
}