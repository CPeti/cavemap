import React, { useEffect, useRef, useState } from "react";
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
  const [mapStyle, setMapStyle] = useState(
    "mapbox://styles/mapbox/outdoors-v12?optimize=true"
  );

  // Fetch cave data
  useEffect(() => {
    async function fetchCaves() {
      const snapshot = await getDocs(collection(db, "caves"));
      const caveData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCaves(caveData);
    }
    fetchCaves();
  }, []);

  // Initialize Mapbox map on mount
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: center,
      zoom: zoom,
      attributionControl: false,
    });
    mapRef.current = map;

    mapRef.current.on('style.load', () => {
      mapRef.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true,
    }));

    mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Add geolocate control
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: false,
      }),
      "top-right"
    );

    return () => {
      map.remove();
    };
  }, []); // run only once on mount

  // Update map center and zoom when props change
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.setCenter(center);
    mapRef.current.setZoom(zoom);
  }, [center, zoom]);

  // Update map style when changed
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.setStyle(mapStyle);
  }, [mapStyle]);

  // Add markers when caves update
  // Add GeoJSON source and clustering layers
  useEffect(() => {
    if (!mapRef.current || caves.length === 0) return;

    const map = mapRef.current;

    // Remove existing source/layers if re-rendering
    if (map.getSource("caves")) {
      map.removeLayer("clusters");
      map.removeLayer("cluster-count");
      map.removeLayer("unclustered-point");
      map.removeSource("caves");
    }

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
        },
      })),
    };

    map.addSource("caves", {
      type: "geojson",
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50,  // Radius of each cluster when clustering points (defaults to 50)
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
        "circle-color": "#FF5722",
        "circle-radius": 6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    // Show popup on click
    map.on("click", "unclustered-point", (e) => {
      const feature = e.features[0];
      const cave = feature.properties;
      const coordinates = feature.geometry.coordinates.slice();

      const popupContainer = document.createElement("div");
      popupContainer.innerHTML = `
    <div class="relative text-sm font-sans p-2">
      <button id="custom-close" class="absolute top-1 right-1 text-gray-500 hover:text-black text-xl font-bold">&times;</button>
      <h1 class="text-lg font-semibold mb-1">${cave.name}</h1>
      <p><span class="font-medium">Depth:</span> ${cave.depth || "N/A"}</p>
      <p><span class="font-medium">Length:</span> ${cave.length || "N/A"}</p>
      <p><span class="font-medium">Altitude:</span> ${cave.altitude || "N/A"}</p>
      <p><span class="font-medium">Coordinates:</span> ${Number(cave.lng).toFixed(4)}, ${Number(cave.lat).toFixed(4)}</p>
    </div>
  `;

      const popup = new mapboxgl.Popup({ closeButton: false })
        .setDOMContent(popupContainer)
        .setLngLat(coordinates)
        .addTo(map);

      // Attach event listener to custom close button
      const closeButton = popupContainer.querySelector("#custom-close");
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          popup.remove();
        });
      }
    });


    // Zoom into cluster
    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties.cluster_id;
      const source = map.getSource("caves");

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
    });

    // Change cursor on hover
    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });

  }, [caves]);


  return (
    <div className="relative w-full h-full">
      {/* Basemap Toggle Controls */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded shadow z-10 space-y-1 text-sm">
        <div>
          <label className="mr-2">
            <input
              type="radio"
              name="basemap"
              value="mapbox://styles/mapbox/outdoors-v12?optimize=true"
              checked={mapStyle.includes("outdoors")}
              onChange={(e) => {
                mapRef.current.setStyle(e.target.value);
                setMapStyle(e.target.value);
              }}
            />
            <span className="ml-1">Outdoors</span>
          </label>
        </div>
        <div>
          <label className="mr-2">
            <input
              type="radio"
              name="basemap"
              value="mapbox://styles/mapbox/satellite-streets-v12"
              checked={mapStyle.includes("satellite")}
              onChange={(e) => {
                mapRef.current.setStyle(e.target.value);
                setMapStyle(e.target.value);
              }}
            />
            <span className="ml-1">Satellite</span>
          </label>
        </div>
      </div>

      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
