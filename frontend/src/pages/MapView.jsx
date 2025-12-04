import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";

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

    // Fetch cave data from API
    useEffect(() => {
        async function fetchCaves() {
            try {
                const response = await fetch("https://localhost.me/api/caves/", {
                    credentials: "include"
                });

                if (response.status === 401) {
                    window.location.href = "https://localhost.me/oauth2/sign_in?rd=" +
                        encodeURIComponent(window.location.href);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const caveData = await response.json();
                
                // Store caves with id as string for consistency
                const transformedCaves = caveData
                    .filter(cave => cave.entrances && cave.entrances.length > 0)
                    .map(cave => ({
                        ...cave,
                        id: cave.cave_id.toString(),
                    }));
                
                setCaves(transformedCaves);
            } catch (error) {
                console.error("Error fetching caves:", error);
            }
        }
        fetchCaves();
    }, []);

    // Create markers for ALL entrances, with reference to parent cave
    const entranceMarkers = useMemo(() => {
        const markers = [];
        caves.forEach(cave => {
            cave.entrances.forEach((entrance, index) => {
                markers.push({
                    id: `${cave.id}-entrance-${entrance.entrance_id}`,
                    caveId: cave.id,
                    caveName: cave.name,
                    entranceId: entrance.entrance_id,
                    entranceName: entrance.name || `Entrance ${index + 1}`,
                    lat: entrance.gps_n,
                    lng: entrance.gps_e,
                    asl_m: entrance.asl_m,
                    isMainEntrance: index === 0,
                });
            });
        });
        return markers;
    }, [caves]);

    // Handle entrance selection - find and select the parent cave
    const handleEntranceSelect = (markerProps) => {
        const fullCave = caves.find(c => c.id === markerProps.caveId);
        if (fullCave) {
            setSelectedCave(fullCave);
            setSidebarOpen(true);
        }
    };

    const closeSidebar = () => {
        setSelectedCave(null);
        setSidebarOpen(false);
    };

    // Use custom mapbox hook
    const { mapContainer, mapRef } = useMapbox({
        center,
        zoom,
        mapStyle,
        entranceMarkers,
        selectedCaveId: selectedCave?.id || null,
        onEntranceSelect: handleEntranceSelect,
        is3D,
    });

    // Handle map resize when sidebar opens/closes
    useEffect(() => {
        if (!mapRef.current) return;

        const handleResize = () => {
            setTimeout(() => {
                mapRef.current?.resize();
            }, 350);
        };

        const mediaQuery = window.matchMedia('(min-width: 768px)');
        if (mediaQuery.matches) {
            handleResize();
        }
    }, [sidebarOpen, mapRef]);

    // Prevent scrolling and ensure proper mobile viewport handling
    useEffect(() => {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
        
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        return () => {
            window.removeEventListener('resize', setVH);
            window.removeEventListener('orientationchange', setVH);
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 top-16 overflow-hidden">
            {/* Map container */}
            <div
                ref={mapContainer}
                className="absolute inset-0 h-full w-full"
            />

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
        </div>
    );
}
