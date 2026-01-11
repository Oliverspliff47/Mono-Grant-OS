from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import FundingOpportunity, ApplicationPackage, FundingStatus, SubmissionStatus
import uuid
from datetime import date, timedelta
import json
import re
import os
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
import httpx # Use httpx for async requests if preferred, using requests for sync compatibility inside async func
import asyncio

class FundingAgent:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)

    def _scrape_ddg(self, query: str) -> list[dict]:
        """Manual scraping of DuckDuckGo HTML version to avoid library issues."""
        print(f"Scraping DDG for: {query}")
        url = "https://html.duckduckgo.com/html/"
        data = {"q": query}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        try:
            # We use sync requests here but wrap in thread if needed, or just block briefly
            # Given the agent nature, blocking for 1-2s is acceptable
            response = requests.post(url, data=data, headers=headers, timeout=15)
            
            if response.status_code != 200:
                print(f"DDG Non-200 Status: {response.status_code}")
                return []
                
            soup = BeautifulSoup(response.text, "html.parser")
            results = []
            
            for result in soup.find_all("div", class_="result"):
                title_tag = result.find("a", class_="result__a")
                snippet_tag = result.find("a", class_="result__snippet")
                
                if title_tag and snippet_tag:
                    results.append({
                        "title": title_tag.get_text(strip=True),
                        "href": title_tag["href"],
                        "body": snippet_tag.get_text(strip=True)
                    })
            
            return results[:10] # Return top 10
            
        except Exception as e:
            print(f"DDG Scraping Error: {e}")
            return []

    async def research_opportunities(self, query: str = "film documentary arts grants funding", region: str = "South Africa") -> list[dict]:
        """
        Deep research using Hybrid approach:
        1. Custom Scrape of DuckDuckGo (Robust)
        2. Parse & Extract via Gemini Flash (Free Tier Friendly)
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY not set")
            return []
            
        print(f"Hybrid Research: Searching for '{query}' in '{region}'...")
        
        # Step 1: Free Web Search (Scraping)
        full_query = f"{query} {region} grants funding opportunities 2026 application"
        
        # Run sync scraping in thread to avoid blocking event loop
        search_results = await asyncio.to_thread(self._scrape_ddg, full_query)
        
        context_text = ""
        for r in search_results:
            context_text += f"\nSOURCE: {r['title']}\nURL: {r['href']}\nCONTENT: {r['body']}\n"

        if not context_text:
            print("No search results found to analyze.")
            return [] # Fail silently/gracefully

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
            
            response = await asyncio.to_thread(model.generate_content, prompt)
            clean_text = response.text.strip().replace("```json", "").replace("```", "")
            
            data = json.loads(clean_text)
            return data

        except Exception as e:
            print(f"Gemini Extraction failed: {e}")
            import traceback
            traceback.print_exc()
            return []


    async def parse_opportunities_from_text(self, text: str) -> list[dict]:
        """
        Smart Import: Parse unstructured text (emails, chat logs, lists) into structured opportunities.
        Uses Gemini Flash for intelligent extraction without search tools.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY not set")
            return []
            
        print("Smart Import: Parsing raw text...")
        
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            
            prompt = f"""You are an expert funding data analyst.
            
            I am providing raw text/content that contains funding opportunities (e.g. from an email, chat log, PDF, or list).
            Your job is to specific extract funding opportunities into a structured JSON array.
            
            RAW CONTENT:
            {text[:30000]}  # Limit context window just in case
            
            INSTRUCTIONS:
            Extract every distinct funding opportunity found in the text.
            For each, provide:
            - funder_name
            - programme_name
            - deadline_estimate (e.g. "Late 2026", "Open", "April 15")
            - description (summary of what it funds)
            - source_url (if mentioned in the text, otherwise empty)
            - requirements (list of eligibility strings, e.g. ["Must be over 18", "Resident of SA"])
            - required_documents (list of docs needed, e.g. ["CV", "Budget", "Script"])
            
            If the text contains no opportunities, return an empty array [].
            Return strictly a JSON array of objects. No markdown formatting.
            """
            
            response = await asyncio.to_thread(model.generate_content, prompt)
            clean_text = response.text.strip().replace("```json", "").replace("```", "")
            
            data = json.loads(clean_text)
            return data

        except Exception as e:
            print(f"Gemini Text Parsing failed: {e}")
            print(f"Raw Response Text: {response.text}") # Debug log
            import traceback
            traceback.print_exc()
            return []

    async def import_opportunities_from_text(self, text: str) -> list[FundingOpportunity]:
        """
        Import opportunities from raw text and persist them to the database.
        """
        parsed_results = await self.parse_opportunities_from_text(text)
        created = []
        
        # Default deadline is 3 months from now if not specified
        default_deadline = date.today() + timedelta(days=90)
        
        for result in parsed_results:
            # Check if similar opportunity already exists
            existing = await self.db.execute(
                select(FundingOpportunity).where(
                    FundingOpportunity.funder_name == result.get("funder_name", "Unknown")[:100],
                    FundingOpportunity.programme_name == result.get("programme_name", "General")[:200]
                )
            )
            if existing.scalars().first():
                continue  # Skip duplicates
            
            opportunity = FundingOpportunity(
                funder_name=result.get("funder_name", "Unknown")[:100],
                programme_name=result.get("programme_name", "General")[:200],
                deadline=default_deadline,  # In future, parsing logic could extract ISO dates
                status=FundingStatus.TO_REVIEW,
                eligibility_criteria={
                    "source": result.get("source_url", ""),
                    "description": result.get("description", ""),
                    "deadline_estimate": result.get("deadline_estimate", ""),
                    "requirements": result.get("requirements", []),
                    "required_documents": result.get("required_documents", [])
                },
                budget_rules={"notes": "Imported via Smart Import"}
            )
            self.db.add(opportunity)
            created.append(opportunity)
        
        if created:
            await self.db.commit()
            for opp in created:
                await self.db.refresh(opp)
        
        return created

    async def import_file(self, file_contents: bytes, filename: str) -> list[FundingOpportunity]:
        """
        Import funding opportunities from an uploaded file (PDF or Text).
        """
        text = ""
        filename_lower = filename.lower()
        
        print(f"Smart Import: Processing file '{filename}'...")

        try:
            if filename_lower.endswith(".pdf"):
                import io
                from pypdf import PdfReader
                
                # Reading PDF logic
                pdf_file = io.BytesIO(file_contents)
                reader = PdfReader(pdf_file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                    
            else:
                # Assume text/markdown/html
                text = file_contents.decode("utf-8", errors="ignore")
            
            if not text.strip():
                print("Extracted text is empty.")
                return []
                
            return await self.import_opportunities_from_text(text)
            
        except Exception as e:
            print(f"File Parsing Error: {e}")
            raise e

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

