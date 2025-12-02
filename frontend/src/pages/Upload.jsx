import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, TrashIcon, MapPinIcon } from "@heroicons/react/24/outline";

const emptyEntrance = {
    name: "",
    gps_n: "",
    gps_e: "",
    asl_m: "",
};

const emptyForm = {
    name: "",
    zone: "",
    code: "",
    first_surveyed: "",
    last_surveyed: "",
    length: "",
    depth: "",
    vertical_extent: "",
    horizontal_extent: "",
};

const FormInput = ({ label, name, value, onChange, type = "text", placeholder, required, unit }) => (
    <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                step={type === "number" ? "any" : undefined}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    {unit}
                </span>
            )}
        </div>
    </div>
);

export default function Upload() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(emptyForm);
    const [entrances, setEntrances] = useState([{ ...emptyEntrance }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData((f) => ({ ...f, [name]: value }));
    }

    function handleEntranceChange(index, field, value) {
        setEntrances((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    function addEntrance() {
        setEntrances((prev) => [...prev, { ...emptyEntrance }]);
    }

    function removeEntrance(index) {
        if (entrances.length > 1) {
            setEntrances((prev) => prev.filter((_, i) => i !== index));
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        // Validate at least one entrance has coordinates
        const validEntrances = entrances.filter(
            (ent) => ent.gps_n && ent.gps_e
        );

        if (validEntrances.length === 0) {
            setError("At least one entrance with coordinates is required.");
            return;
        }

        setLoading(true);

        try {
            // Build the payload
            const payload = {
                name: formData.name.trim(),
                zone: formData.zone.trim() || null,
                code: formData.code.trim() || null,
                first_surveyed: formData.first_surveyed || null,
                last_surveyed: formData.last_surveyed || null,
                length: formData.length ? parseFloat(formData.length) : null,
                depth: formData.depth ? parseFloat(formData.depth) : null,
                vertical_extent: formData.vertical_extent ? parseFloat(formData.vertical_extent) : null,
                horizontal_extent: formData.horizontal_extent ? parseFloat(formData.horizontal_extent) : null,
                entrances: validEntrances.map((ent) => ({
                    name: ent.name.trim() || null,
                    gps_n: parseFloat(ent.gps_n),
                    gps_e: parseFloat(ent.gps_e),
                    asl_m: ent.asl_m ? parseFloat(ent.asl_m) : null,
                })),
            };

            const response = await fetch("https://localhost.me/api/caves/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.status === 401) {
                window.location.href = "https://auth.localhost.me/oauth2/sign_in?rd=" +
                    encodeURIComponent(window.location.href);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const createdCave = await response.json();
            navigate(`/cave/${createdCave.cave_id}`);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to create cave. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 pt-16">
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-white">Add New Cave</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Enter cave details and at least one entrance location
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                        <h2 className="text-sm font-medium text-white mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <FormInput
                                    label="Cave Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter cave name"
                                    required
                                />
                            </div>
                            <FormInput
                                label="Zone"
                                name="zone"
                                value={formData.zone}
                                onChange={handleChange}
                                placeholder="e.g., Zone A"
                            />
                            <FormInput
                                label="Code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="e.g., CAV-001"
                            />
                        </div>
                    </div>

                    {/* Survey Dates */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                        <h2 className="text-sm font-medium text-white mb-4">Survey Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput
                                label="First Surveyed"
                                name="first_surveyed"
                                type="date"
                                value={formData.first_surveyed}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Last Surveyed"
                                name="last_surveyed"
                                type="date"
                                value={formData.last_surveyed}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Measurements */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                        <h2 className="text-sm font-medium text-white mb-4">Measurements</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <FormInput
                                label="Length"
                                name="length"
                                type="number"
                                value={formData.length}
                                onChange={handleChange}
                                placeholder="0"
                                unit="m"
                            />
                            <FormInput
                                label="Depth"
                                name="depth"
                                type="number"
                                value={formData.depth}
                                onChange={handleChange}
                                placeholder="0"
                                unit="m"
                            />
                            <FormInput
                                label="Vertical Extent"
                                name="vertical_extent"
                                type="number"
                                value={formData.vertical_extent}
                                onChange={handleChange}
                                placeholder="0"
                                unit="m"
                            />
                            <FormInput
                                label="Horizontal Extent"
                                name="horizontal_extent"
                                type="number"
                                value={formData.horizontal_extent}
                                onChange={handleChange}
                                placeholder="0"
                                unit="m"
                            />
                        </div>
                    </div>

                    {/* Entrances */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-medium text-white flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-teal-400" />
                                Entrances
                            </h2>
                            <button
                                type="button"
                                onClick={addEntrance}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                            >
                                <PlusIcon className="w-3.5 h-3.5" />
                                Add Entrance
                            </button>
                        </div>

                        <div className="space-y-4">
                            {entrances.map((entrance, index) => (
                                <div
                                    key={index}
                                    className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-slate-400">
                                            Entrance {index + 1}
                                        </span>
                                        {entrances.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeEntrance(index)}
                                                className="text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="col-span-2 sm:col-span-4">
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                Entrance Name
                                            </label>
                                            <input
                                                type="text"
                                                value={entrance.name}
                                                onChange={(e) => handleEntranceChange(index, "name", e.target.value)}
                                                placeholder="e.g., Main Entrance"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                Latitude <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={entrance.gps_n}
                                                onChange={(e) => handleEntranceChange(index, "gps_n", e.target.value)}
                                                placeholder="45.1234"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                Longitude <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={entrance.gps_e}
                                                onChange={(e) => handleEntranceChange(index, "gps_e", e.target.value)}
                                                placeholder="14.5678"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                Altitude
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={entrance.asl_m}
                                                    onChange={(e) => handleEntranceChange(index, "asl_m", e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                                                    m asl
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/caves")}
                            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                loading
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-teal-500 text-white hover:bg-teal-400'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="w-4 h-4" />
                                    Create Cave
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
