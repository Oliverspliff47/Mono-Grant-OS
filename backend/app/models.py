from sqlalchemy import Column, String, Date, DateTime, Boolean, Enum, ForeignKey, Text, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.core.database import Base

# Models
# Project, Section, Asset models removed for Funding OS pivot

class FundingOpportunity(Base):
    __tablename__ = "funding_opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    funder_name = Column(String, nullable=False)
    programme_name = Column(String, nullable=False)
    deadline = Column(Date, nullable=True)
    status = Column(Enum(FundingStatus), default=FundingStatus.TO_REVIEW)
    eligibility_criteria = Column(JSON, nullable=True)
    budget_rules = Column(JSON, nullable=True)

    applications = relationship("ApplicationPackage", back_populates="opportunity", cascade="all, delete-orphan")

class ApplicationPackage(Base):
    __tablename__ = "application_packages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("funding_opportunities.id"), nullable=False)
    narrative_draft = Column(Text, nullable=True)
    budget_json = Column(JSON, nullable=True)
    submission_status = Column(Enum(SubmissionStatus), default=SubmissionStatus.DRAFT)
    final_approval = Column(Boolean, default=False)

    opportunity = relationship("FundingOpportunity", back_populates="applications")
