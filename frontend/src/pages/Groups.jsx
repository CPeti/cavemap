import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserGroupIcon,
    PlusIcon,
    EnvelopeIcon,
    CheckIcon,
    XMarkIcon,
    ChevronRightIcon,
    UsersIcon,
    ExclamationTriangleIcon,
    GlobeAltIcon,
    LockClosedIcon,
    ClipboardDocumentListIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { getApiUrl, getOAuthUrl } from "../config";

const JOIN_POLICY_CONFIG = {
    open: {
        label: "Open",
        description: "Anyone can join",
        icon: GlobeAltIcon,
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
    },
    application: {
        label: "Apply to Join",
        description: "Admins approve applications",
        icon: ClipboardDocumentListIcon,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
    },
    invite_only: {
        label: "Invite Only",
        description: "By invitation only",
        icon: LockClosedIcon,
        color: "text-slate-400",
        bg: "bg-slate-700",
        border: "border-slate-600",
    },
};

export default function Groups() {
    const navigate = useNavigate();
    const [allGroups, setAllGroups] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Create group modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDescription, setNewGroupDescription] = useState("");
    const [newGroupJoinPolicy, setNewGroupJoinPolicy] = useState("invite_only");
    const [creating, setCreating] = useState(false);

    // Apply modal
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyGroupId, setApplyGroupId] = useState(null);
    const [applyGroupName, setApplyGroupName] = useState("");
    const [applyMessage, setApplyMessage] = useState("");
    const [applying, setApplying] = useState(false);

    const myGroups = allGroups.filter((g) => g.is_member);
    const discoverGroups = allGroups.filter((g) => !g.is_member);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [groupsRes, invitationsRes, applicationsRes] = await Promise.all([
                fetch(getApiUrl("/groups/"), { credentials: "include" }),
                fetch(getApiUrl("/groups/invitations/me"), { credentials: "include" }),
                fetch(getApiUrl("/groups/applications/me"), { credentials: "include" }),
            ]);

            if (groupsRes.status === 401) {
                navigate("/login");
                return;
            }

            if (!groupsRes.ok) throw new Error("Failed to fetch groups");

            const groupsData = await groupsRes.json();
            setAllGroups(groupsData);

            if (invitationsRes.ok) {
                const invitationsData = await invitationsRes.json();
                setInvitations(invitationsData);
            }

            if (applicationsRes.ok) {
                const applicationsData = await applicationsRes.json();
                setApplications(applicationsData.filter((a) => a.status === "pending"));
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        setCreating(true);
        try {
            const response = await fetch(getApiUrl("/groups/"), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newGroupName.trim(),
                    description: newGroupDescription.trim() || null,
                    join_policy: newGroupJoinPolicy,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to create group");
            }

            const newGroup = await response.json();
            setShowCreateModal(false);
            setNewGroupName("");
            setNewGroupDescription("");
            setNewGroupJoinPolicy("invite_only");
            navigate(`/groups/${newGroup.group_id}`);
        } catch (err) {
            console.error("Error creating group:", err);
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleInvitationResponse = async (invitationId, accept) => {
        setActionLoading(`inv-${invitationId}`);
        try {
            const response = await fetch(getApiUrl(`/groups/invitations/${invitationId}/respond`), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accept }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to respond to invitation");
            }

            setInvitations((prev) => prev.filter((inv) => inv.invitation_id !== invitationId));
            if (accept) fetchData();
        } catch (err) {
            console.error("Error responding to invitation:", err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleJoinGroup = async (groupId) => {
        setActionLoading(`join-${groupId}`);
        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}/join`), {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to join group");
            }

            fetchData();
        } catch (err) {
            console.error("Error joining group:", err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const openApplyModal = (group) => {
        setApplyGroupId(group.group_id);
        setApplyGroupName(group.name);
        setApplyMessage("");
        setShowApplyModal(true);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setApplying(true);
        try {
            const response = await fetch(getApiUrl(`/groups/${applyGroupId}/apply`), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: applyMessage.trim() || null }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to submit application");
            }

            setShowApplyModal(false);
            fetchData();
        } catch (err) {
            console.error("Error applying:", err);
            setError(err.message);
        } finally {
            setApplying(false);
        }
    };

    const handleCancelApplication = async (applicationId) => {
        setActionLoading(`cancel-${applicationId}`);
        try {
            const response = await fetch(getApiUrl(`/groups/applications/${applicationId}`), {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to cancel application");
            }

            setApplications((prev) => prev.filter((a) => a.application_id !== applicationId));
            fetchData();
        } catch (err) {
            console.error("Error canceling application:", err);
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const renderJoinPolicyBadge = (policy) => {
        const config = JOIN_POLICY_CONFIG[policy] || JOIN_POLICY_CONFIG.invite_only;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 pt-16">
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                            <div className="w-10 h-10 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto" />
                            <p className="mt-4 text-slate-500 text-sm">Loading groups...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 pt-16">
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">Expedition Groups</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Manage your groups and discover new teams to join
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-400 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Group
                    </button>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                                <span className="text-red-400 text-sm">{error}</span>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <EnvelopeIcon className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-medium text-white">Pending Invitations</h2>
                            <span className="bg-amber-500/20 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
                                {invitations.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {invitations.map((invitation) => (
                                <div
                                    key={invitation.invitation_id}
                                    className="bg-slate-800/50 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-amber-500/10 rounded-lg">
                                            <UserGroupIcon className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{invitation.group_name}</h3>
                                            <p className="text-slate-500 text-sm">
                                                Invited by {invitation.inviter_username || invitation.inviter_email} as{" "}
                                                <span className="text-slate-400">{invitation.role}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleInvitationResponse(invitation.invitation_id, false)}
                                            disabled={actionLoading === `inv-${invitation.invitation_id}`}
                                            className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleInvitationResponse(invitation.invitation_id, true)}
                                            disabled={actionLoading === `inv-${invitation.invitation_id}`}
                                            className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50"
                                        >
                                            <CheckIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pending Applications */}
                {applications.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <ClipboardDocumentListIcon className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-medium text-white">Your Applications</h2>
                            <span className="bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full">
                                {applications.length} pending
                            </span>
                        </div>
                        <div className="space-y-3">
                            {applications.map((app) => (
                                <div
                                    key={app.application_id}
                                    className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-blue-500/10 rounded-lg">
                                            <ClipboardDocumentListIcon className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{app.group_name}</h3>
                                            <p className="text-slate-500 text-sm">
                                                Applied {new Date(app.created_at).toLocaleDateString()}
                                                {app.message && <span className="text-slate-400"> · "{app.message}"</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCancelApplication(app.application_id)}
                                        disabled={actionLoading === `cancel-${app.application_id}`}
                                        className="px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Groups */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <UsersIcon className="w-5 h-5 text-teal-400" />
                        <h2 className="text-lg font-medium text-white">Your Groups</h2>
                        <span className="text-slate-500 text-sm">({myGroups.length})</span>
                    </div>

                    {myGroups.length === 0 ? (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                            <UserGroupIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">You're not a member of any groups yet</p>
                            <p className="text-slate-500 text-xs mt-1">Create a group or join one below</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {myGroups.map((group) => (
                                <button
                                    key={group.group_id}
                                    onClick={() => navigate(`/groups/${group.group_id}`)}
                                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800 hover:border-slate-600 transition-all text-left w-full group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                                            <UserGroupIcon className="w-5 h-5 text-teal-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-medium group-hover:text-teal-400 transition-colors">
                                                    {group.name}
                                                </h3>
                                                {renderJoinPolicyBadge(group.join_policy)}
                                            </div>
                                            <p className="text-slate-500 text-sm mt-0.5">
                                                {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                                                {group.description && (
                                                    <>
                                                        <span className="mx-2">·</span>
                                                        <span className="text-slate-400">{group.description}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Discover Groups */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <GlobeAltIcon className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-medium text-white">Discover Groups</h2>
                        <span className="text-slate-500 text-sm">({discoverGroups.length})</span>
                    </div>

                    {discoverGroups.length === 0 ? (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                            <GlobeAltIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No other groups to discover</p>
                            <p className="text-slate-500 text-xs mt-1">You're a member of all available groups!</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {discoverGroups.map((group) => {
                                const policyConfig = JOIN_POLICY_CONFIG[group.join_policy] || JOIN_POLICY_CONFIG.invite_only;
                                return (
                                    <div
                                        key={group.group_id}
                                        className={`bg-slate-800/50 border ${policyConfig.border} rounded-xl p-4 flex items-center justify-between`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 ${policyConfig.bg} rounded-lg`}>
                                                <UserGroupIcon className={`w-5 h-5 ${policyConfig.color}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-white font-medium">{group.name}</h3>
                                                    {renderJoinPolicyBadge(group.join_policy)}
                                                </div>
                                                <p className="text-slate-500 text-sm mt-0.5">
                                                    {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                                                    {group.description && (
                                                        <>
                                                            <span className="mx-2">·</span>
                                                            <span className="text-slate-400">{group.description}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {group.join_policy === "open" && (
                                                <button
                                                    onClick={() => handleJoinGroup(group.group_id)}
                                                    disabled={actionLoading === `join-${group.group_id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === `join-${group.group_id}` ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <ArrowRightIcon className="w-4 h-4" />
                                                            Join
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {group.join_policy === "application" && !group.has_pending_application && (
                                                <button
                                                    onClick={() => openApplyModal(group)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors"
                                                >
                                                    <ClipboardDocumentListIcon className="w-4 h-4" />
                                                    Apply
                                                </button>
                                            )}
                                            {group.join_policy === "application" && group.has_pending_application && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-400 text-sm font-medium rounded-lg">
                                                    Pending
                                                </span>
                                            )}
                                            {group.join_policy === "invite_only" && (
                                                <span className="text-slate-500 text-sm">Invite required</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-teal-500/10 rounded-lg">
                                <UserGroupIcon className="w-5 h-5 text-teal-400" />
                            </div>
                            <h2 className="text-lg font-medium text-white">Create New Group</h2>
                        </div>

                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    Group Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="e.g., Alpine Expedition Team"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                                <textarea
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    placeholder="What is this group about?"
                                    rows={2}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Join Policy</label>
                                <div className="space-y-2">
                                    {Object.entries(JOIN_POLICY_CONFIG).map(([key, config]) => {
                                        const Icon = config.icon;
                                        return (
                                            <label
                                                key={key}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    newGroupJoinPolicy === key
                                                        ? `${config.bg} ${config.border}`
                                                        : "bg-slate-900/30 border-slate-700/50 hover:border-slate-600"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="join_policy"
                                                    value={key}
                                                    checked={newGroupJoinPolicy === key}
                                                    onChange={(e) => setNewGroupJoinPolicy(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                                <div className="flex-1">
                                                    <div className={`text-sm font-medium ${config.color}`}>{config.label}</div>
                                                    <div className="text-xs text-slate-500">{config.description}</div>
                                                </div>
                                                {newGroupJoinPolicy === key && (
                                                    <CheckIcon className={`w-5 h-5 ${config.color}`} />
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-slate-700 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newGroupName.trim()}
                                    className={`flex-1 font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                        creating || !newGroupName.trim()
                                            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                                            : "bg-teal-500 text-white hover:bg-teal-400"
                                    }`}
                                >
                                    {creating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <PlusIcon className="w-4 h-4" />
                                            Create Group
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowApplyModal(false)} />
                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <button
                            onClick={() => setShowApplyModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <ClipboardDocumentListIcon className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-medium text-white">Apply to Join</h2>
                                <p className="text-slate-400 text-sm">{applyGroupName}</p>
                            </div>
                        </div>

                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    Message (optional)
                                </label>
                                <textarea
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    placeholder="Tell the admins why you'd like to join..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">{applyMessage.length}/500</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyModal(false)}
                                    className="flex-1 bg-slate-700 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applying}
                                    className="flex-1 bg-amber-500 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {applying ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Application"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
