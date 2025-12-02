import React, { useEffect, useState, useCallback } from "react";
import CaveTable from "../components/CaveTable";
import { FunnelIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";

const emptyFilters = {
    zone: "",
    depthMin: "",
    depthMax: "",
    lengthMin: "",
    lengthMax: "",
};

// Moved outside component to prevent re-creation on every render
const FilterInput = ({ label, value, onChange, placeholder, unit }) => (
    <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
        <div className="relative">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    {unit}
                </span>
            )}
        </div>
    </div>
);

export default function Database() {
    const [caves, setCaves] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    
    // Applied filters (used for API calls)
    const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
    
    // Form state (pending filters)
    const [filters, setFilters] = useState(emptyFilters);

    // Fetch zones on mount
    useEffect(() => {
        async function fetchZones() {
            try {
                const response = await fetch("https://localhost.me/api/caves/zones", {
                    credentials: "include"
                });
                if (response.ok) {
                    const data = await response.json();
                    setZones(data);
                }
            } catch (error) {
                console.error("Error fetching zones:", error);
            }
        }
        fetchZones();
    }, []);

    const fetchCaves = useCallback(async () => {
        setLoading(true);
        try {
            // Build query params from applied filters
            const params = new URLSearchParams();
            if (appliedFilters.zone) params.append("zone", appliedFilters.zone);
            if (appliedFilters.depthMin) params.append("depth_min", appliedFilters.depthMin);
            if (appliedFilters.depthMax) params.append("depth_max", appliedFilters.depthMax);
            if (appliedFilters.lengthMin) params.append("length_min", appliedFilters.lengthMin);
            if (appliedFilters.lengthMax) params.append("length_max", appliedFilters.lengthMax);

            const url = `https://localhost.me/api/caves/${params.toString() ? `?${params.toString()}` : ""}`;
            const response = await fetch(url, {
                credentials: "include"
            });

            if (response.status === 401) {
                window.location.href = "https://auth.localhost.me/oauth2/sign_in?rd=" +
                    encodeURIComponent(window.location.href);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const caveData = await response.json();
            const transformed = caveData.map((cave) => ({
                id: cave.cave_id,
                name: cave.name || "Unknown Cave",
                zone: cave.zone || "Unknown",
                code: cave.code || "",
                first_surveyed: cave.first_surveyed || "",
                last_surveyed: cave.last_surveyed || "",
                length: cave.length || "",
                depth: cave.depth || "",
                vertical_extent: cave.vertical_extent || "",
                horizontal_extent: cave.horizontal_extent || "",
            }));
            setCaves(transformed);
        } catch (error) {
            console.error("Error fetching caves:", error);
        } finally {
            setLoading(false);
        }
    }, [appliedFilters]);

    useEffect(() => {
        fetchCaves();
    }, [fetchCaves]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        setAppliedFilters({ ...filters });
    };

    const clearFilters = () => {
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
    };

    const hasActiveFilters = Object.values(appliedFilters).some(v => v !== "");
    const hasPendingChanges = JSON.stringify(filters) !== JSON.stringify(appliedFilters);

    if (loading && caves.length === 0) {
        return (
            <div className="min-h-screen bg-slate-900 pt-16">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                            <div className="w-10 h-10 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto" />
                            <p className="mt-4 text-slate-500 text-sm">Loading caves...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 pt-16">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Cadaster</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {caves.length} cave{caves.length !== 1 ? 's' : ''} {hasActiveFilters ? 'matching filters' : 'in database'}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            showFilters || hasActiveFilters
                                ? 'bg-teal-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                    >
                        <FunnelIcon className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded">
                                {Object.values(appliedFilters).filter(v => v !== "").length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-white">Filter Caves</h3>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                    >
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                        Clear
                                    </button>
                                )}
                                <button
                                    onClick={applyFilters}
                                    disabled={!hasPendingChanges}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        hasPendingChanges
                                            ? 'bg-teal-500 text-white hover:bg-teal-400'
                                            : 'text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    <CheckIcon className="w-3.5 h-3.5" />
                                    Apply
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Zone Select */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Zone</label>
                                <select
                                    value={filters.zone}
                                    onChange={(e) => handleFilterChange("zone", e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer"
                                >
                                    <option value="">All zones</option>
                                    {zones.map((zone) => (
                                        <option key={zone} value={zone}>{zone}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Depth Min */}
                            <FilterInput
                                label="Min Depth"
                                value={filters.depthMin}
                                onChange={(v) => handleFilterChange("depthMin", v)}
                                placeholder="0"
                                unit="m"
                            />

                            {/* Depth Max */}
                            <FilterInput
                                label="Max Depth"
                                value={filters.depthMax}
                                onChange={(v) => handleFilterChange("depthMax", v)}
                                placeholder="∞"
                                unit="m"
                            />

                            {/* Length Min */}
                            <FilterInput
                                label="Min Length"
                                value={filters.lengthMin}
                                onChange={(v) => handleFilterChange("lengthMin", v)}
                                placeholder="0"
                                unit="m"
                            />

                            {/* Length Max */}
                            <FilterInput
                                label="Max Length"
                                value={filters.lengthMax}
                                onChange={(v) => handleFilterChange("lengthMax", v)}
                                placeholder="∞"
                                unit="m"
                            />
                        </div>
                    </div>
                )}

                {/* Loading overlay for filter changes */}
                <div className="relative">
                    {loading && caves.length > 0 && (
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-10 rounded-xl">
                            <div className="w-8 h-8 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin" />
                        </div>
                    )}
                    <CaveTable caves={caves} />
                </div>
            </div>
        </div>
    );
}
