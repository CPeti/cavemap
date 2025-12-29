import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserIcon,
    ChartBarIcon,
    MapIcon,
    ArrowRightOnRectangleIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { getApiUrl, getOAuthUrl } from "../config";

export default function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        cavesUploaded: 0,
        totalLength: 0,
        totalDepth: 0,
        groupsJoined: 0,
        lastActivity: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [editForm, setEditForm] = useState({
        username: '',
        firstName: '',
        lastName: '',
        bio: '',
        avatar: ''
    });
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    // Handle ESC key to close delete modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isDeleteModalOpen) {
                setIsDeleteModalOpen(false);
                setDeleteConfirmation('');
            }
        };

        if (isDeleteModalOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isDeleteModalOpen]);

    function handleFormChange(field, value) {
        setEditForm(prev => ({ ...prev, [field]: value }));

        // Check if the new value is different from the original profile data
        const originalValue = profile?.[field] || '';
        setHasChanges(value !== originalValue);
    }

    async function handleSaveProfile() {
        try {
            setError(null); // Clear any previous errors
            setSuccessMessage(null); // Clear any previous success messages

            // Basic validation
            if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
                setError("First name and last name are required");
                return;
            }

            const response = await fetch(getApiUrl("/users/me"), {
                method: 'PUT',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: editForm.username.trim(),
                    firstName: editForm.firstName.trim(),
                    lastName: editForm.lastName.trim(),
                    bio: editForm.bio.trim(),
                    avatar: editForm.avatar.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to update profile`);
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            setHasChanges(false); // Reset change tracking
            setError(null); // Clear any previous errors
            setSuccessMessage("Profile updated successfully!");

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);

            console.log('Profile updated successfully');

        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.message || "Failed to update profile");
        }
    }

    async function fetchProfile() {
        try {
            setLoading(true);
            setError(null);

            // Fetch user profile
            const profileResponse = await fetch(getApiUrl("/users/me"), {
                credentials: "include",
            });

            if (profileResponse.status === 401) {
                // Redirect to login if not authenticated
                navigate("/login");
                return;
            }

            if (!profileResponse.ok) {
                throw new Error("Failed to load profile");
            }

            const profileData = await profileResponse.json();
            setProfile(profileData);

            // Initialize edit form with current data
            setEditForm({
                username: profileData.username || '',
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                bio: profileData.bio || '',
                avatar: profileData.avatar || ''
            });
            setHasChanges(false);

            // Check if user needs to complete their profile
            // Only auto-open for very new users (no first name at all)
            const isProfileIncomplete = !profileData.firstName && !profileData.lastName;
            if (isProfileIncomplete) {
                setIsEditModalOpen(true); // Auto-open edit modal for brand new users
            }

            // Fetch user statistics
            try {
                const statsResponse = await fetch(getApiUrl("/caves/stats/me"), {
                    credentials: "include",
                });

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
            setStats({
                        cavesUploaded: statsData.caves_uploaded,
                        totalLength: statsData.total_length,
                        totalDepth: statsData.total_depth,
                        lastActivity: statsData.last_activity,
                    });
                } else {
                    // Use placeholder stats if stats endpoint fails
                    setStats(prevStats => ({
                        ...prevStats,
                        cavesUploaded: 0,
                        totalLength: 0,
                        totalDepth: 0,
                        lastActivity: null,
                    }));
                }
            } catch (statsError) {
                console.error("Error fetching stats:", statsError);
                // Use placeholder stats if stats endpoint fails
                setStats(prevStats => ({
                    ...prevStats,
                cavesUploaded: 0,
                totalLength: 0,
                totalDepth: 0,
                lastActivity: null,
                }));
            }

            // Fetch user's groups to get group count
            try {
                const groupsResponse = await fetch(getApiUrl("/groups/me"), {
                    credentials: "include",
                });

                if (groupsResponse.ok) {
                    const groupsData = await groupsResponse.json();
                    setStats(prevStats => ({
                        ...prevStats,
                        groupsJoined: groupsData.length,
                    }));
                } else {
                    setStats(prevStats => ({
                        ...prevStats,
                        groupsJoined: 0,
                    }));
                }
            } catch (groupsError) {
                console.error("Error fetching groups:", groupsError);
                setStats(prevStats => ({
                    ...prevStats,
                    groupsJoined: 0,
                }));
            }

        } catch (err) {
            console.error("Error fetching profile:", err);
            setError(err.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteProfile() {
        try {
            const response = await fetch(getApiUrl("/users/me"), {
                method: 'DELETE',
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete profile`);
            }

            // Sign out after successful deletion
            window.location.href = getOAuthUrl("/sign_out") + "?rd=" + encodeURIComponent("/");
        } catch (err) {
            console.error("Error deleting profile:", err);
            setError(err.message || "Failed to delete profile");
            setIsDeleteModalOpen(false);
        }
    }

    function handleSignOut() {
        window.location.href = getOAuthUrl("/sign_out") + "?rd=" + encodeURIComponent("/");
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-slate-500 text-sm">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
                <div className="max-w-md text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-5">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Error Loading Profile</h3>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={fetchProfile}
                        className="bg-teal-500 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-teal-400 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 pt-16">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Profile</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Manage your account and view your contributions
                        </p>
                    </div>

                    {/* Save Changes Button */}
                    {hasChanges && (
                        <button
                            onClick={handleSaveProfile}
                            className="bg-teal-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                        </button>
                    )}
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-400 text-sm">{successMessage}</span>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-400 text-sm">{error}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Welcome message for new users */}
                        {(!profile?.firstName || !profile?.lastName) && (
                            <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 rounded-xl p-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-teal-500/20 rounded-lg">
                                        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white mb-1">Welcome to CaveDB!</h3>
                                        <p className="text-slate-300 text-sm mb-3">
                                            Complete your profile to get the most out of the cave database. Add your name and tell us a bit about yourself.
                                        </p>
                                        <div className="text-xs text-slate-400">
                                            ↓ Fill out the profile form below
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Information */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-teal-500/10 rounded-lg">
                                    <UserIcon className="w-5 h-5 text-teal-400" />
                                </div>
                                <h2 className="text-lg font-medium text-white">Account Information</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Avatar Display */}
                                {editForm.avatar && (
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={editForm.avatar}
                                            alt="Profile avatar"
                                            className="w-16 h-16 rounded-lg object-cover border border-slate-600"
                                        />
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                Avatar URL
                                            </label>
                                            <input
                                                type="url"
                                                value={editForm.avatar}
                                                onChange={(e) => handleFormChange('avatar', e.target.value)}
                                                placeholder="https://example.com/avatar.jpg"
                                                className="w-full text-sm text-white bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                    {/* Username */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.username}
                                            onChange={(e) => handleFormChange('username', e.target.value)}
                                            placeholder="Enter username"
                                            className="w-full text-sm text-white bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                        />
                                    </div>

                                    {/* First and Last Name (single row, equal size) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.firstName}
                                                onChange={(e) => handleFormChange('firstName', e.target.value)}
                                                placeholder="Enter first name"
                                                className="w-full text-sm text-white bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.lastName}
                                                onChange={(e) => handleFormChange('lastName', e.target.value)}
                                                placeholder="Enter last name"
                                                className="w-full text-sm text-white bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Email (Read-only) */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Email Address
                                        </label>
                                        <div className="text-sm text-white bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2">
                                            {profile?.email || "Not available"}
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Bio
                                        </label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => handleFormChange('bio', e.target.value)}
                                            placeholder="Tell us about yourself and your caving experience..."
                                            rows={3}
                                            className="w-full text-sm text-white bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                                        />
                                    </div>

                                    {/* Account Status */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Account Status
                                        </label>
                                        <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                                            Active
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Statistics */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-teal-500/10 rounded-lg">
                                    <ChartBarIcon className="w-5 h-5 text-teal-400" />
                                </div>
                                <h2 className="text-lg font-medium text-white">Your Contributions</h2>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-semibold text-white">
                                        {stats.cavesUploaded}
                                    </div>
                                    <div className="text-xs text-slate-400">Caves Added</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-semibold text-white">
                                        {Math.round(stats.totalLength)}m
                                    </div>
                                    <div className="text-xs text-slate-400">Total Length</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-semibold text-white">
                                        {Math.round(stats.totalDepth)}m
                                    </div>
                                    <div className="text-xs text-slate-400">Total Depth</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-semibold text-white">
                                        {stats.groupsJoined}
                                    </div>
                                    <div className="text-xs text-slate-400">Groups Joined</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate("/upload")}
                                    className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
                                >
                                    <MapIcon className="w-5 h-5 text-teal-400" />
                                    <div>
                                        <div className="text-sm font-medium text-white">Add New Cave</div>
                                        <div className="text-xs text-slate-400">Upload cave data</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate("/caves")}
                                    className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
                                >
                                    <ChartBarIcon className="w-5 h-5 text-teal-400" />
                                    <div>
                                        <div className="text-sm font-medium text-white">View Database</div>
                                        <div className="text-xs text-slate-400">Browse all caves</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">

                        {/* Sign Out */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400" />
                                    <div>
                                        <div className="text-sm font-medium text-white group-hover:text-red-400">Sign Out</div>
                                        <div className="text-xs text-slate-500">End your session</div>
                                    </div>
                                </div>
                                <div className="text-red-400">→</div>
                            </button>
                        </div>

                        {/* Delete Profile */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <div>
                                        <div className="text-sm font-medium text-white group-hover:text-red-400">Delete Profile</div>
                                        <div className="text-xs text-slate-500">Permanently delete your account</div>
                                    </div>
                                </div>
                                <div className="text-red-400">→</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Profile Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => {
                            setIsDeleteModalOpen(false);
                            setDeleteConfirmation('');
                        }}
                    />

                    {/* Modal */}
                    <div
                        className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setDeleteConfirmation('');
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-medium text-white">Delete Profile</h2>
                        </div>

                        {/* Warning Content */}
                        <div className="space-y-4">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <h3 className="text-sm font-medium text-red-400 mb-1">Warning: This action cannot be undone</h3>
                                        <p className="text-sm text-slate-300">
                                            Deleting your profile will permanently remove all your account data, including your profile information and any associated content. This action cannot be reversed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-2">Type "DELETE" to confirm:</p>
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full text-sm text-white bg-slate-800 border border-slate-600 rounded px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setDeleteConfirmation('');
                                    }}
                                    className="flex-1 bg-slate-700 text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteProfile}
                                    disabled={deleteConfirmation !== 'DELETE'}
                                    className={`flex-1 font-medium px-4 py-2 rounded-lg transition-colors ${
                                        deleteConfirmation === 'DELETE'
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    Delete Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
