import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export function useMapbox({
    center,
    zoom,
    mapStyle,
    caves,
    selectedCave,
    onCaveSelect,
}) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Initialize map
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

        map.on("load", () => {
            setHasInitialized(true);
        });

        return () => map.remove();
    }, []);

    // Update center/zoom only on initial load
    useEffect(() => {
        if (mapRef.current && !hasInitialized) {
            mapRef.current.setCenter(center);
            mapRef.current.setZoom(zoom);
        }
    }, [center, zoom, hasInitialized]);

    // Update map style
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setStyle(mapStyle);
        }
    }, [mapStyle]);

    // Update marker selection styling
    useEffect(() => {
        const map = mapRef.current;
        if (!map?.getSource("caves")) return;

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
                    selected: selectedCave?.id === cave.id,
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
                        selected: selectedCave?.id === cave.id,
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
                    "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25],
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
                    "circle-color": ["case", ["get", "selected"], "#4CAF50", "#FF5722"],
                    "circle-radius": ["case", ["get", "selected"], 8, 7],
                    "circle-stroke-width": ["case", ["get", "selected"], 2, 1],
                    "circle-stroke-color": [
                        "case",
                        ["get", "selected"],
                        "#2E7D32",
                        "#fff",
                    ],
                },
            });

            // Click handlers
            map.on("click", "unclustered-point", async (e) => {
                const feature = e.features[0];
                const cave = feature.properties;
                onCaveSelect(cave);

                try {
                    const kmlRef = doc(db, "kml", cave.id);
                    const kmlSnap = await getDoc(kmlRef);

                    if (kmlSnap.exists()) {
                        const geojsonStr = kmlSnap.data().geojson;
                        const geojsonData = JSON.parse(geojsonStr);

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
                                type: "line",
                                source: "kml-data",
                                layout: {
                                    "line-z-offset": [
                                        "at-interpolated",
                                        [
                                            "*",
                                            ["line-progress"],
                                            ["-", ["length", ["get", "elevation"]], 1],
                                        ],
                                        ["get", "elevation"],
                                    ],
                                    "line-elevation-reference": "sea",
                                },
                                paint: {
                                    "line-color": "#57B9FF",
                                    "line-width": 3,
                                },
                            });
                        }
                    } else if (map.getSource("kml-data")) {
                        map.getSource("kml-data").setData({
                            type: "FeatureCollection",
                            features: [],
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
                map
                    .getSource("caves")
                    .getClusterExpansionZoom(clusterId, (err, zoom) => {
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

        map.on("style.load", onStyleLoad);

        if (map.isStyleLoaded()) {
            addCaveLayers();
        } else {
            const checkAndAdd = () => {
                if (map.isStyleLoaded()) {
                    addCaveLayers();
                    map.off("render", checkAndAdd);
                }
            };
            map.on("render", checkAndAdd);
        }

        return () => {
            map.off("style.load", onStyleLoad);
        };
    }, [mapStyle, caves, selectedCave, onCaveSelect]);

    // Handle terrain toggle
    const toggle3D = (is3D) => {
        const map = mapRef.current;
        if (!map || !hasInitialized) return;

        const applyTerrain = () => {
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

        const onStyleLoad = () => {
            applyTerrain();
        };

        map.on("style.load", onStyleLoad);

        if (map.isStyleLoaded()) {
            applyTerrain();
        }

        return () => {
            map.off("style.load", onStyleLoad);
        };
    };

    // Clear KML data
    const clearKmlData = () => {
        if (mapRef.current?.getSource("kml-data")) {
            mapRef.current.getSource("kml-data").setData({
                type: "FeatureCollection",
                features: [],
            });
        }
    };

    return {
        mapContainer,
        mapRef,
        hasInitialized,
        toggle3D,
        clearKmlData,
    };
}
