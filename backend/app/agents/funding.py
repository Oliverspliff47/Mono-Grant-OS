from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import FundingOpportunity, ApplicationPackage, FundingStatus, SubmissionStatus
import uuid
from datetime import date

class FundingAgent:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def create_opportunity(self, funder_name: str, programme_name: str, deadline: date) -> FundingOpportunity:
        """Create a new funding opportunity."""
        opportunity = FundingOpportunity(
            funder_name=funder_name,
            programme_name=programme_name,
            deadline=deadline,
            status=FundingStatus.TO_REVIEW,
            eligibility_criteria={},
            budget_rules={}
        )
        self.db.add(opportunity)
        await self.db.commit()
        await self.db.refresh(opportunity)
        return opportunity

    async def get_opportunities(self) -> list[FundingOpportunity]:
        """List all funding opportunities."""
        result = await self.db.execute(select(FundingOpportunity).order_by(FundingOpportunity.deadline))
        return result.scalars().all()

    async def get_opportunity(self, opportunity_id: uuid.UUID) -> FundingOpportunity:
        result = await self.db.execute(select(FundingOpportunity).where(FundingOpportunity.id == opportunity_id))
        return result.scalars().first()

    async def create_application(self, opportunity_id: uuid.UUID) -> ApplicationPackage:
        """Create a draft application for an opportunity."""
        # Check if exists
        existing = await self.db.execute(select(ApplicationPackage).where(ApplicationPackage.opportunity_id == opportunity_id))
        if existing.scalars().first():
            raise ValueError("Application already exists for this opportunity")

        app_package = ApplicationPackage(
            opportunity_id=opportunity_id,
            narrative_draft="",
            budget_json={},
            submission_status=SubmissionStatus.DRAFT,
            final_approval=False
        )
        self.db.add(app_package)
        await self.db.commit()
        await self.db.refresh(app_package)
        return app_package

    async def get_application_by_opportunity(self, opportunity_id: uuid.UUID) -> ApplicationPackage:
        result = await self.db.execute(select(ApplicationPackage).where(ApplicationPackage.opportunity_id == opportunity_id))
        return result.scalars().first()

    async def get_application(self, app_id: uuid.UUID) -> ApplicationPackage:
        result = await self.db.execute(select(ApplicationPackage).where(ApplicationPackage.id == app_id))
        return result.scalars().first()

    async def update_application(self, app_id: uuid.UUID, narrative: str = None, budget: dict = None, status: SubmissionStatus = None) -> ApplicationPackage:
        result = await self.db.execute(select(ApplicationPackage).where(ApplicationPackage.id == app_id))
        app_package = result.scalars().first()
        if not app_package:
            return None
        
        if narrative is not None:
            app_package.narrative_draft = narrative
        if budget is not None:
            app_package.budget_json = budget
        if status is not None:
            app_package.submission_status = status
            
        await self.db.commit()
        await self.db.refresh(app_package)
        return app_package
