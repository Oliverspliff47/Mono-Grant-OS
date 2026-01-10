from sqlalchemy import Column, String, Date, DateTime, Boolean, Enum, ForeignKey, Text, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.core.database import Base

# Enums
class ProjectStatus(str, enum.Enum):
    PLANNING = "Planning"
    IN_PROGRESS = "In Progress"
    REVIEW = "Review"
    COMPLETED = "Completed"

class SectionStatus(str, enum.Enum):
    DRAFT = "Draft"
    REVIEW = "Review"
    LOCKED = "Locked"

class AssetType(str, enum.Enum):
    PHOTO = "Photo"
    POSTER = "Poster"
    MENU = "Menu"
    AUDIO = "Audio"
    VERIFICATION_DOC = "VerificationDoc"

class RightsStatus(str, enum.Enum):
    UNKNOWN = "Unknown"
    REQUESTED = "Requested"
    CLEARED = "Cleared"
    RESTRICTED = "Restricted"

class UsageScope(str, enum.Enum):
    PRINT = "Print"
    DIGITAL = "Digital"
    BOTH = "Both"

class FundingStatus(str, enum.Enum):
    TO_REVIEW = "To Review"
    PURSUING = "Pursuing"
    SUBMITTED = "Submitted"
    REJECTED = "Rejected"
    AWARDED = "Awarded"

class SubmissionStatus(str, enum.Enum):
    DRAFT = "Draft"
    APPROVED = "Approved"
    SUBMITTED = "Submitted"

# Models
class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING)
    start_date = Column(Date, nullable=True)
    print_deadline = Column(Date, nullable=True)
    launch_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sections = relationship("Section", back_populates="project", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="project", cascade="all, delete-orphan")

class Section(Base):
    __tablename__ = "sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    version = Column(Integer, default=1)
    status = Column(Enum(SectionStatus), default=SectionStatus.DRAFT)
    content_text = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    project = relationship("Project", back_populates="sections")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    type = Column(Enum(AssetType), nullable=False)
    file_path = Column(String, nullable=False)
    rights_status = Column(Enum(RightsStatus), default=RightsStatus.UNKNOWN)
    credit_line = Column(String, nullable=True)
    usage_scope = Column(Enum(UsageScope), default=UsageScope.PRINT)
    is_selected_for_book = Column(Boolean, default=False)

    project = relationship("Project", back_populates="assets")

class FundingOpportunity(Base):
    __tablename__ = "funding_opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    funder_name = Column(String, nullable=False)
    programme_name = Column(String, nullable=False)
    deadline = Column(Date, nullable=True)
    status = Column(Enum(FundingStatus), default=FundingStatus.TO_REVIEW)
    eligibility_criteria = Column(JSON, nullable=True)
    budget_rules = Column(JSON, nullable=True)

    applications = relationship("ApplicationPackage", back_populates="opportunity", cascade="all, delete-orphan")

class ApplicationPackage(Base):
    __tablename__ = "application_packages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("funding_opportunities.id"), nullable=False)
    narrative_draft = Column(Text, nullable=True)
    budget_json = Column(JSON, nullable=True)
    submission_status = Column(Enum(SubmissionStatus), default=SubmissionStatus.DRAFT)
    final_approval = Column(Boolean, default=False)

    opportunity = relationship("FundingOpportunity", back_populates="applications")
