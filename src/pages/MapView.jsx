import React, { useEffect, useRef, useState } from "react";

import { doc, getDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
    "pk.eyJ1IjoiY3BldGkiLCJhIjoiY21jeHpoamloMGhnODJycXh3eTN2NjN2eCJ9.6_bmzNhPOxqeBM8ZDiOxUw"; // Replace with your token

export default function MapView() {
    const location = useLocation();
    const { center = [18.76825, 42.42067], zoom = 11 } = location.state || {};
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const [caves, setCaves] = useState([]);
    const [selectedCave, setSelectedCave] = useState(null);
    const [mapStyle, setMapStyle] = useState(
        "mapbox://styles/mapbox/outdoors-v12?optimize=true"
    );
    const [hasInitialized, setHasInitialized] = useState(false);
    const [is3D, setIs3D] = useState(false);

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

    // Initialize map on mount
    useEffect(() => {
        if (!mapContainer.current) return;

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center,
            zoom,
            attributionControl: false,
        });

        mapRef.current = map;

        map.addControl(
            new mapboxgl.NavigationControl({ visualizePitch: true }),
            "top-right"
        );
        map.addControl(new mapboxgl.FullscreenControl(), "top-right");

        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true,
                showAccuracyCircle: false,
            }),
            "top-right"
        );

        // Mark as initialized after first render
        map.on('load', () => {
            setHasInitialized(true);
        });

        return () => map.remove();
    }, []);

    // Update center/zoom only on initial load or when explicitly changed from props
    useEffect(() => {
        if (mapRef.current && !hasInitialized) {
            mapRef.current.setCenter(center);
            mapRef.current.setZoom(zoom);
        }
    }, [center, zoom, hasInitialized]);

    // Update map style when changed
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setStyle(mapStyle);
        }
    }, [mapStyle]);

    // Toggle 3D terrain
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !hasInitialized) return;

        const toggle3D = () => {
            if (is3D) {
                if (!map.getSource("mapbox-dem")) {
                    map.addSource("mapbox-dem", {
                        type: "raster-dem",
                        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                        tileSize: 512,
                        maxzoom: 14,
                    });
                }
                map.setTerrain({ source: "mapbox-dem", exaggeration: 2 });
                map.setPitch(60);
            } else {
                map.setTerrain(null);
                map.setPitch(0);
            }
        };

        // Always listen for style.load to handle basemap changes
        const onStyleLoad = () => {
            toggle3D();
        };

        map.on('style.load', onStyleLoad);

        // Also apply immediately if style is already loaded
        if (map.isStyleLoaded()) {
            toggle3D();
        }

        return () => {
            map.off('style.load', onStyleLoad);
        };
    }, [is3D, hasInitialized, mapStyle]);

    // Update marker selection styling when selectedCave changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getSource("caves")) return;

        // Update the source data to include selection state
        const geojson = {
            type: "FeatureCollection",
            features: caves.map((cave) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [cave.lng, cave.lat],
                },
                properties: { 
                    ...cave, 
                    selected: selectedCave?.id === cave.id 
                },
            })),
        };

        map.getSource("caves").setData(geojson);
    }, [selectedCave, caves]);

    // Add cave data and layers
    useEffect(() => {
        const map = mapRef.current;
        if (!map || caves.length === 0) return;

        const addCaveLayers = () => {
            if (map.getSource("caves")) return;

            // Don't add terrain here - let the 3D toggle handle it

            // Prepare GeoJSON source
            const geojson = {
                type: "FeatureCollection",
                features: caves.map((cave) => ({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [cave.lng, cave.lat],
                    },
                    properties: { 
                        ...cave, 
                        selected: selectedCave?.id === cave.id 
                    },
                })),
            };

            map.addSource("caves", {
                type: "geojson",
                data: geojson,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            });

            map.addLayer({
                id: "clusters",
                type: "circle",
                source: "caves",
                filter: ["has", "point_count"],
                paint: {
                    "circle-color": [
                        "step",
                        ["get", "point_count"],
                        "#00BCD4",
                        10,
                        "#2196F3",
                        30,
                        "#3F51B5",
                    ],
                    "circle-radius": [
                        "step",
                        ["get", "point_count"],
                        15,
                        10,
                        20,
                        30,
                        25,
                    ],
                },
            });

            map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "caves",
                filter: ["has", "point_count"],
                layout: {
                    "text-field": "{point_count_abbreviated}",
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 12,
                },
            });

            map.addLayer({
                id: "unclustered-point",
                type: "circle",
                source: "caves",
                filter: ["!", ["has", "point_count"]],
                paint: {
                    "circle-color": [
                        "case",
                        ["get", "selected"],
                        "#4CAF50", // Green color for selected marker
                        "#FF5722"  // Default orange color for unselected markers
                    ],
                    "circle-radius": [
                        "case",
                        ["get", "selected"],
                        8,  // Larger size for selected marker
                        6   // Default size for unselected markers
                    ],
                    "circle-stroke-width": [
                        "case",
                        ["get", "selected"],
                        2,  // Thicker stroke for selected marker
                        1   // Default stroke width
                    ],
                    "circle-stroke-color": [
                        "case",
                        ["get", "selected"],
                        "#2E7D32", // Darker green stroke for selected marker
                        "#fff"     // Default white stroke
                    ],
                },
            });

            // Events
            map.on("click", "unclustered-point", async (e) => {
                const feature = e.features[0];
                const cave = feature.properties;
                setSelectedCave(cave);
                try {
                    // Instead, get a single document by id:
                    const kmlRef = doc(db, "kml", cave.id);
                    const kmlSnap = await getDoc(kmlRef);

                    if (kmlSnap.exists()) {
                        const geojsonStr = kmlSnap.data().geojson;
                        const geojsonData = JSON.parse(geojsonStr);

                        // Add a source and layer for the loaded geojson (remove old if exists)
                        if (map.getSource("kml-data")) {
                            map.getSource("kml-data").setData(geojsonData);
                        } else {
                            map.addSource("kml-data", {
                                type: "geojson",
                                lineMetrics: true,
                                data: geojsonData,
                            });
                            map.addLayer({
                                id: "kml-layer",
                                type: "line", // or "fill" or "circle" depending on your GeoJSON features
                                source: "kml-data",
                                layout: {
                                    'line-z-offset': [
                                        'at-interpolated',
                                        [
                                            '*',
                                            ['line-progress'],
                                            ['-', ['length', ['get', 'elevation']], 1]
                                        ],
                                        ['get', 'elevation']
                                    ],
                                    'line-elevation-reference': 'sea'
                                },
                                paint: {
                                    "line-color": "#57B9FF",
                                    "line-width": 3,
                                },
                            });
                        }
                    } else {
                        map.getSource("kml-data").setData({
                            type: "FeatureCollection",
                            features: []
                        });
                    }
                } catch (error) {
                    console.error("Error loading KML geojson:", error);
                }
            });

            map.on("click", "clusters", (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ["clusters"],
                });
                const clusterId = features[0].properties.cluster_id;
                map.getSource("caves").getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err) return;
                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom,
                    });
                });
            });

            map.on("mouseenter", "clusters", () => {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "clusters", () => {
                map.getCanvas().style.cursor = "";
            });
        };

        const onStyleLoad = () => {
            addCaveLayers();
        };

        // Ensure we respond to future style loads
        map.on("style.load", onStyleLoad);

        // Handle first load — wait for the style to load if not ready
        if (map.isStyleLoaded()) {
            addCaveLayers();
        } else {
            const checkAndAdd = () => {
                if (map.isStyleLoaded()) {
                    addCaveLayers();
                    map.off("render", checkAndAdd); // stop checking
                }
            };
            map.on("render", checkAndAdd); // check every render until style loads
        }

        return () => {
            map.off("style.load", onStyleLoad);
        };
    }, [mapStyle, caves, is3D]);

    return (
        <div className="relative w-full h-full">
            {/* Sidebar */}
            {selectedCave && (
                <div className="absolute top-0 left-0 w-100 h-full bg-white shadow-lg p-4 overflow-y-auto z-20">
                    <button
                        className="absolute top-4 right-2 text-gray-500 hover:text-black text-xl font-bold"
                        onClick={() => {
                            setSelectedCave(null);
                            if (mapRef.current && mapRef.current.getSource("kml-data")) {
                                mapRef.current.getSource("kml-data").setData({
                                    type: "FeatureCollection",
                                    features: []
                                });
                            }
                        }}
                    >
                        ×
                    </button>

                    <h1 className="text-2xl font-semibold mb-2">{selectedCave.name}</h1>
                    <p>
                        <span className="font-medium">Depth:</span>{" "}
                        {selectedCave.depth || "N/A"}
                    </p>
                    <p>
                        <span className="font-medium">Length:</span>{" "}
                        {selectedCave.length || "N/A"}
                    </p>
                    <p>
                        <span className="font-medium">Altitude:</span>{" "}
                        {selectedCave.altitude || "N/A"}
                    </p>
                    <p>
                        <span className="font-medium">Coordinates:</span>{" "}
                        {Number(selectedCave.lng).toFixed(4)},{" "}
                        {Number(selectedCave.lat).toFixed(4)}
                    </p>
                    <a
                        href={`/cave/${selectedCave.id}`}
                        className="mt-2 inline-block bg-blue-500 text-white py-1 px-3 rounded"
                    >
                        Read More
                    </a>
                </div>
            )}

            {/* Basemap Toggle Controls */}
            <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow z-10 space-y-1 text-sm">
                <div>
                    <label>
                        <input
                            type="radio"
                            name="basemap"
                            value="mapbox://styles/mapbox/outdoors-v12?optimize=true"
                            checked={mapStyle.includes("outdoors")}
                            onChange={(e) => setMapStyle(e.target.value)}
                        />
                        <span className="ml-1">Outdoors</span>
                    </label>
                </div>
                <div>
                    <label>
                        <input
                            type="radio"
                            name="basemap"
                            value="mapbox://styles/mapbox/satellite-streets-v12"
                            checked={mapStyle.includes("satellite")}
                            onChange={(e) => setMapStyle(e.target.value)}
                        />
                        <span className="ml-1">Satellite</span>
                    </label>
                </div>
                <div className="border-t pt-2">
                    <label>
                        <input
                            type="checkbox"
                            checked={is3D}
                            onChange={(e) => setIs3D(e.target.checked)}
                        />
                        <span className="ml-1">3D Terrain</span>
                    </label>
                </div>
            </div>

            {/* Map container */}
            <div ref={mapContainer} className="h-full w-full" />
        </div>
    );
}