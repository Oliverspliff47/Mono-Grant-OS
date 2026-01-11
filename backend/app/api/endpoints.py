from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.agents.funding import FundingAgent
from app.schemas import OpportunityCreate, OpportunityResponse, ApplicationResponse, ApplicationUpdate, DashboardResponse, FundingImportRequest, FundingResearchRequest
from app import models, schemas
from app import models
from sqlalchemy import func
from datetime import datetime
from typing import List
from uuid import UUID

router = APIRouter()

@router.delete("/projects/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_projects(db: AsyncSession = Depends(get_db)):
    """Delete all funding data (Dev utility)"""
    await db.execute(models.ApplicationPackage.__table__.delete())
    await db.execute(models.FundingOpportunity.__table__.delete())
    await db.commit()
    return None

# --- Funding Endpoints ---

@router.post("/opportunities", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(opp_in: OpportunityCreate, db: AsyncSession = Depends(get_db)):
    agent = FundingAgent(db)
    return await agent.create_opportunity(opp_in.funder_name, opp_in.programme_name, opp_in.deadline)

@router.get("/opportunities", response_model=List[OpportunityResponse])
async def list_opportunities(db: AsyncSession = Depends(get_db)):
    agent = FundingAgent(db)
    return await agent.get_opportunities()

@router.post("/opportunities/research", response_model=List[OpportunityResponse])
async def research_opportunities(query: str = "film documentary arts grants", region: str = "South Africa", db: AsyncSession = Depends(get_db)):
    """
    Deep research to discover funding opportunities from web sources.
    Creates new opportunities in the database and returns them.
    """
    agent = FundingAgent(db)
    created = await agent.research_and_create_opportunities(query, region)
    return created

@router.post("/opportunities/import", response_model=List[OpportunityResponse])
async def import_opportunities(payload: schemas.FundingImportRequest, db: AsyncSession = Depends(get_db)):
    """
    Import funding opportunities from raw text using Gemini AI parsing.
    """
    agent = FundingAgent(db)
    return await agent.import_opportunities_from_text(payload.text)

from fastapi import UploadFile, File

@router.post("/opportunities/import/file", response_model=List[OpportunityResponse])
async def import_opportunities_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Import funding opportunities from an uploaded file (PDF/Text).
    """
    agent = FundingAgent(db)
    contents = await file.read()
    return await agent.import_file(contents, file.filename)


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
    # Funding
    total_opportunities = (await db.execute(select(func.count()).select_from(models.FundingOpportunity))).scalar()
    upcoming_deadlines = (await db.execute(select(models.FundingOpportunity).where(models.FundingOpportunity.deadline >= datetime.now().date()).order_by(models.FundingOpportunity.deadline).limit(3))).scalars().all()

    return {
        "counts": {
            "opportunities": total_opportunities
        },
        "upcoming_deadlines": upcoming_deadlines
    }
