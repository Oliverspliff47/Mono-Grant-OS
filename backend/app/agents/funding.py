from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import FundingOpportunity, ApplicationPackage, FundingStatus, SubmissionStatus
import uuid
from datetime import date, timedelta
import json
import re
import os
import google.generativeai as genai

class FundingAgent:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)

    async def research_opportunities(self, query: str = "film documentary arts grants funding", region: str = "South Africa") -> list[dict]:
        """
        Deep research to find funding opportunities using Gemini AI with grounded search.
        Returns a list of discovered opportunities.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY not set, falling back to empty results")
            return []
        
        try:
            # Use Gemini with search grounding for deep research
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction="""You are a funding research specialist. Your task is to find real, current funding opportunities for filmmakers, documentarians, and artists.

When researching, look for:
- Government arts councils and cultural funds
- Private foundations supporting film/documentary
- International film funds
- Arts grants and fellowships
- Documentary-specific funding programs

For each opportunity found, extract:
1. Funder name (organization providing the funding)
2. Programme name (specific grant or fund name)
3. Deadline if known (or estimate "Q1/Q2/Q3/Q4 2026" if unclear)
4. Brief description

Return your findings as a JSON array with objects containing: funder_name, programme_name, deadline_estimate, description, source_url (if known)

Be thorough and find at least 5-10 relevant opportunities. Focus on currently active programs."""
            )
            
            # Enable search grounding for real-time web research
            research_prompt = f"""Research current funding opportunities for: {query}

Focus on region: {region}

Search for active grants, funds, and fellowships that filmmakers, documentarians, and artists can apply to in 2026.

Find real opportunities with actual deadlines and application processes. Include both local ({region}) and international opportunities that accept applications from {region}.

Return the results as a JSON array."""

            response = model.generate_content(
                research_prompt,
                tools="google_search_retrieval"
            )
            
            # Parse the response
            response_text = response.text
            
            # Extract JSON from response
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                results = json.loads(json_match.group())
                
                # Normalize the results
                normalized = []
                for item in results:
                    normalized.append({
                        "funder_name": str(item.get("funder_name", item.get("funder", "Unknown")))[:100],
                        "programme_name": str(item.get("programme_name", item.get("programme", item.get("name", "Grant Program"))))[:200],
                        "deadline_estimate": str(item.get("deadline_estimate", item.get("deadline", "2026")))[:50],
                        "description": str(item.get("description", ""))[:500],
                        "source_url": str(item.get("source_url", item.get("url", "")))[:500]
                    })
                return normalized
            else:
                print(f"Could not parse JSON from Gemini response: {response_text[:500]}")
                return []
                
        except Exception as e:
            print(f"Gemini research error: {e}")
            import traceback
            traceback.print_exc()
            # DEBUG: Return error as result
            return [{
                "funder_name": "DEBUG_ERROR",
                "programme_name": f"Error: {str(e)}",
                "deadline_estimate": "2026",
                "description": "Debug error message",
                "source_url": ""
            }]


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

