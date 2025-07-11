import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import CaveTable from "../components/CaveTable";

export default function Database() {
  const [caves, setCaves] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchCaves() {
      try {
        const snapshot = await getDocs(collection(db, "caves"));
        const caveData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unknown Cave",
            zone: data.zone || "Unknown",
            code: data.code || "",
            gpsN: data.lat ? data.lat.toFixed(6) : "",
            gpsE: data.lng ? data.lng.toFixed(6) : "",
            asl: data.asl || data.altitude || "",
            length: data.length || "",
            depth: data.depth || ""
          };
        });
        setCaves(caveData);
      } catch (error) {
        console.error("Error fetching caves:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCaves();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading caves...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-semibold mb-6">Cave Database</h2>
      <CaveTable caves={caves} />
    </div>
  );
}