from app.models import Section, SectionStatus
from app.schemas import SectionCreate, SectionUpdate
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import re
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
from dotenv import load_dotenv

load_dotenv()

class EditorialAgent:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.7) if os.getenv("OPENAI_API_KEY") else None

    async def review_section(self, section_id: uuid.UUID) -> str:
        """Analyze the section content using LLM for tone and clarity."""
        section = await self.get_section(section_id)
        if not section or not section.content_text:
            return "No content to review."
        
        if not self.llm:
            return "OpenAI API Key not configured."

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert academic editor. Critique the following text for clarity, academic tone, and logical flow. concise bullet points."),
            ("user", "{text}")
        ])
        
        chain = prompt | self.llm | StrOutputParser()
        return await chain.ainvoke({"text": section.content_text})


    async def create_section(self, project_id: uuid.UUID, title: str, order_index: int = 0) -> Section:
        """Create a new section for a project."""
        section = Section(
            project_id=project_id,
            title=title,
            order_index=order_index,
            status=SectionStatus.DRAFT,
            version=1,
            content_text=""
        )
        self.db.add(section)
        await self.db.commit()
        await self.db.refresh(section)
        return section

    async def get_sections(self, project_id: uuid.UUID) -> list[Section]:
        """List all sections for a project."""
        result = await self.db.execute(
            select(Section)
            .where(Section.project_id == project_id)
            .order_by(Section.order_index)
        )
        return result.scalars().all()

    async def get_section(self, section_id: uuid.UUID) -> Section:
        """Get a single section."""
        result = await self.db.execute(select(Section).where(Section.id == section_id))
        return result.scalars().first()

    async def update_content(self, section_id: uuid.UUID, content: str) -> Section:
        """Update section content and increment version."""
        section = await self.get_section(section_id)
        if section:
            section.content_text = content
            section.version += 1
            await self.db.commit()
            await self.db.refresh(section)
        return section

    async def lock_section(self, section_id: uuid.UUID) -> tuple[Section, list[str]]:
        """Attempt to lock a section. Returns (section, errors)."""
        section = await self.get_section(section_id)
        if not section:
            return None, ["Section not found"]

        # Run consistency checks
        errors = self._run_checks(section)
        
        if not errors:
            section.status = SectionStatus.LOCKED
            await self.db.commit()
            await self.db.refresh(section)
        
        return section, errors

    def _run_checks(self, section: Section) -> list[str]:
        """Internal consistency checks."""
        errors = []
        content = section.content_text or ""
        
        # Check 1: Empty content
        if len(content.strip()) < 10:
            errors.append("Content is too short to lock.")

        # Check 2: Simple date format check (e.g., look for ambiguous dates if needed)
        # For now, just a placeholder logic
        if "TODO" in content:
            errors.append("Section contains TODOs.")

        return errors
