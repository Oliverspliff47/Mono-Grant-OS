import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import uuid
import os
from unittest.mock import patch

# Single E2E test to avoid state/loop issues between tests
# and guarantee order of operations.

@pytest.mark.asyncio
async def test_e2e_workflow():
    # Mock the review_section method to avoid OpenAI calls
    with patch("app.agents.editorial.EditorialAgent.review_section", return_value="Mocked AI Feedback: Logic looks good."):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            
            # 1. Health Check
            print("Testing Health...")
            res_health = await ac.get("/health")
            assert res_health.status_code == 200
            # Accepts verify either "ok" or "healthy" just in case
            assert res_health.json()["status"] in ["ok", "healthy"]

            # 2. Create Project
            print("Testing Create Project...")
            project_title = "E2E Test Project " + str(uuid.uuid4())
            res_proj = await ac.post("/api/v1/projects", json={
                "title": project_title,
                "start_date": "2026-01-01",
                "print_deadline": "2026-06-01"
            })
            assert res_proj.status_code == 201
            project_data = res_proj.json()
            project_id = project_data["id"]
            assert project_data["title"] == project_title

            # 3. List Projects
            print("Testing List Projects...")
            res_list = await ac.get("/api/v1/projects")
            assert res_list.status_code == 200
            projects = res_list.json()
            assert any(p["id"] == project_id for p in projects)

            # 4. Create Section
            print("Testing Create Section...")
            res_sect = await ac.post(f"/api/v1/projects/{project_id}/sections", json={
                "title": "E2E Section",
                "order_index": 1
            })
            assert res_sect.status_code == 201
            section_data = res_sect.json()
            section_id = section_data["id"]

            # 5. Update Section
            print("Testing Update Section...")
            res_upd = await ac.put(f"/api/v1/sections/{section_id}", json={
                "content_text": "E2E Draft Content"
            })
            assert res_upd.status_code == 200
            assert res_upd.json()["content_text"] == "E2E Draft Content"

            # 6. Review Section (Mocked/Skipped key check implicitly by API logic)
            print("Testing Review Section...")
            res_rev = await ac.post(f"/api/v1/sections/{section_id}/review")
            assert res_rev.status_code == 200
            
            # 7. Lock Section
            print("Testing Lock Section...")
            res_lock = await ac.post(f"/api/v1/sections/{section_id}/lock")
            assert res_lock.status_code == 200
            assert res_lock.json()["status"] == "Locked"

            # 8. Archive Scan
            print("Testing Archive Scan...")
            cwd = os.getcwd() # Scan current backend dir
            res_scan = await ac.post(f"/api/v1/projects/{project_id}/scan", json={
                "directory_path": cwd
            })
            assert res_scan.status_code == 200
            # Might be empty if no assets, but call should succeed

            # 9. Funding Workflow
            print("Testing Funding...")
            # Create Opportunity
            res_opp = await ac.post("/api/v1/opportunities", json={
                "funder_name": "E2E Funder",
                "programme_name": "E2E Grant",
                "deadline": "2026-12-31"
            })
            assert res_opp.status_code == 201
            opp_id = res_opp.json()["id"]

            # Create Application
            res_app = await ac.post(f"/api/v1/applications?opportunity_id={opp_id}")
            assert res_app.status_code == 201
            app_id = res_app.json()["id"]

            # Update Application
            res_app_upd = await ac.put(f"/api/v1/applications/{app_id}", json={
                "narrative_draft": "E2E Application Draft"
            })
            assert res_app_upd.status_code == 200
            assert res_app_upd.json()["narrative_draft"] == "E2E Application Draft"

            # 10. Dashboard Stats
            print("Testing Dashboard...")
            try:
                res_stats = await ac.get("/api/v1/dashboard/stats")
                assert res_stats.status_code == 200
                stats = res_stats.json()
                assert stats["counts"]["projects"] > 0
            except Exception as e:
                print(f"Dashboard Failed: {e}")
                # If validaiton error, it might have .errors()
                if hasattr(e, "errors"):
                    print(e.errors())
                raise e
