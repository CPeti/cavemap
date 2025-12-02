import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    MapIcon,
    TableCellsIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    GlobeAltIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
    const [caves, setCaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCaves: 0,
        totalLength: 0,
        totalVerticalExtent: 0,
        zones: new Set(),
        deepestCave: null,
        longestCave: null,
        recentlySurveyed: [],
    });

    useEffect(() => {
        async function fetchCaves() {
            try {
                const response = await fetch("https://localhost.me/api/caves/", {
                    credentials: "include",
                });

                if (response.status === 401) {
                    window.location.href =
                        "https://auth.localhost.me/oauth2/sign_in?rd=" +
                        encodeURIComponent(window.location.href);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const caveData = await response.json();
                setCaves(caveData);

                // Calculate statistics
                const zones = new Set();
                let totalLength = 0;
                let totalVerticalExtent = 0;
                let deepestCave = null;
                let longestCave = null;

                caveData.forEach((cave) => {
                    if (cave.zone) zones.add(cave.zone);
                    if (cave.length) totalLength += cave.length;
                    if (cave.vertical_extent) totalVerticalExtent += cave.vertical_extent;

                    if (
                        cave.vertical_extent &&
                        (!deepestCave || cave.vertical_extent > deepestCave.vertical_extent)
                    ) {
                        deepestCave = cave;
                    }
                    if (cave.length && (!longestCave || cave.length > longestCave.length)) {
                        longestCave = cave;
                    }
                });

                // Sort by last surveyed date for recent caves
                const recentlySurveyed = [...caveData]
                    .filter((c) => c.last_surveyed)
                    .sort((a, b) => b.last_surveyed.localeCompare(a.last_surveyed))
                    .slice(0, 5);

                setStats({
                    totalCaves: caveData.length,
                    totalLength,
                    totalVerticalExtent,
                    zones,
                    deepestCave,
                    longestCave,
                    recentlySurveyed,
                });
            } catch (error) {
                console.error("Error fetching caves:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCaves();
    }, []);

    const formatNumber = (num) => {
        if (!num) return "—";
        return num.toLocaleString();
    };

    const StatCard = ({ icon: Icon, label, value, unit, iconColor }) => (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-slate-700/50 ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm text-slate-400">{label}</span>
            </div>
            <div className="text-3xl font-semibold text-white tracking-tight">
                {value}
                {unit && <span className="ml-1 text-lg font-normal text-slate-500">{unit}</span>}
            </div>
        </div>
    );

    const FeatureCaveCard = ({ cave, type, icon: Icon }) => (
        <Link
            to={`/cave/${cave.cave_id}`}
            className="group flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">{type}</div>
                    <div className="text-white font-medium group-hover:text-teal-400 transition-colors">
                        {cave.name}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xl font-semibold text-white">
                    {type === "Deepest" ? cave.vertical_extent : cave.length}
                    <span className="text-sm text-slate-500 ml-0.5">m</span>
                </div>
                {cave.zone && (
                    <div className="text-xs text-slate-500">{cave.zone}</div>
                )}
            </div>
        </Link>
    );

    const RecentCaveRow = ({ cave, index }) => (
        <Link
            to={`/cave/${cave.cave_id}`}
            className="group flex items-center gap-4 py-3 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
                {index + 1}
            </div>
            <div className="flex-grow min-w-0">
                <h4 className="font-medium text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                    {cave.name}
                </h4>
                <p className="text-xs text-slate-500">Surveyed {cave.last_surveyed}</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-slate-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 pt-16">
            {/* Hero Section */}
            <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
                <div className="mb-12">
                    <p className="text-teal-400 text-sm font-medium tracking-wide uppercase mb-3">
                        Cave Database & Mapping
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight mb-4">
                        Explore the Underground
                    </h1>
                    <p className="text-lg text-slate-400 max-w-xl">
                        Document and map cave systems. Track surveys, measurements, and locations in one place.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-16">
                    <Link
                        to="/map"
                        className="inline-flex items-center gap-2 bg-teal-500 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-teal-400 transition-colors"
                    >
                        <MapIcon className="w-4 h-4" />
                        Explore Map
                    </Link>
                    <Link
                        to="/caves"
                        className="inline-flex items-center gap-2 bg-slate-800 text-white font-medium px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-colors"
                    >
                        <TableCellsIcon className="w-4 h-4" />
                        View Cadaster
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={ChartBarIcon}
                        label="Total Caves"
                        value={formatNumber(stats.totalCaves)}
                        iconColor="text-slate-400"
                    />
                    <StatCard
                        icon={ArrowTrendingUpIcon}
                        label="Combined Length"
                        value={formatNumber(stats.totalLength)}
                        unit="m"
                        iconColor="text-teal-400"
                    />
                    <StatCard
                        icon={ArrowTrendingDownIcon}
                        label="Total Depth"
                        value={formatNumber(stats.totalVerticalExtent)}
                        unit="m"
                        iconColor="text-slate-400"
                    />
                    <StatCard
                        icon={GlobeAltIcon}
                        label="Active Zones"
                        value={stats.zones.size}
                        iconColor="text-teal-400"
                    />
                </div>
            </div>

            {/* Featured Caves Section */}
            {(stats.deepestCave || stats.longestCave) && (
                <div className="border-t border-slate-800">
                    <div className="max-w-5xl mx-auto px-6 py-12">
                        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-6">
                            Notable Caves
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.deepestCave && (
                                <FeatureCaveCard
                                    cave={stats.deepestCave}
                                    type="Deepest"
                                    icon={ArrowTrendingDownIcon}
                                />
                            )}
                            {stats.longestCave && (
                                <FeatureCaveCard
                                    cave={stats.longestCave}
                                    type="Longest"
                                    icon={ArrowTrendingUpIcon}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity Section */}
            {stats.recentlySurveyed.length > 0 && (
                <div className="border-t border-slate-800">
                    <div className="max-w-5xl mx-auto px-6 py-12">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-slate-900 px-5 py-3 border-b border-slate-800">
                                <h2 className="text-sm font-medium text-white flex items-center gap-2">
                                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Recently Surveyed
                                </h2>
                            </div>
                            <div className="p-4 divide-y divide-slate-100">
                                {stats.recentlySurveyed.map((cave, index) => (
                                    <RecentCaveRow key={cave.cave_id} cave={cave} index={index} />
                                ))}
                            </div>
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100">
                                <Link
                                    to="/caves"
                                    className="text-teal-600 text-sm font-medium hover:text-teal-700 transition-colors flex items-center gap-1"
                                >
                                    View all caves
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {stats.totalCaves === 0 && !loading && (
                <div className="border-t border-slate-800">
                    <div className="max-w-md mx-auto px-6 py-20 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-5">
                            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No caves yet</h3>
                        <p className="text-slate-500 mb-6 text-sm">
                            Start documenting your discoveries by adding your first cave.
                        </p>
                        <Link
                            to="/upload"
                            className="inline-flex items-center gap-2 bg-teal-500 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-teal-400 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Cave
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
