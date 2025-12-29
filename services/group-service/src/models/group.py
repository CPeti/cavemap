from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from src.models.base import Base
from datetime import datetime, timezone
import enum


class MemberRole(str, enum.Enum):
    """Roles for group members."""
    OWNER = "owner"       # Full control, can delete group
    ADMIN = "admin"       # Can manage members and caves
    MEMBER = "member"     # Can view and contribute


class JoinPolicy(str, enum.Enum):
    """How users can join the group."""
    OPEN = "open"           # Anyone can join directly
    APPLICATION = "application"  # Users apply, admins approve
    INVITE_ONLY = "invite_only"  # Only by invitation


class InvitationStatus(str, enum.Enum):
    """Status of group invitations."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class ApplicationStatus(str, enum.Enum):
    """Status of join applications."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Group(Base):
    """Expedition group that manages caves and members."""
    __tablename__ = "groups"

    group_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    join_policy = Column(SQLEnum(JoinPolicy), default=JoinPolicy.INVITE_ONLY, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

    # Relationships
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    invitations = relationship("GroupInvitation", back_populates="group", cascade="all, delete-orphan")
    applications = relationship("GroupApplication", back_populates="group", cascade="all, delete-orphan")
    caves = relationship("GroupCave", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    """Membership linking users to groups with roles."""
    __tablename__ = "group_members"

    member_id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.group_id", ondelete="CASCADE"), nullable=False)
    user_email = Column(String(255), nullable=False, index=True)
    role = Column(SQLEnum(MemberRole), default=MemberRole.MEMBER, nullable=False)
    joined_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    group = relationship("Group", back_populates="members")


class GroupInvitation(Base):
    """Invitations to join a group."""
    __tablename__ = "group_invitations"

    invitation_id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.group_id", ondelete="CASCADE"), nullable=False)
    inviter_email = Column(String(255), nullable=False)
    invitee_email = Column(String(255), nullable=False, index=True)
    role = Column(SQLEnum(MemberRole), default=MemberRole.MEMBER, nullable=False)
    status = Column(SQLEnum(InvitationStatus), default=InvitationStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    group = relationship("Group", back_populates="invitations")


class GroupApplication(Base):
    """Applications to join a group (for application-based groups)."""
    __tablename__ = "group_applications"

    application_id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.group_id", ondelete="CASCADE"), nullable=False)
    applicant_email = Column(String(255), nullable=False, index=True)
    message = Column(Text, nullable=True)  # Optional message from applicant
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String(255), nullable=True)  # Admin who reviewed

    # Relationships
    group = relationship("Group", back_populates="applications")


class GroupCave(Base):
    """Links caves to groups for management."""
    __tablename__ = "group_caves"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.group_id", ondelete="CASCADE"), nullable=False)
    cave_id = Column(Integer, nullable=False, index=True)  # References cave in cave-service
    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assigned_by = Column(String(255), nullable=False)  # User email who assigned

    # Relationships
    group = relationship("Group", back_populates="caves")

