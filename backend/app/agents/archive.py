from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Asset, AssetType, RightsStatus, UsageScope
import uuid
import os

class ArchiveAgent:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def scan_directory(self, project_id: uuid.UUID, directory_path: str) -> list[Asset]:
        """Scan a directory for valid assets and index them."""
        assets = []
        if not os.path.exists(directory_path):
            raise ValueError(f"Directory not found: {directory_path}")

        valid_extensions = {".jpg", ".jpeg", ".png", ".pdf", ".mp3", ".wav"}

        for root, _, files in os.walk(directory_path):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in valid_extensions:
                    full_path = os.path.join(root, file)
                    
                    # Determine type based on extension
                    asset_type = AssetType.VERIFICATION_DOC
                    if ext in [".jpg", ".jpeg", ".png"]:
                        asset_type = AssetType.PHOTO
                    elif ext in [".mp3", ".wav"]:
                        asset_type = AssetType.AUDIO

                    # Check for duplicates (basic check by path for now)
                    existing = await self.db.execute(select(Asset).where(Asset.file_path == full_path, Asset.project_id == project_id))
                    if existing.scalars().first():
                         continue

                    asset = Asset(
                        project_id=project_id,
                        file_path=full_path,
                        type=asset_type,
                        rights_status=RightsStatus.UNKNOWN,
                        usage_scope=UsageScope.PRINT
                    )
                    self.db.add(asset)
                    assets.append(asset)
        
        if assets:
            await self.db.commit()
            for asset in assets:
                await self.db.refresh(asset)
        
        return assets

    async def get_assets(self, project_id: uuid.UUID) -> list[Asset]:
        """List all assets for a project."""
        result = await self.db.execute(select(Asset).where(Asset.project_id == project_id))
        return result.scalars().all()

    async def update_asset_metadata(self, asset_id: uuid.UUID, rights_status: RightsStatus, credit_line: str) -> Asset:
        """Update asset metadata."""
        result = await self.db.execute(select(Asset).where(Asset.id == asset_id))
        asset = result.scalars().first()
        if asset:
            asset.rights_status = rights_status
            asset.credit_line = credit_line
            await self.db.commit()
            await self.db.refresh(asset)
        return asset
