import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export function useMapbox({
    center,
    zoom,
    mapStyle,
    entranceMarkers,
    selectedCaveId,
    onEntranceSelect,
    is3D,
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

    // Build GeoJSON from entrance markers
    const buildGeoJSON = (markers, selectedId) => ({
        type: "FeatureCollection",
        features: markers.map((marker) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [marker.lng, marker.lat],
            },
            properties: {
                id: marker.id,
                caveId: marker.caveId,
                caveName: marker.caveName,
                entranceName: marker.entranceName,
                isMainEntrance: marker.isMainEntrance,
                // All entrances of the selected cave should be marked as selected
                selected: marker.caveId === selectedId,
            },
        })),
    });

    // Update marker selection styling
    useEffect(() => {
        const map = mapRef.current;
        if (!map?.getSource("entrances")) return;

        const geojson = buildGeoJSON(entranceMarkers, selectedCaveId);
        map.getSource("entrances").setData(geojson);
    }, [selectedCaveId, entranceMarkers]);

    // Add entrance data and layers
    useEffect(() => {
        const map = mapRef.current;
        if (!map || entranceMarkers.length === 0) return;

        const addEntranceLayers = () => {
            if (map.getSource("entrances")) return;

            const geojson = buildGeoJSON(entranceMarkers, selectedCaveId);

            map.addSource("entrances", {
                type: "geojson",
                data: geojson,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            });

            // Cluster circles - teal theme
            map.addLayer({
                id: "clusters",
                type: "circle",
                source: "entrances",
                filter: ["has", "point_count"],
                paint: {
                    "circle-color": [
                        "step",
                        ["get", "point_count"],
                        "#14b8a6", // teal-500
                        10,
                        "#0d9488", // teal-600
                        30,
                        "#0f766e", // teal-700
                    ],
                    "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 30, 30],
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff",
                },
            });

            map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "entrances",
                filter: ["has", "point_count"],
                layout: {
                    "text-field": "{point_count_abbreviated}",
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 13,
                },
                paint: {
                    "text-color": "#ffffff",
                },
            });

            // Individual entrance markers
            map.addLayer({
                id: "unclustered-point",
                type: "circle",
                source: "entrances",
                filter: ["!", ["has", "point_count"]],
                paint: {
                    // Teal when selected, orange otherwise
                    "circle-color": ["case", ["get", "selected"], "#14b8a6", "#f97316"],
                    // Main entrances are slightly larger
                    "circle-radius": [
                        "case",
                        ["get", "selected"],
                        ["case", ["get", "isMainEntrance"], 11, 9],
                        ["case", ["get", "isMainEntrance"], 9, 7]
                    ],
                    "circle-stroke-width": ["case", ["get", "selected"], 3, 2],
                    "circle-stroke-color": "#ffffff",
                },
            });

            // Cave name labels (only for main entrances to avoid duplicates)
            map.addLayer({
                id: "cave-labels",
                type: "symbol",
                source: "entrances",
                filter: ["all", ["!", ["has", "point_count"]], ["get", "isMainEntrance"]],
                layout: {
                    "text-field": ["get", "caveName"],
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 12,
                    "text-offset": [0, -1.5],
                    "text-anchor": "bottom",
                    "text-allow-overlap": false,
                    "text-ignore-placement": false,
                },
                paint: {
                    "text-color": ["case", ["get", "selected"], "#0f766e", "#1e293b"],
                    "text-halo-color": "#ffffff",
                    "text-halo-width": 1.5,
                },
            });

            // Click handler for individual entrances
            map.on("click", "unclustered-point", (e) => {
                const feature = e.features[0];
                const props = feature.properties;
                onEntranceSelect({
                    id: props.id,
                    caveId: props.caveId,
                    caveName: props.caveName,
                    entranceName: props.entranceName,
                });
            });

            // Click handler for clusters
            map.on("click", "clusters", (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ["clusters"],
                });
                const clusterId = features[0].properties.cluster_id;
                map
                    .getSource("entrances")
                    .getClusterExpansionZoom(clusterId, (err, zoom) => {
                        if (err) return;
                        map.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom,
                        });
                    });
            });

            // Cursor handlers
            map.on("mouseenter", "clusters", () => {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "clusters", () => {
                map.getCanvas().style.cursor = "";
            });
            map.on("mouseenter", "unclustered-point", () => {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "unclustered-point", () => {
                map.getCanvas().style.cursor = "";
            });
        };

        const onStyleLoad = () => {
            addEntranceLayers();
        };

        map.on("style.load", onStyleLoad);

        if (map.isStyleLoaded()) {
            addEntranceLayers();
        } else {
            const checkAndAdd = () => {
                if (map.isStyleLoaded()) {
                    addEntranceLayers();
                    map.off("render", checkAndAdd);
                }
            };
            map.on("render", checkAndAdd);
        }

        return () => {
            map.off("style.load", onStyleLoad);
        };
    }, [mapStyle, entranceMarkers, selectedCaveId, onEntranceSelect]);

    // Handle terrain toggle
    useEffect(() => {
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

        if (map.isStyleLoaded()) {
            applyTerrain();
        }

        const onStyleLoad = () => {
            applyTerrain();
        };

        map.on("style.load", onStyleLoad);

        return () => {
            map.off("style.load", onStyleLoad);
        };
    }, [is3D, hasInitialized]);

    return {
        mapContainer,
        mapRef,
        hasInitialized,
    };
}
