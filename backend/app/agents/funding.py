from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import FundingOpportunity, ApplicationPackage, FundingStatus, SubmissionStatus
import uuid
from datetime import date, timedelta
import json
import re
import os
import google.generativeai as genai
from duckduckgo_search import DDGS

class FundingAgent:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)

    async def research_opportunities(self, query: str = "film documentary arts grants funding", region: str = "South Africa") -> list[dict]:
        """
        Deep research using Hybrid approach:
        1. Search via DuckDuckGo (Free, Unlimited)
        2. Parse & Extract via Gemini Flash (Free Tier Friendly)
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY not set")
            return []
            
        print(f"Hybrid Research: Searching for '{query}' in '{region}'...")
        
        # Step 1: Free Web Search
        search_results = []
        try:
            with DDGS() as ddgs:
                full_query = f"{query} {region} grants funding opportunities 2026 application"
                # Get more results to ensure content
                ddg_results = list(ddgs.text(full_query, max_results=8))
                
                context_text = ""
                for r in ddg_results:
                    context_text += f"\nSOURCE: {r['title']}\nURL: {r['href']}\nCONTENT: {r['body']}\n"
                    search_results.append(r)
                    
        except Exception as e:
            print(f"DuckDuckGo Search failed: {e}")
            return []

        if not context_text:
            return []

        # Step 2: Intelligent Extraction with Gemini
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            
            prompt = f"""You are an expert funding researcher. I will provide search results for funding opportunities.
            
            Your job is to extract REAL funding opportunities from the text below.
            Ignore generic listicles unless they name specific grants.
            
            SEARCH CONTEXT:
            {context_text}
            
            INSTRUCTIONS:
            Extract at least 3-5 distinct opportunities.
            For each, provide:
            - funder_name
            - programme_name
            - deadline_estimate (e.g. "Late 2026", "Open", "April 15")
            - description (summary of what it funds)
            - source_url (the specific URL from the source)
            
            Return strictly a JSON array of objects. No markdown formatting.
            """
            
            response = model.generate_content(prompt)
            clean_text = response.text.strip().replace("```json", "").replace("```", "")
            
            data = json.loads(clean_text)
            return data

        except Exception as e:
            print(f"Gemini Extraction failed: {e}")
            return []


    async def research_and_create_opportunities(self, query: str = "film documentary arts grants", region: str = "South Africa") -> list[FundingOpportunity]:
        """
        Research opportunities and automatically create them in the database.
        Uses Gemini AI with grounded search for deep research.
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
                eligibility_criteria={
                    "source": result.get("source_url", ""),
                    "description": result.get("description", ""),
                    "deadline_estimate": result.get("deadline_estimate", "")
                },
                budget_rules={"notes": "Sourced via Gemini AI research - verify details before applying"}
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

