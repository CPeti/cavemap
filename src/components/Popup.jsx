import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Overlay from "ol/Overlay";

export default function Popup({ map, feature, onClose }) {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  if (!containerRef.current) {
    containerRef.current = document.createElement("div");
  }

  useEffect(() => {
    if (!map) return;

    if (!overlayRef.current) {
      overlayRef.current = new Overlay({
        element: containerRef.current,
        positioning: "bottom-center",
        stopEvent: true,
        offset: [0, -15],
      });
      map.addOverlay(overlayRef.current);
      setMounted(true);
    }

    return () => {
      // On unmount, just hide the overlay, don't remove DOM element
      if (overlayRef.current) {
        overlayRef.current.setPosition(undefined);
      }
    };
  }, [map]);

  useEffect(() => {
    if (feature && overlayRef.current) {
      const geometry = feature.getGeometry();
      const coordinate = geometry.getCoordinates();
      overlayRef.current.setPosition(coordinate);
    } else if (overlayRef.current) {
      overlayRef.current.setPosition(undefined);
    }
  }, [feature]);

  if (!feature || !mounted) return null;

  const name = feature.get("name") || "Unnamed Cave";
  const depth = feature.get("depth") ?? "N/A";
  const length = feature.get("length") ?? "N/A";
  const description = feature.get("description") || "";
  console.log("Popup feature:", feature);

  const popupContent = (
    <div
      style={{
        backgroundColor: "white",
        padding: "10px 15px",
        borderRadius: 6,
        border: "1px solid #888",
        minWidth: 220,
        maxWidth: 280,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        position: "relative",
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        color: "#222",
        whiteSpace: "normal",
        lineHeight: 1.3,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: 18,
          lineHeight: 1,
          color: "#555",
        }}
        aria-label="Close popup"
      >
        ×
      </button>
      <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 6 }}>
        {name}
      </div>
      <div style={{ marginBottom: 8, fontSize: 13, color: "#555" }}>
        Depth: {depth} &nbsp;&nbsp; Length: {length}
      </div>
      <div>{description}</div>
    </div>
  );

  return ReactDOM.createPortal(popupContent, containerRef.current);
}
