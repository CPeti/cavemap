import React, { useEffect, useState } from "react";
import CaveTable from "../components/CaveTable";

export default function Database() {
    const [caves, setCaves] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        async function fetchCaves() {
            try {
                const response = await fetch("https://frontend.opencave.dev/api/caves/");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const caveData = await response.json();
                // Transform API data if necessary to match CaveTable props
                const transformed = caveData.map((cave) => ({
                    id: cave.cave_id,
                    name: cave.name || "Unknown Cave",
                    zone: cave.zone || "Unknown",
                    code: cave.code || "",
                    first_surveyed: cave.first_surveyed || "",
                    last_surveyed: cave.last_surveyed || "",
                    length: cave.length || "",
                    vertical_extent: cave.vertical_extent || "",
                    horizontal_extent: cave.horizontal_extent || "",
                }));
                setCaves(transformed);
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
            <h2 className="text-2xl font-semibold mb-6">Cadaster</h2>
            <CaveTable caves={caves} />
        </div>
    );
}