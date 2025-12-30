import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeftIcon,
    MapPinIcon,
    CalendarIcon,
    ArrowsPointingOutIcon,
    ArrowTrendingDownIcon,
    MapIcon,
    TagIcon,
    GlobeAltIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";
import { getApiUrl, getOAuthUrl } from "../config";

const InfoItem = ({ label, value, unit }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-sm font-medium text-white">
            {value ?? "—"}
            {value && unit && <span className="text-slate-500 ml-1">{unit}</span>}
        </span>
    </div>
);

const StatCard = ({ icon: Icon, label, value, unit, iconColor = "text-slate-400" }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-slate-700/50 ${iconColor}`}>
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-semibold text-white">
            {value ?? "—"}
            {value && unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
        </div>
    </div>
);

export default function CaveDetail() {
    const { caveId } = useParams();
    const navigate = useNavigate();
    const [cave, setCave] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        zone: "",
        code: "",
        first_surveyed: "",
        last_surveyed: "",
        length: "",
        depth: "",
        vertical_extent: "",
        horizontal_extent: "",
    });
    const [saving, setSaving] = useState(false);

    // Entrance editing state
    const [showAddEntranceModal, setShowAddEntranceModal] = useState(false);
    const [showEditEntranceModal, setShowEditEntranceModal] = useState(false);
    const [selectedEntrance, setSelectedEntrance] = useState(null);
    const [entranceForm, setEntranceForm] = useState({
        name: "",
        gps_n: "",
        gps_e: "",
        asl_m: "",
    });
    const [savingEntrance, setSavingEntrance] = useState(false);

    // Groups state
    const [caveGroups, setCaveGroups] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [showAddGroupModal, setShowAddGroupModal] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [addingGroup, setAddingGroup] = useState(false);

    const canEdit = cave && cave.is_owner;

    useEffect(() => {
        async function fetchCave() {
            try {
                const res = await fetch(getApiUrl(`/caves/${caveId}`), {
                    credentials: "include",
                });

                if (res.status === 401) {
                    window.location.href = getOAuthUrl("/sign_in") + "?rd=" +
                        encodeURIComponent(window.location.href);
                    return;
                }

                if (!res.ok) {
                    throw new Error("Failed to fetch cave");
                }

                const data = await res.json();
                setCave(data);

                // Initialize edit form with current cave data
                setEditForm({
                    name: data.name || "",
                    zone: data.zone || "",
                    code: data.code || "",
                    first_surveyed: data.first_surveyed || "",
                    last_surveyed: data.last_surveyed || "",
                    length: data.length || "",
                    depth: data.depth || "",
                    vertical_extent: data.vertical_extent || "",
                    horizontal_extent: data.horizontal_extent || "",
                });
            } catch (err) {
                console.error("Error fetching cave:", err);
                setError("Failed to load cave data");
            } finally {
                setLoading(false);
            }
        }

        fetchCave();
    }, [caveId]);

    // Fetch cave groups
    useEffect(() => {
        async function fetchCaveGroups() {
            try {
                const res = await fetch(getApiUrl(`/groups/caves/${caveId}/groups`), {
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setCaveGroups(data);
                }
            } catch (err) {
                console.error("Error fetching cave groups:", err);
            }
        }
        fetchCaveGroups();
    }, [caveId]);

    // Fetch user's groups (where they are admin/owner) if owner
    useEffect(() => {
        async function fetchUserGroups() {
            if (!cave || !canEdit) return;
            try {
                const res = await fetch(getApiUrl("/groups/me"), {
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setUserGroups(data);
                }
            } catch (err) {
                console.error("Error fetching user groups:", err);
            }
        }
        fetchUserGroups();
    }, [cave, canEdit]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 pt-16 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-slate-500 text-sm">Loading cave details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 pt-16 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-5">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Error Loading Cave</h3>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/caves")}
                        className="inline-flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Database
                    </button>
                </div>
            </div>
        );
    }

    const entrances = cave.entrances || [];
    const primaryEntrance = entrances[0];

    async function handleEditSubmit(e) {
        e.preventDefault();

        // Basic validation
        if (!editForm.name.trim()) {
            alert("Cave name is required");
            return;
        }

        // Validate year ranges
        if (editForm.first_surveyed && editForm.last_surveyed) {
            const firstYear = parseInt(editForm.first_surveyed);
            const lastYear = parseInt(editForm.last_surveyed);
            if (firstYear > lastYear) {
                alert("First surveyed year cannot be after last surveyed year");
                return;
            }
        }

        if (editForm.last_surveyed && parseInt(editForm.last_surveyed) > new Date().getFullYear()) {
            alert("Last surveyed year cannot be in the future");
            return;
        }

        setSaving(true);

        try {
            // Build payload
            const payload = {
                name: editForm.name.trim(),
                zone: editForm.zone.trim() || null,
                code: editForm.code.trim() || null,
                first_surveyed: editForm.first_surveyed || null,
                last_surveyed: editForm.last_surveyed || null,
                length: editForm.length ? parseFloat(editForm.length) : null,
                depth: editForm.depth ? parseFloat(editForm.depth) : null,
                vertical_extent: editForm.vertical_extent ? parseFloat(editForm.vertical_extent) : null,
                horizontal_extent: editForm.horizontal_extent ? parseFloat(editForm.horizontal_extent) : null,
            };

            const response = await fetch(getApiUrl(`/caves/${caveId}`), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.status === 401) {
                window.location.href = getOAuthUrl("/sign_in") + "?rd=" +
                    encodeURIComponent(window.location.href);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const updatedCave = await response.json();
            setCave(updatedCave);

            // Update edit form with new data
            setEditForm({
                name: updatedCave.name || "",
                zone: updatedCave.zone || "",
                code: updatedCave.code || "",
                first_surveyed: updatedCave.first_surveyed || "",
                last_surveyed: updatedCave.last_surveyed || "",
                length: updatedCave.length || "",
                depth: updatedCave.depth || "",
                vertical_extent: updatedCave.vertical_extent || "",
                horizontal_extent: updatedCave.horizontal_extent || "",
            });

            setShowEditModal(false);
        } catch (err) {
            console.error("Error updating cave:", err);
            alert("Failed to update cave: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    // Entrance management functions
    const handleAddEntrance = () => {
        setEntranceForm({
            name: "",
            gps_n: "",
            gps_e: "",
            asl_m: "",
        });
        setShowAddEntranceModal(true);
    };

    const handleEditEntrance = (entrance) => {
        setSelectedEntrance(entrance);
        setEntranceForm({
            name: entrance.name || "",
            gps_n: entrance.gps_n || "",
            gps_e: entrance.gps_e || "",
            asl_m: entrance.asl_m || "",
        });
        setShowEditEntranceModal(true);
    };

    const handleDeleteEntrance = async (entrance) => {
        if (!confirm(`Are you sure you want to delete the entrance "${entrance.name || `Entrance ${entrance.entrance_id}`}"?`)) {
            return;
        }

        try {
            const response = await fetch(getApiUrl(`/caves/${caveId}/entrances/${entrance.entrance_id}`), {
                method: "DELETE",
                credentials: "include",
            });

            if (response.status === 401) {
                window.location.href = getOAuthUrl("/sign_in") + "?rd=" + encodeURIComponent(window.location.href);
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to delete entrance");
            }

            // Refresh cave data
            const caveResponse = await fetch(getApiUrl(`/caves/${caveId}`), {
                credentials: "include",
            });

            if (caveResponse.ok) {
                const updatedCave = await caveResponse.json();
                setCave(updatedCave);
            }
        } catch (err) {
            console.error("Error deleting entrance:", err);
            alert("Failed to delete entrance: " + err.message);
        }
    };

    const handleDeleteCave = async () => {
        const confirmed = confirm(
            `Are you sure you want to delete "${cave.name}"?\n\nThis action cannot be undone and will also delete all ${entrances.length} entrance(s) associated with this cave.`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(getApiUrl(`/caves/${caveId}`), {
                method: "DELETE",
                credentials: "include",
            });

            if (response.status === 401) {
                window.location.href = getOAuthUrl("/sign_in") + "?rd=" + encodeURIComponent(window.location.href);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            // Redirect to caves list after successful deletion
            navigate("/caves");
        } catch (err) {
            console.error("Error deleting cave:", err);
            alert("Failed to delete cave: " + err.message);
        }
    };

    const handleEntranceSubmit = async (e, isEditing = false) => {
        e.preventDefault();

        // Validation
        if (!entranceForm.gps_n || !entranceForm.gps_e) {
            alert("Latitude and longitude are required");
            return;
        }

        const gpsN = parseFloat(entranceForm.gps_n);
        const gpsE = parseFloat(entranceForm.gps_e);

        if (isNaN(gpsN) || gpsN < -90 || gpsN > 90) {
            alert("Invalid latitude (must be between -90 and 90)");
            return;
        }

        if (isNaN(gpsE) || gpsE < -180 || gpsE > 180) {
            alert("Invalid longitude (must be between -180 and 180)");
            return;
        }

        setSavingEntrance(true);

        try {
            const payload = {
                name: entranceForm.name.trim() || null,
                gps_n: gpsN,
                gps_e: gpsE,
                asl_m: entranceForm.asl_m ? parseFloat(entranceForm.asl_m) : null,
            };

            let response;
            if (isEditing) {
                // Update existing entrance
                response = await fetch(getApiUrl(`/caves/${caveId}/entrances/${selectedEntrance.entrance_id}`), {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                });
            } else {
                // Create new entrance
                response = await fetch(getApiUrl(`/caves/${caveId}/entrances`), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                });
            }

            if (response.status === 401) {
                window.location.href = getOAuthUrl("/sign_in") + "?rd=" + encodeURIComponent(window.location.href);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            // Refresh cave data
            const caveResponse = await fetch(getApiUrl(`/caves/${caveId}`), {
                credentials: "include",
            });

            if (caveResponse.ok) {
                const updatedCave = await caveResponse.json();
                setCave(updatedCave);
            }

            setShowAddEntranceModal(false);
            setShowEditEntranceModal(false);
            setSelectedEntrance(null);
        } catch (err) {
            console.error("Error saving entrance:", err);
            alert("Failed to save entrance: " + err.message);
        } finally {
            setSavingEntrance(false);
        }
    };

    const handleAddToGroup = async () => {
        if (!selectedGroupId) return;
        setAddingGroup(true);
        try {
            const response = await fetch(getApiUrl(`/groups/${selectedGroupId}/caves`), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cave_id: parseInt(caveId) }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to add cave to group");
            }

            // Refresh cave groups
            const res = await fetch(getApiUrl(`/groups/caves/${caveId}/groups`), {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setCaveGroups(data);
            }

            setShowAddGroupModal(false);
            setSelectedGroupId("");
        } catch (err) {
            console.error("Error adding cave to group:", err);
            alert(err.message);
        } finally {
            setAddingGroup(false);
        }
    };

    const handleRemoveFromGroup = async (groupId, groupName) => {
        if (!confirm(`Remove this cave from "${groupName}"?`)) return;

        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}/caves/${caveId}`), {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to remove cave from group");
            }

            // Refresh cave groups
            const res = await fetch(getApiUrl(`/groups/caves/${caveId}/groups`), {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setCaveGroups(data);
            }
        } catch (err) {
            console.error("Error removing cave from group:", err);
            alert(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 pt-16">
            {/* Header */}
            <div className="border-b border-slate-800">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <button
                        onClick={() => navigate("/caves")}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="text-sm">Back to Database</span>
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold text-white mb-2">{cave.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                {cave.zone && (
                                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                                        <GlobeAltIcon className="w-4 h-4" />
                                        {cave.zone}
                                    </span>
                                )}
                                {cave.code && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-xs">
                                        <TagIcon className="w-3 h-3" />
                                        {cave.code}
                                    </span>
                                )}
                                {canEdit && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs">
                                        <PencilIcon className="w-3 h-3" />
                                        You own this cave
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                        {primaryEntrance && (
                            <Link
                                to="/map"
                                state={{ center: [primaryEntrance.gps_e, primaryEntrance.gps_n], zoom: 15 }}
                                className="inline-flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors text-sm font-medium"
                            >
                                <MapIcon className="w-4 h-4" />
                                View on Map
                            </Link>
                        )}
                            {canEdit && (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="inline-flex items-center gap-2 bg-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-600 hover:text-white transition-colors text-sm font-medium"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Edit Cave
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={ArrowsPointingOutIcon}
                        label="Length"
                        value={cave.length}
                        unit="m"
                        iconColor="text-teal-400"
                    />
                    <StatCard
                        icon={ArrowTrendingDownIcon}
                        label="Depth"
                        value={cave.depth}
                        unit="m"
                        iconColor="text-slate-400"
                    />
                    <StatCard
                        icon={ArrowTrendingDownIcon}
                        label="Vertical Extent"
                        value={cave.vertical_extent}
                        unit="m"
                        iconColor="text-slate-400"
                    />
                    <StatCard
                        icon={ArrowsPointingOutIcon}
                        label="Horizontal Extent"
                        value={cave.horizontal_extent}
                        unit="m"
                        iconColor="text-teal-400"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Cave Information */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                                <TagIcon className="w-4 h-4 text-teal-400" />
                                Cave Information
                            </h2>
                            <div className="divide-y divide-slate-700/50">
                                <InfoItem label="Name" value={cave.name} />
                                <InfoItem label="Zone" value={cave.zone} />
                                <InfoItem label="Code" value={cave.code} />
                                <InfoItem label="Length" value={cave.length} unit="m" />
                                <InfoItem label="Depth" value={cave.depth} unit="m" />
                                <InfoItem label="Vertical Extent" value={cave.vertical_extent} unit="m" />
                                <InfoItem label="Horizontal Extent" value={cave.horizontal_extent} unit="m" />
                            </div>
                        </div>

                        {/* Entrances */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-teal-400" />
                                Entrances
                                <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                    {entrances.length}
                                </span>
                                {canEdit && (
                                    <button
                                        onClick={handleAddEntrance}
                                        className="ml-2 inline-flex items-center gap-1 text-xs bg-teal-500 text-white px-2 py-1 rounded hover:bg-teal-400 transition-colors"
                                    >
                                        <PlusIcon className="w-3 h-3" />
                                        Add
                                    </button>
                                )}
                            </h2>

                            {entrances.length > 0 ? (
                                <div className="space-y-4">
                                    {entrances.map((entrance, index) => (
                                        <div
                                            key={entrance.entrance_id}
                                            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-white">
                                                    {entrance.name || `Entrance ${index + 1}`}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {canEdit && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditEntrance(entrance)}
                                                                className="text-xs text-slate-400 hover:text-teal-400 transition-colors"
                                                            >
                                                                <PencilIcon className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEntrance(entrance)}
                                                                className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <TrashIcon className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <Link
                                                        to="/map"
                                                        state={{ center: [entrance.gps_e, entrance.gps_n], zoom: 17 }}
                                                        className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                                    >
                                                        View on map →
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <span className="block text-xs text-slate-500 mb-1">Latitude</span>
                                                    <span className="text-sm text-slate-300 font-mono">
                                                        {entrance.gps_n?.toFixed(6)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-slate-500 mb-1">Longitude</span>
                                                    <span className="text-sm text-slate-300 font-mono">
                                                        {entrance.gps_e?.toFixed(6)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-slate-500 mb-1">Altitude</span>
                                                    <span className="text-sm text-slate-300">
                                                        {entrance.asl_m ? `${entrance.asl_m} m` : "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <MapPinIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">No entrances recorded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Survey Info */}
                    <div className="space-y-6">
                        {/* Survey Dates */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-teal-400" />
                                Survey History
                            </h2>
                            <div className="divide-y divide-slate-700/50">
                                <InfoItem label="First Surveyed" value={cave.first_surveyed} />
                                <InfoItem label="Last Surveyed" value={cave.last_surveyed} />
                            </div>
                        </div>

                        {/* Groups */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                                <UserGroupIcon className="w-4 h-4 text-teal-400" />
                                Assigned Groups
                                <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                    {caveGroups.length}
                                </span>
                                {canEdit && (
                                    <button
                                        onClick={() => setShowAddGroupModal(true)}
                                        className="ml-2 inline-flex items-center gap-1 text-xs bg-teal-500 text-white px-2 py-1 rounded hover:bg-teal-400 transition-colors"
                                    >
                                        <PlusIcon className="w-3 h-3" />
                                        Add
                                    </button>
                                )}
                            </h2>

                            {caveGroups.length > 0 ? (
                                <div className="space-y-2">
                                    {caveGroups.map((group) => (
                                        <div
                                            key={group.group_id}
                                            className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-white">
                                                    {group.group_name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Added by {group.assigned_by} • {new Date(group.assigned_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleRemoveFromGroup(group.group_id, group.group_name)}
                                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                                    title="Remove from group"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <UserGroupIcon className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500">Not assigned to any groups</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h2 className="text-sm font-medium text-white mb-4">Quick Actions</h2>
                            <div className="space-y-2">
                                {primaryEntrance && (
                                    <Link
                                        to="/map"
                                        state={{ center: [primaryEntrance.gps_e, primaryEntrance.gps_n], zoom: 15 }}
                                        className="flex items-center gap-3 w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                    >
                                        <MapIcon className="w-4 h-4 text-teal-400" />
                                        View on Map
                                    </Link>
                                )}
                                <a
                                    href={primaryEntrance ? `https://www.google.com/maps?q=${primaryEntrance.gps_n},${primaryEntrance.gps_e}` : "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm transition-colors ${
                                        primaryEntrance
                                            ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                                            : "text-slate-600 cursor-not-allowed"
                                    }`}
                                >
                                    <GlobeAltIcon className="w-4 h-4 text-slate-400" />
                                    Open in Google Maps
                                </a>
                                {canEdit && (
                                    <button
                                        onClick={handleDeleteCave}
                                        className="flex items-center gap-3 w-full px-4 py-3 bg-red-900/50 border border-red-700/50 rounded-lg text-sm text-red-300 hover:bg-red-900 hover:text-white transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-400" />
                                        Delete Cave
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                            <h2 className="text-sm font-medium text-white mb-4">Database Info</h2>
                            <div className="divide-y divide-slate-700/50">
                                <InfoItem label="Cave ID" value={cave.cave_id} />
                                <InfoItem label="Owner" value={cave.owner_username} />
                                <InfoItem label="Entrances" value={entrances.length} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Cave Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />

                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Edit Cave</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Cave Name *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Zone
                                </label>
                                <input
                                    type="text"
                                    value={editForm.zone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, zone: e.target.value }))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="e.g., Zone A"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Code
                                </label>
                                <input
                                    type="text"
                                    value={editForm.code}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="e.g., CAV-001"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        First Surveyed
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.first_surveyed}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, first_surveyed: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="Year"
                                        min="1800"
                                        max={new Date().getFullYear()}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Last Surveyed
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.last_surveyed}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, last_surveyed: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="Year"
                                        min="1800"
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Length (m)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editForm.length}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, length: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="0.0"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Depth (m)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editForm.depth}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, depth: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="0.0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Vertical Extent (m)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editForm.vertical_extent}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, vertical_extent: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="0.0"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Horizontal Extent (m)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editForm.horizontal_extent}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, horizontal_extent: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="0.0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 bg-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Entrance Modal */}
            {showAddEntranceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddEntranceModal(false)} />

                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Add Entrance</h2>
                            <button
                                onClick={() => setShowAddEntranceModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={(e) => handleEntranceSubmit(e, false)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Entrance Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={entranceForm.name}
                                    onChange={(e) => setEntranceForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="e.g., Main Entrance"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Latitude *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={entranceForm.gps_n}
                                        onChange={(e) => setEntranceForm(prev => ({ ...prev, gps_n: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="e.g., 45.123456"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Longitude *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={entranceForm.gps_e}
                                        onChange={(e) => setEntranceForm(prev => ({ ...prev, gps_e: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="e.g., 14.567890"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Altitude (m)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={entranceForm.asl_m}
                                    onChange={(e) => setEntranceForm(prev => ({ ...prev, asl_m: e.target.value }))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="e.g., 1200"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={savingEntrance}
                                    className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {savingEntrance ? "Adding..." : "Add Entrance"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddEntranceModal(false)}
                                    className="flex-1 bg-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Entrance Modal */}
            {showEditEntranceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditEntranceModal(false)} />

                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Edit Entrance</h2>
                            <button
                                onClick={() => setShowEditEntranceModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={(e) => handleEntranceSubmit(e, true)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Entrance Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={entranceForm.name}
                                    onChange={(e) => setEntranceForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="e.g., Main Entrance"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Latitude *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={entranceForm.gps_n}
                                        onChange={(e) => setEntranceForm(prev => ({ ...prev, gps_n: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="e.g., 45.123456"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Longitude *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={entranceForm.gps_e}
                                        onChange={(e) => setEntranceForm(prev => ({ ...prev, gps_e: e.target.value }))}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="e.g., 14.567890"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Altitude (m)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={entranceForm.asl_m}
                                    onChange={(e) => setEntranceForm(prev => ({ ...prev, asl_m: e.target.value }))}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="e.g., 1200"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={savingEntrance}
                                    className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {savingEntrance ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditEntranceModal(false)}
                                    className="flex-1 bg-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add to Group Modal */}
            {showAddGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddGroupModal(false)} />
                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Add to Group</h2>
                            <button
                                onClick={() => setShowAddGroupModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Select Group
                                </label>
                                <select
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                    <option value="">Choose a group...</option>
                                    {userGroups
                                        .filter(g => !caveGroups.some(cg => cg.group_id === g.group_id))
                                        .map((group) => (
                                            <option key={group.group_id} value={group.group_id}>
                                                {group.name}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    Only groups where you are admin/owner are shown
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAddGroupModal(false)}
                                    className="flex-1 bg-slate-700 text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddToGroup}
                                    disabled={!selectedGroupId || addingGroup}
                                    className="flex-1 bg-teal-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addingGroup ? "Adding..." : "Add to Group"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
