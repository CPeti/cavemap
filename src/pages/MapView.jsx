import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { collection, getDocs } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { db } from "../firebase";

import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = "pk.eyJ1IjoiY3BldGkiLCJhIjoiY21jeHp0Z2pxMDR6MDJpcXQyODVwMWtjNyJ9.Tf0tD7KFxMAlqk5LGRb1uQ";

export default function MapView() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [caves, setCaves] = useState([]);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/outdoors-v12?optimize=true");
  const location = useLocation();

  // Defaults
  const defaultCenter = [18.76825, 42.42067];
  const defaultZoom = 11;

  const center = location.state?.lat && location.state?.lng
    ? [location.state.lng, location.state.lat]
    : defaultCenter;

  const zoom = location.state?.zoom ?? defaultZoom;

  // Fetch cave data
  useEffect(() => {
    async function fetchCaves() {
      const snapshot = await getDocs(collection(db, "caves"));
      const caveData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCaves(caveData);
    }
    fetchCaves();
  }, []);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center,
      zoom,
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [center, zoom]);

  // Add markers when caves update
  useEffect(() => {
    if (!mapRef.current || caves.length === 0) return;

    const map = mapRef.current;

    caves.forEach((cave) => {
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(`
        <div class="relative text-sm font-sans p-2">
          <button id="custom-close" class="absolute top-1 right-1 text-gray-500 hover:text-black text-xl font-bold">&times;</button>
          <h1 class="text-lg font-semibold mb-1">${cave.name}</h1>
          <p><span class="font-medium">Depth:</span> ${cave.depth || "N/A"}</p>
          <p><span class="font-medium">Length:</span> ${cave.length || "N/A"}</p>
          <p><span class="font-medium">Altitude:</span> ${cave.altitude || "N/A"}</p>
          <p><span class="font-medium">Coordinates:</span> ${cave.lng.toFixed(4)}, ${cave.lat.toFixed(4)}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker()
        .setLngLat([cave.lng, cave.lat])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        setTimeout(() => {
          const closeBtn = document.getElementById("custom-close");
          if (closeBtn) {
            closeBtn.addEventListener("click", () => {
              popup.remove();
            });
          }
        }, 0);
      });
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
