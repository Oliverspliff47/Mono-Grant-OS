from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import FundingOpportunity, ApplicationPackage, FundingStatus, SubmissionStatus
import uuid
from datetime import date, timedelta
import httpx
import json
import re

class FundingAgent:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def research_opportunities(self, query: str = "film documentary arts grants funding", region: str = "South Africa") -> list[dict]:
        """
        Deep research to find funding opportunities via web search.
        Returns a list of discovered opportunities.
        """
        search_query = f"{query} {region} grants funding opportunities 2026"
        
        # Use a free search API (DuckDuckGo instant answers)
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # DuckDuckGo instant answer API
                response = await client.get(
                    "https://api.duckduckgo.com/",
                    params={
                        "q": search_query,
                        "format": "json",
                        "no_html": "1",
                        "skip_disambig": "1"
                    }
                )
                data = response.json()
                
                results = []
                
                # Parse related topics for potential opportunities
                related = data.get("RelatedTopics", [])
                for topic in related[:10]:  # Limit to 10 results
                    if isinstance(topic, dict) and "Text" in topic:
                        text = topic.get("Text", "")
                        url = topic.get("FirstURL", "")
                        
                        # Extract a funder name and programme from the text
                        if text:
                            # Simple heuristic: first part before dash or colon is funder
                            parts = re.split(r'[-–:]', text, maxsplit=1)
                            funder = parts[0].strip()[:100] if parts else "Unknown Funder"
                            programme = parts[1].strip()[:200] if len(parts) > 1 else text[:200]
                            
                            results.append({
                                "funder_name": funder,
                                "programme_name": programme,
                                "source_url": url,
                                "raw_text": text
                            })
                
                # Also check abstract for opportunities
                abstract = data.get("Abstract", "")
                if abstract and len(results) < 5:
                    results.append({
                        "funder_name": data.get("Heading", "Research Result"),
                        "programme_name": abstract[:300],
                        "source_url": data.get("AbstractURL", ""),
                        "raw_text": abstract
                    })
                
                return results
                
        except Exception as e:
            print(f"Research error: {e}")
            return []

    async def research_and_create_opportunities(self, query: str = "film documentary arts grants", region: str = "South Africa") -> list[FundingOpportunity]:
        """
        Research opportunities and automatically create them in the database.
        """
        research_results = await self.research_opportunities(query, region)
        created = []
        
        # Default deadline is 3 months from now
        default_deadline = date.today() + timedelta(days=90)
        
        for result in research_results:
            # Check if similar opportunity already exists
            existing = await self.db.execute(
                select(FundingOpportunity).where(
                    FundingOpportunity.funder_name == result["funder_name"][:100]
                )
            )
            if existing.scalars().first():
                continue  # Skip duplicates
            
            opportunity = FundingOpportunity(
                funder_name=result["funder_name"][:100],
                programme_name=result["programme_name"][:200],
                deadline=default_deadline,
                status=FundingStatus.TO_REVIEW,
                eligibility_criteria={"source": result.get("source_url", "")},
                budget_rules={"notes": "Sourced via research - verify details"}
            )
            self.db.add(opportunity)
            created.append(opportunity)
        
        if created:
            await self.db.commit()
            for opp in created:
                await self.db.refresh(opp)
        
        return created

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

