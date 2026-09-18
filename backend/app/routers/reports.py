from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.schemas import ReportResponse
from app.services.report_service import generate_report, export_json, export_csv

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/{project_id}", response_model=ReportResponse)
async def get_report(project_id: int, db: AsyncSession = Depends(get_db)):
    data = await generate_report(db, project_id)
    return {"id": 1, "project_id": project_id, "report_data": data or {}}

@router.get("/{project_id}/export/json")
async def export_report_json(project_id: int, db: AsyncSession = Depends(get_db)):
    data = await export_json(db, project_id)
    return Response(content=data, media_type="application/json")

@router.get("/{project_id}/export/csv")
async def export_report_csv(project_id: int, db: AsyncSession = Depends(get_db)):
    data = await export_csv(db, project_id)
    return Response(content=data, media_type="text/csv")
