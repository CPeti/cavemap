from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum


class MemberRole(str, Enum):
    """Roles for group members."""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class JoinPolicy(str, Enum):
    """How users can join the group."""
    OPEN = "open"           # Anyone can join directly
    APPLICATION = "application"  # Users apply, admins approve
    INVITE_ONLY = "invite_only"  # Only by invitation


class InvitationStatus(str, Enum):
    """Status of group invitations."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class ApplicationStatus(str, Enum):
    """Status of join applications."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ============ Group Schemas ============

class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    join_policy: JoinPolicy = JoinPolicy.INVITE_ONLY


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    join_policy: Optional[JoinPolicy] = None


class GroupMemberRead(BaseModel):
    member_id: int
    username: str  # Username to display instead of email
    role: MemberRole
    joined_at: datetime
    is_current_user: bool = False

    class Config:
        from_attributes = True


class GroupCaveRead(BaseModel):
    id: int
    cave_id: int
    assigned_at: datetime
    assigned_by: str

    class Config:
        from_attributes = True


class GroupRead(BaseModel):
    group_id: int
    name: str
    description: Optional[str] = None
    join_policy: JoinPolicy
    created_at: datetime
    updated_at: datetime
    is_active: bool
    members: List[GroupMemberRead] = []
    caves: List[GroupCaveRead] = []

    class Config:
        from_attributes = True


class GroupSummary(BaseModel):
    """Lightweight group response without members/caves."""
    group_id: int
    name: str
    description: Optional[str] = None
    join_policy: JoinPolicy
    created_at: datetime
    is_active: bool
    member_count: Optional[int] = None

    class Config:
        from_attributes = True


class GroupPublic(BaseModel):
    """Public group info for non-members."""
    group_id: int
    name: str
    description: Optional[str] = None
    join_policy: JoinPolicy
    created_at: datetime
    member_count: int = 0
    is_member: bool = False  # Whether current user is a member
    has_pending_application: bool = False  # Whether user has pending application

    class Config:
        from_attributes = True


# ============ Member Schemas ============

class MemberAdd(BaseModel):
    user_email: EmailStr
    role: MemberRole = MemberRole.MEMBER


class MemberRoleUpdate(BaseModel):
    role: MemberRole


# ============ Invitation Schemas ============

class InvitationCreate(BaseModel):
    invitee_email: EmailStr
    role: MemberRole = MemberRole.MEMBER
    expires_in_days: Optional[int] = Field(7, ge=1, le=30)


class InvitationRead(BaseModel):
    invitation_id: int
    group_id: int
    inviter_email: str
    inviter_username: Optional[str] = None  # Username to display instead of email
    invitee_email: str
    invitee_username: Optional[str] = None  # Username to display instead of email
    role: MemberRole
    status: InvitationStatus
    created_at: datetime
    expires_at: Optional[datetime]
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True


class InvitationWithGroup(InvitationRead):
    """Invitation with group details for the invitee view."""
    group_name: str
    group_description: Optional[str]


class InvitationResponse(BaseModel):
    accept: bool


# ============ Cave Assignment Schemas ============

class CaveAssign(BaseModel):
    cave_id: int


class CaveAssignmentRead(BaseModel):
    id: int
    group_id: int
    cave_id: int
    cave_name: Optional[str] = None
    assigned_at: datetime
    assigned_by: str

    class Config:
        from_attributes = True


class CaveGroupInfo(BaseModel):
    """Information about a group that a cave is assigned to."""
    group_id: int
    group_name: str
    group_description: Optional[str] = None
    assigned_at: datetime
    assigned_by: str

    class Config:
        from_attributes = True


# ============ Application Schemas ============

class ApplicationCreate(BaseModel):
    message: Optional[str] = Field(None, max_length=500)


class ApplicationRead(BaseModel):
    application_id: int
    group_id: int
    applicant_email: str
    applicant_username: Optional[str] = None  # Username to display instead of email
    message: Optional[str]
    status: ApplicationStatus
    created_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]

    class Config:
        from_attributes = True


class ApplicationWithGroup(ApplicationRead):
    """Application with group details for the applicant view."""
    group_name: str
    group_description: Optional[str]


class ApplicationReview(BaseModel):
    approve: bool

