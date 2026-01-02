import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    UserGroupIcon,
    UserPlusIcon,
    UsersIcon,
    MapPinIcon,
    PencilIcon,
    TrashIcon,
    ArrowLeftIcon,
    XMarkIcon,
    CheckIcon,
    ShieldCheckIcon,
    StarIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    GlobeAltIcon,
    LockClosedIcon,
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const JOIN_POLICY_CONFIG = {
    open: { label: "Open", icon: GlobeAltIcon, color: "text-green-400", bg: "bg-green-500/10" },
    application: { label: "Apply to Join", icon: ClipboardDocumentListIcon, color: "text-amber-400", bg: "bg-amber-500/10" },
    invite_only: { label: "Invite Only", icon: LockClosedIcon, color: "text-slate-400", bg: "bg-slate-700" },
};
import { getApiUrl, getOAuthUrl } from "../config";

const ROLE_LABELS = {
    owner: { label: "Owner", color: "text-amber-400", bg: "bg-amber-500/10" },
    admin: { label: "Admin", color: "text-teal-400", bg: "bg-teal-500/10" },
    member: { label: "Member", color: "text-slate-400", bg: "bg-slate-700" },
};

export default function GroupDetail() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUsername, setCurrentUsername] = useState(null);
    const [caveNames, setCaveNames] = useState({}); // Map of cave_id -> cave_name

    // Edit group modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editJoinPolicy, setEditJoinPolicy] = useState("invite_only");
    const [saving, setSaving] = useState(false);

    // Applications list
    const [applications, setApplications] = useState([]);

    // Invite modal
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [inviting, setInviting] = useState(false);

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deleting, setDeleting] = useState(false);

    // Invitations list
    const [invitations, setInvitations] = useState([]);

    const isAdmin = currentUserRole === "admin" || currentUserRole === "owner";
    const isOwner = currentUserRole === "owner";

    // Function to fetch cave names for the group's caves
    const fetchCaveNames = async (caves) => {
        if (!caves || caves.length === 0) return;

        const caveIds = caves.map(cave => cave.cave_id);
        const namesMap = {};

        // Fetch each cave individually (could be optimized with a batch endpoint later)
        const fetchPromises = caveIds.map(async (caveId) => {
            try {
                const response = await fetch(getApiUrl(`/caves/${caveId}`));
                if (response.ok) {
                    const caveData = await response.json();
                    namesMap[caveId] = caveData.name;
                }
            } catch (error) {
                console.error(`Failed to fetch cave ${caveId}:`, error);
                namesMap[caveId] = `Cave #${caveId}`; // Fallback
            }
        });

        await Promise.all(fetchPromises);
        setCaveNames(namesMap);
    };

    const fetchGroup = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch user info first to get username
            const userRes = await fetch(getApiUrl("/users/me"), { credentials: "include" });
            if (userRes.ok) {
                const userData = await userRes.json();
                setCurrentUsername(userData.username);
            }

            const response = await fetch(getApiUrl(`/groups/${groupId}`), {
                credentials: "include",
            });

            if (response.status === 401) {
                window.location.href = getOAuthUrl("/sign_in") + "?rd=" + encodeURIComponent(window.location.href);
                return;
            }

            if (response.status === 403) {
                setError("You don't have access to this group");
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch group");
            }

            const data = await response.json();
            setGroup(data);
            setEditName(data.name);
            setEditDescription(data.description || "");
            setEditJoinPolicy(data.join_policy || "invite_only");

            // Fetch cave names for the group's caves
            if (data.caves && data.caves.length > 0) {
                fetchCaveNames(data.caves);
            }

            // Find current user's role
            const userRes2 = await fetch(getApiUrl("/users/me"), { credentials: "include" });
            if (userRes2.ok) {
                const userData = await userRes2.json();
                const membership = data.members.find((m) => m.username === userData.username);
                setCurrentUserRole(membership?.role || null);
            }

            // Fetch invitations and applications if admin
            if (data.members.some((m) => m.role === "admin" || m.role === "owner")) {
                const [invRes, appRes] = await Promise.all([
                    fetch(getApiUrl(`/groups/${groupId}/invitations`), { credentials: "include" }),
                    fetch(getApiUrl(`/groups/${groupId}/applications`), { credentials: "include" }),
                ]);
                if (invRes.ok) {
                    const invData = await invRes.json();
                    setInvitations(invData.filter((inv) => inv.status === "pending"));
                }
                if (appRes.ok) {
                    const appData = await appRes.json();
                    setApplications(appData.filter((app) => app.status === "pending"));
                }
            }
        } catch (err) {
            console.error("Error fetching group:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]);

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        if (!editName.trim()) return;

        setSaving(true);
        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}`), {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    description: editDescription.trim() || null,
                    join_policy: editJoinPolicy,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to update group");
            }

            const updated = await response.json();
            setGroup(updated);
            setShowEditModal(false);
        } catch (err) {
            console.error("Error updating group:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setInviting(true);
        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}/invitations`), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invitee_email: inviteEmail.trim(),
                    role: inviteRole,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to send invitation");
            }

            const newInvitation = await response.json();
            setInvitations((prev) => [newInvitation, ...prev]);
            setShowInviteModal(false);
            setInviteEmail("");
            setInviteRole("member");
        } catch (err) {
            console.error("Error sending invitation:", err);
            setError(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleCancelInvitation = async (invitationId) => {
        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}/invitations/${invitationId}`), {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to cancel invitation");
            }

            setInvitations((prev) => prev.filter((inv) => inv.invitation_id !== invitationId));
        } catch (err) {
            console.error("Error canceling invitation:", err);
            setError(err.message);
        }
    };

    const handleReviewApplication = async (applicationId, approve) => {
        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}/applications/${applicationId}/review`), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approve }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to review application");
            }

            setApplications((prev) => prev.filter((app) => app.application_id !== applicationId));
            if (approve) fetchGroup();
        } catch (err) {
            console.error("Error reviewing application:", err);
            setError(err.message);
        }
    };

    const handleRemoveMember = async (memberId, memberUsername) => {
        if (!confirm(`Remove ${memberUsername} from the group?`)) return;

        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}/members/${memberId}`), {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to remove member");
            }

            fetchGroup();
        } catch (err) {
            console.error("Error removing member:", err);
            setError(err.message);
        }
    };

    const handleUpdateRole = async (memberId, newRole, memberUsername) => {
        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}/members/${memberId}`), {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to update role");
            }

            // Update member role in state locally instead of refetching
            setGroup((prevGroup) => ({
                ...prevGroup,
                members: prevGroup.members.map((member) =>
                    member.member_id === memberId ? { ...member, role: newRole } : member
                ),
            }));
        } catch (err) {
            console.error("Error updating role:", err);
            setError(err.message);
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm("Are you sure you want to leave this group?")) return;

        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}/leave`), {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to leave group");
            }

            navigate("/groups");
        } catch (err) {
            console.error("Error leaving group:", err);
            setError(err.message);
        }
    };

    const handleDeleteGroup = async () => {
        if (deleteConfirmation !== "DELETE") return;

        setDeleting(true);
        try {
            const response = await fetch(getApiUrl(`/groups/${groupId}`), {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to delete group");
            }

            navigate("/groups");
        } catch (err) {
            console.error("Error deleting group:", err);
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 pt-16">
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                            <div className="w-10 h-10 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto" />
                            <p className="mt-4 text-slate-500 text-sm">Loading group...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !group) {
        return (
            <div className="min-h-screen bg-slate-900 pt-16 flex items-center justify-center px-6">
                <div className="max-w-md text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-5">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/groups")}
                        className="bg-teal-500 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-teal-400 transition-colors"
                    >
                        Back to Groups
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 pt-16">
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Back button */}
                <button
                    onClick={() => navigate("/groups")}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Groups
                </button>

                {/* Error banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 text-sm">{error}</span>
                            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-teal-500/10 rounded-xl">
                                <UserGroupIcon className="w-8 h-8 text-teal-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-white">{group?.name}</h1>
                                {group?.description && (
                                    <p className="text-slate-400 mt-1">{group.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                                    <span className="text-slate-500">
                                        {group?.members?.length || 0} member
                                        {group?.members?.length !== 1 ? "s" : ""}
                                    </span>
                                    <span className="text-slate-500">
                                        {group?.caves?.length || 0} cave
                                        {group?.caves?.length !== 1 ? "s" : ""}
                                    </span>
                                    {group?.join_policy && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${JOIN_POLICY_CONFIG[group.join_policy]?.bg} ${JOIN_POLICY_CONFIG[group.join_policy]?.color}`}>
                                            {React.createElement(JOIN_POLICY_CONFIG[group.join_policy]?.icon, { className: "w-3 h-3" })}
                                            {JOIN_POLICY_CONFIG[group.join_policy]?.label}
                                        </span>
                                    )}
                                    {currentUserRole && (
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_LABELS[currentUserRole]?.bg} ${ROLE_LABELS[currentUserRole]?.color}`}
                                        >
                                            {ROLE_LABELS[currentUserRole]?.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 hover:text-white transition-colors"
                                title="Edit group"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Members Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="w-5 h-5 text-teal-400" />
                                    <h2 className="text-lg font-medium text-white">Members</h2>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowInviteModal(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-400 transition-colors"
                                    >
                                        <UserPlusIcon className="w-4 h-4" />
                                        Invite
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                {group?.members?.map((member) => (
                                    <div
                                        key={member.member_id}
                                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center">
                                                {member.role === "owner" ? (
                                                    <StarIcon className="w-4 h-4 text-amber-400" />
                                                ) : member.role === "admin" ? (
                                                    <ShieldCheckIcon className="w-4 h-4 text-teal-400" />
                                                ) : (
                                                    <span className="text-slate-400 text-sm font-medium">
                                                        {member.username[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">
                                                    {member.username}
                                                    {member.username === currentUsername && (
                                                        <span className="text-slate-500 ml-1">(you)</span>
                                                    )}
                                                </p>
                                                <span
                                                    className={`text-xs ${ROLE_LABELS[member.role]?.color}`}
                                                >
                                                    {ROLE_LABELS[member.role]?.label}
                                                </span>
                                            </div>
                                        </div>

                                        {isAdmin && member.role !== "owner" && member.username !== currentUsername && (
                                            <div className="flex items-center gap-2">
                                                {/* Only owners can edit admins; admins can edit members */}
                                                {(isOwner || member.role !== "admin") && (
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleUpdateRole(member.member_id, e.target.value, member.username)}
                                                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                                                    >
                                                        <option value="member">Member</option>
                                                        {isOwner && <option value="admin">Admin</option>}
                                                        {isOwner && <option value="owner">Owner</option>}
                                                    </select>
                                                )}
                                                {(isOwner || member.role !== "admin") && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.member_id, member.username)}
                                                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                                        title="Remove member"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pending Invitations */}
                            {isAdmin && invitations.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <h3 className="text-sm font-medium text-slate-400 mb-3">
                                        Pending Invitations ({invitations.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {invitations.map((inv) => (
                                            <div
                                                key={inv.invitation_id}
                                                className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg"
                                            >
                                                <div>
                                                    <p className="text-white text-sm">{inv.invitee_username}</p>
                                                    <p className="text-slate-500 text-xs">
                                                        Invited as {inv.role} by {inv.inviter_username}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleCancelInvitation(inv.invitation_id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Cancel invitation"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pending Applications */}
                            {isAdmin && applications.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <h3 className="text-sm font-medium text-slate-400 mb-3">
                                        Pending Applications ({applications.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {applications.map((app) => (
                                            <div
                                                key={app.application_id}
                                                className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm">{app.applicant_username}</p>
                                                    {app.message && (
                                                        <p className="text-slate-400 text-xs mt-0.5 truncate">"{app.message}"</p>
                                                    )}
                                                    <p className="text-slate-500 text-xs mt-0.5">
                                                        Applied {new Date(app.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 ml-3">
                                                    <button
                                                        onClick={() => handleReviewApplication(app.application_id, false)}
                                                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReviewApplication(app.application_id, true)}
                                                        className="p-1.5 text-slate-500 hover:text-green-400 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Caves Section */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPinIcon className="w-5 h-5 text-teal-400" />
                                <h2 className="text-lg font-medium text-white">Assigned Caves</h2>
                            </div>

                            {group?.caves?.length === 0 ? (
                                <div className="text-center py-8">
                                    <MapPinIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">No caves assigned yet</p>
                                    <p className="text-slate-600 text-xs mt-1">
                                        Caves can be assigned from the cave detail page
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {group?.caves?.map((cave) => (
                                        <button
                                            key={cave.id}
                                            onClick={() => navigate(`/cave/${cave.cave_id}`)}
                                            className="w-full flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-700 rounded-lg">
                                                    <MapPinIcon className="w-4 h-4 text-teal-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-medium">
                                                        {caveNames[cave.cave_id] || `Cave #${cave.cave_id}`}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">
                                                        Added by {cave.assigned_by}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-slate-400 mb-4">Actions</h3>
                            <div className="space-y-2">
                                {!isOwner && (
                                    <button
                                        onClick={handleLeaveGroup}
                                        className="w-full flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
                                    >
                                        <ArrowLeftIcon className="w-5 h-5 text-slate-400" />
                                        <span className="text-sm text-white">Leave Group</span>
                                    </button>
                                )}
                                {isOwner && (
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-left"
                                    >
                                        <TrashIcon className="w-5 h-5 text-red-400" />
                                        <span className="text-sm text-red-400">Delete Group</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Group Info */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-slate-400 mb-4">Group Info</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-slate-500">Created</span>
                                    <p className="text-white">
                                        {group?.created_at
                                            ? new Date(group.created_at).toLocaleDateString()
                                            : "—"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Status</span>
                                    <p className="text-green-400">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Group Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <h2 className="text-lg font-medium text-white mb-6">Edit Group</h2>

                        <form onSubmit={handleUpdateGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={2}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
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
                                                    editJoinPolicy === key
                                                        ? `${config.bg} border-current ${config.color}`
                                                        : "bg-slate-900/30 border-slate-700/50 hover:border-slate-600"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="edit_join_policy"
                                                    value={key}
                                                    checked={editJoinPolicy === key}
                                                    onChange={(e) => setEditJoinPolicy(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                                <span className={`text-sm font-medium ${editJoinPolicy === key ? config.color : 'text-slate-300'}`}>
                                                    {config.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-700 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-slate-600">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 bg-teal-500 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-teal-400 disabled:opacity-50">
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-teal-500/10 rounded-lg">
                                <UserPlusIcon className="w-5 h-5 text-teal-400" />
                            </div>
                            <h2 className="text-lg font-medium text-white">Invite Member</h2>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 bg-slate-700 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-slate-600">
                                    Cancel
                                </button>
                                <button type="submit" disabled={inviting} className="flex-1 bg-teal-500 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-teal-400 disabled:opacity-50">
                                    {inviting ? "Sending..." : "Send Invitation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <TrashIcon className="w-5 h-5 text-red-400" />
                            </div>
                            <h2 className="text-lg font-medium text-white">Delete Group</h2>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-slate-300">
                                This will permanently delete <strong className="text-white">{group?.name}</strong> and remove all members. This action cannot be undone.
                            </p>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs text-slate-400 mb-2">Type "DELETE" to confirm:</p>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-slate-700 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-slate-600">
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteGroup}
                                disabled={deleteConfirmation !== "DELETE" || deleting}
                                className={`flex-1 font-medium px-4 py-2.5 rounded-lg ${
                                    deleteConfirmation === "DELETE" && !deleting
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : "bg-slate-600 text-slate-400 cursor-not-allowed"
                                }`}
                            >
                                {deleting ? "Deleting..." : "Delete Group"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

