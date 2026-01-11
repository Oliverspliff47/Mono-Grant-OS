from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
from datetime import date, datetime
from uuid import UUID
from enum import Enum

# Using Pydantic V2 ConfigDict

class ProjectStatusEnum(str, Enum):
    PLANNING = "Planning"
    IN_PROGRESS = "In Progress"
    REVIEW = "Review"
    COMPLETED = "Completed"

class ProjectCreate(BaseModel):
    title: str
    start_date: Optional[date] = None
    print_deadline: Optional[date] = None

class ProjectResponse(BaseModel):
    id: UUID
    title: str
    status: ProjectStatusEnum
    start_date: Optional[date]
    print_deadline: Optional[date]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SectionStatusEnum(str, Enum):
    DRAFT = "Draft"
    REVIEW = "Review"
    LOCKED = "Locked"

class SectionCreate(BaseModel):
    title: str
    order_index: int = 0

class SectionUpdate(BaseModel):
    content_text: str

class SectionResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    version: int
    status: SectionStatusEnum
    content_text: Optional[str]
    order_index: int

    model_config = ConfigDict(from_attributes=True)

class AssetTypeEnum(str, Enum):
    PHOTO = "Photo"
    POSTER = "Poster"
    MENU = "Menu"
    AUDIO = "Audio"
    VERIFICATION_DOC = "VerificationDoc"

class RightsStatusEnum(str, Enum):
    UNKNOWN = "Unknown"
    REQUESTED = "Requested"
    CLEARED = "Cleared"
    RESTRICTED = "Restricted"

class ScanRequest(BaseModel):
    directory_path: str

class AssetUpdate(BaseModel):
    rights_status: RightsStatusEnum
    credit_line: Optional[str]

class AssetResponse(BaseModel):
    id: UUID
    project_id: UUID
    type: AssetTypeEnum
    file_path: str
    rights_status: RightsStatusEnum
    credit_line: Optional[str]
    usage_scope: str 

    model_config = ConfigDict(from_attributes=True)

class FundingStatusEnum(str, Enum):
    TO_REVIEW = "To Review"
    PURSUING = "Pursuing"
    SUBMITTED = "Submitted"
    REJECTED = "Rejected"
    AWARDED = "Awarded"

class SubmissionStatusEnum(str, Enum):
    DRAFT = "Draft"
    APPROVED = "Approved"
    SUBMITTED = "Submitted"

class OpportunityCreate(BaseModel):
    funder_name: str
    programme_name: str
    deadline: date

class OpportunityResponse(BaseModel):
    id: UUID
    funder_name: str
    programme_name: str
    deadline: date
    status: FundingStatusEnum
    eligibility_criteria: Optional[dict]
    budget_rules: Optional[dict]

    model_config = ConfigDict(from_attributes=True)

class ApplicationResponse(BaseModel):
    id: UUID
    opportunity_id: UUID
    narrative_draft: Optional[str]
    budget_json: Optional[dict]
    submission_status: SubmissionStatusEnum
    final_approval: bool

    model_config = ConfigDict(from_attributes=True)

class ApplicationUpdate(BaseModel):
    narrative_draft: Optional[str] = None
    budget_json: Optional[dict] = None
    submission_status: Optional[SubmissionStatusEnum] = None

class DashboardCounts(BaseModel):
    projects: int
    opportunities: int
    assets: int

class DashboardResponse(BaseModel):
    counts: DashboardCounts
    recent_projects: List[ProjectResponse]
    upcoming_deadlines: List[OpportunityResponse]
    recent_assets: List[AssetResponse]

    model_config = ConfigDict(from_attributes=True)
class FundingImportRequest(BaseModel):
    text: str

class FundingResearchRequest(BaseModel):
    query: str
    region: str
