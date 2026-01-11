from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.agents.orchestrator import ProjectOrchestrator
from app.agents.editorial import EditorialAgent
from app.agents.archive import ArchiveAgent
from app.agents.funding import FundingAgent
from app.schemas import ProjectCreate, ProjectResponse, ProjectStatusEnum, SectionCreate, SectionResponse, SectionUpdate, ScanRequest, AssetResponse, AssetUpdate, OpportunityCreate, OpportunityResponse, ApplicationResponse, ApplicationUpdate, DashboardResponse
from app import models
from sqlalchemy import func
from datetime import datetime
from typing import List
from uuid import UUID

router = APIRouter()

@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project_in: ProjectCreate, db: AsyncSession = Depends(get_db)):
    orchestrator = ProjectOrchestrator(db)
    project = await orchestrator.create_project(
        title=project_in.title,
        start_date=project_in.start_date,
        print_deadline=project_in.print_deadline
    )
    return project

@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    orchestrator = ProjectOrchestrator(db)
    return await orchestrator.list_projects()

@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    orchestrator = ProjectOrchestrator(db)
    project = await orchestrator.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/projects/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_projects(db: AsyncSession = Depends(get_db)):
    """Delete all projects and their related data (sections, assets, etc)"""
    # Delete in order to respect foreign keys
    await db.execute(models.Asset.__table__.delete())
    await db.execute(models.Section.__table__.delete())
    await db.execute(models.ApplicationPackage.__table__.delete())
    await db.execute(models.Opportunity.__table__.delete())
    await db.execute(models.Project.__table__.delete())
    await db.commit()
    return None

# --- Section Endpoints ---

@router.post("/projects/{project_id}/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(project_id: UUID, section_in: SectionCreate, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    return await agent.create_section(project_id, section_in.title, section_in.order_index)

@router.get("/projects/{project_id}/sections", response_model=List[SectionResponse])
async def list_sections(project_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    return await agent.get_sections(project_id)

@router.get("/sections/{section_id}", response_model=SectionResponse)
async def get_section(section_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    section = await agent.get_section(section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section

@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section_content(section_id: UUID, section_in: SectionUpdate, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    section = await agent.update_content(section_id, section_in.content_text)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section

@router.post("/sections/{section_id}/submit", response_model=SectionResponse)
async def submit_section(section_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    section = await agent.submit_for_review(section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found or invalid state transition")
    return section

@router.post("/sections/{section_id}/approve", response_model=SectionResponse)
async def approve_section(section_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    section, errors = await agent.approve_section(section_id)
    if not section:
         raise HTTPException(status_code=404, detail="Section not found")
    if errors:
        raise HTTPException(status_code=400, detail={"message": "Consistency checks failed", "errors": errors})
    return section

@router.post("/sections/{section_id}/reject", response_model=SectionResponse)
async def reject_section(section_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    section = await agent.reject_section(section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section

# Legacy lock endpoint - keep for backward compatibility or remove? 
# Keeping it pointing to approve logic via agent.lock_section alias
@router.post("/sections/{section_id}/lock", response_model=SectionResponse)
async def lock_section(section_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    section, errors = await agent.lock_section(section_id)
    if not section:
         raise HTTPException(status_code=404, detail="Section not found")
    if errors:
        raise HTTPException(status_code=400, detail={"message": "Consistency checks failed", "errors": errors})
    return section

@router.post("/sections/{section_id}/review", response_model=str)
async def review_section(section_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = EditorialAgent(db)
    return await agent.review_section(section_id)

# --- Archive Endpoints ---

@router.post("/projects/{project_id}/scan", response_model=List[AssetResponse])
async def scan_directory(project_id: UUID, scan_in: ScanRequest, db: AsyncSession = Depends(get_db)):
    agent = ArchiveAgent(db)
    try:
        return await agent.scan_directory(project_id, scan_in.directory_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/projects/{project_id}/assets", response_model=List[AssetResponse])
async def list_assets(project_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = ArchiveAgent(db)
    return await agent.get_assets(project_id)

@router.put("/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: UUID, asset_in: AssetUpdate, db: AsyncSession = Depends(get_db)):
    agent = ArchiveAgent(db)
    return await agent.update_asset_metadata(asset_id, asset_in.rights_status, asset_in.credit_line)

# --- Funding Endpoints ---

@router.post("/opportunities", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(opp_in: OpportunityCreate, db: AsyncSession = Depends(get_db)):
    agent = FundingAgent(db)
    return await agent.create_opportunity(opp_in.funder_name, opp_in.programme_name, opp_in.deadline)

@router.get("/opportunities", response_model=List[OpportunityResponse])
async def list_opportunities(db: AsyncSession = Depends(get_db)):
    agent = FundingAgent(db)
    return await agent.get_opportunities()

@router.post("/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(opportunity_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = FundingAgent(db)
    try:
        return await agent.create_application(opportunity_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/applications/{application_id}", response_model=ApplicationResponse)
async def get_application(application_id: UUID, db: AsyncSession = Depends(get_db)):
    agent = FundingAgent(db)
    app = await agent.get_application(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@router.put("/applications/{application_id}", response_model=ApplicationResponse)
async def update_application(application_id: UUID, app_in: ApplicationUpdate, db: AsyncSession = Depends(get_db)):
    agent = FundingAgent(db)
    app = await agent.update_application(application_id, app_in.narrative_draft, app_in.budget_json, app_in.submission_status)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

# --- Dashboard ---

@router.get("/dashboard/stats", response_model=DashboardResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Aggregate counts and recent items
    # Projects
    total_projects = (await db.execute(select(func.count()).select_from(models.Project))).scalar()
    active_projects = (await db.execute(select(models.Project).order_by(models.Project.updated_at.desc()).limit(5))).scalars().all()
    
    # Funding
    total_opportunities = (await db.execute(select(func.count()).select_from(models.FundingOpportunity))).scalar()
    upcoming_deadlines = (await db.execute(select(models.FundingOpportunity).where(models.FundingOpportunity.deadline >= datetime.now().date()).order_by(models.FundingOpportunity.deadline).limit(3))).scalars().all()

    # Assets
    total_assets = (await db.execute(select(func.count()).select_from(models.Asset))).scalar()
    recent_assets = (await db.execute(select(models.Asset).order_by(models.Asset.id.desc()).limit(5))).scalars().all()

    return {
        "counts": {
            "projects": total_projects,
            "opportunities": total_opportunities,
            "assets": total_assets
        },
        "recent_projects": active_projects,
        "upcoming_deadlines": upcoming_deadlines,
        "recent_assets": recent_assets
    }
