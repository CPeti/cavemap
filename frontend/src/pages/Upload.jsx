import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PlusIcon, TrashIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import CoordinateInput from "../components/CoordinateInput";

const emptyEntrance = {
    name: "",
    gps_n: null,
    gps_e: null,
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

const FormInput = ({ label, name, value, onChange, type = "text", placeholder, required, unit, min, max }) => (
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
                min={min}
                max={max}
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

// Login prompt modal
const LoginModal = ({ isOpen, onClose, onLogin }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-slate-700/50 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Sign in required
                    </h3>
                    <p className="text-sm text-slate-400">
                        You need to be signed in to add new caves to the database.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onLogin}
                        className="w-full flex items-center justify-center gap-3 cursor-pointer bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        {/* Google icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Upload() {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState(emptyForm);
    const [entrances, setEntrances] = useState([{ ...emptyEntrance }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

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

    function handleCoordinateChange(index, type, value) {
        const field = type === 'latitude' ? 'gps_n' : 'gps_e';
        handleEntranceChange(index, field, value);
    }

    function addEntrance() {
        setEntrances((prev) => [...prev, { ...emptyEntrance }]);
    }

    function removeEntrance(index) {
        if (entrances.length > 1) {
            setEntrances((prev) => prev.filter((_, i) => i !== index));
        }
    }

    function handleLogin() {
        // Redirect to login page with return URL
        window.location.href = "/login?rd=" + encodeURIComponent(location.pathname);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        // Validate at least one entrance has coordinates
        const validEntrances = entrances.filter(
            (ent) => ent.gps_n !== null && ent.gps_n !== undefined &&
                     ent.gps_e !== null && ent.gps_e !== undefined &&
                     !isNaN(ent.gps_n) && !isNaN(ent.gps_e)
        );

        if (validEntrances.length === 0) {
            setError("At least one entrance with valid coordinates is required.");
            return;
        }

        // Validate survey dates
        const currentYear = new Date().getFullYear();
        const firstSurveyed = formData.first_surveyed ? parseInt(formData.first_surveyed) : null;
        const lastSurveyed = formData.last_surveyed ? parseInt(formData.last_surveyed) : null;

        // Validate year ranges
        if (firstSurveyed && (firstSurveyed < 1800 || firstSurveyed > currentYear)) {
            setError(`First surveyed year must be between 1800 and ${currentYear}.`);
            return;
        }

        if (lastSurveyed && (lastSurveyed < 1800 || lastSurveyed > currentYear)) {
            setError(`Last surveyed year must be between 1800 and ${currentYear}.`);
            return;
        }

        // Validate chronological order
        if (firstSurveyed && lastSurveyed && firstSurveyed >= lastSurveyed) {
            setError("First surveyed year must be earlier than last surveyed year.");
            return;
        }

        // If only last surveyed is provided, ensure it's not in the future
        if (!firstSurveyed && lastSurveyed && lastSurveyed > currentYear) {
            setError(`Last surveyed year cannot be in the future.`);
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
                    gps_n: ent.gps_n,
                    gps_e: ent.gps_e,
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
                // Show login modal instead of redirecting
                setShowLoginModal(true);
                setLoading(false);
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
            {/* Login Modal */}
            <LoginModal 
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={handleLogin}
            />

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
                                type="number"
                                value={formData.first_surveyed}
                                onChange={handleChange}
                                placeholder="e.g., 2020"
                                min="1800"
                                max={new Date().getFullYear()}
                            />
                            <FormInput
                                label="Last Surveyed (Optional)"
                                name="last_surveyed"
                                type="number"
                                value={formData.last_surveyed}
                                onChange={handleChange}
                                placeholder="e.g., 2024"
                                min="1800"
                                max={new Date().getFullYear()}
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
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
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

                                        <CoordinateInput
                                            latitude={entrance.gps_n}
                                            longitude={entrance.gps_e}
                                            onChange={(type, value) => handleCoordinateChange(index, type, value)}
                                            required={true}
                                            className="col-span-2"
                                        />
                                        <div>
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
