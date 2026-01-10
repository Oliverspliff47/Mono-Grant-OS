from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Project, ProjectStatus
from app.core.database import get_db
import uuid

class ProjectOrchestrator:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def create_project(self, title: str, start_date=None, print_deadline=None) -> Project:
        """Initialize a new Monograph Project."""
        project = Project(
            title=title,
            status=ProjectStatus.PLANNING,
            start_date=start_date,
            print_deadline=print_deadline
        )
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def get_project(self, project_id: uuid.UUID) -> Project:
        """Retrieve project state."""
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        return result.scalars().first()
    
    async def update_status(self, project_id: uuid.UUID, status: ProjectStatus) -> Project:
        """Update project status."""
        project = await self.get_project(project_id)
        if project:
            project.status = status
            await self.db.commit()
            await self.db.refresh(project)
        return project

    async def list_projects(self) -> list[Project]:
        """List all projects."""
        result = await self.db.execute(select(Project).order_by(Project.created_at.desc()))
        return result.scalars().all()
