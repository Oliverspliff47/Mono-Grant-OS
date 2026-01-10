
import sys
import json
import urllib.request
import urllib.error
import time
from datetime import datetime, timedelta

BASE_URL = "https://mono-grant-os-production.up.railway.app/api/v1"
HEALTH_URL = "https://mono-grant-os-production.up.railway.app/health"

RED = "\033[91m"
GREEN = "\033[92m"
RESET = "\033[0m"

def log(msg, success=True):
    color = GREEN if success else RED
    print(f"{color}[{'PASS' if success else 'FAIL'}] {msg}{RESET}")

def make_request(method, url, data=None):
    try:
        req = urllib.request.Request(url, method=method)
        req.add_header('Content-Type', 'application/json')
        if data:
            jsondata = json.dumps(data).encode('utf-8')
            req.add_header('Content-Length', len(jsondata))
            response = urllib.request.urlopen(req, jsondata)
        else:
            response = urllib.request.urlopen(req)
        
        return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise

def run_e2e():
    print(f"Starting Full Platform Simulation against {BASE_URL}...\n")

    # 1. Health Check
    try:
        health = make_request("GET", HEALTH_URL)
        if health.get("status") == "healthy":
            log("Health Check")
        else:
            log("Health Check returned unhealthy", False)
            return
    except:
        log("Health Check Failed", False)
        return

    # --- PROJECT & EDITORIAL ---
    project_id = None
    try:
        project_data = {
            "title": "Simulation Project " + str(int(time.time())),
            "start_date": "2026-02-01"
        }
        project = make_request("POST", f"{BASE_URL}/projects", project_data)
        project_id = project['id']
        log(f"Create Project (ID: {project_id})")
    except:
        log("Create Project Failed", False)
        return

    try:
        section_data = {"title": "Introduction", "order_index": 0}
        section = make_request("POST", f"{BASE_URL}/projects/{project_id}/sections", section_data)
        section_id = section['id']
        
        # Content Flow
        make_request("PUT", f"{BASE_URL}/sections/{section_id}", {"content_text": "Draft content."})
        make_request("POST", f"{BASE_URL}/sections/{section_id}/submit")
        make_request("POST", f"{BASE_URL}/sections/{section_id}/approve")
        
        updated_section = make_request("GET", f"{BASE_URL}/sections/{section_id}")
        if updated_section['status'] == "Locked":
            log("Editorial Workflow (Draft -> Review -> Locked)")
        else:
            log(f"Editorial Workflow Failed (Status: {updated_section['status']})", False)
    except Exception as e:
        log(f"Editorial Workflow Failed: {e}", False)

    # --- FUNDING ---
    opportunity_id = None
    try:
        deadline = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        opp_data = {
            "funder_name": "Arts Council Test",
            "programme_name": "Digital Grant " + str(int(time.time())),
            "deadline": deadline
        }
        opp = make_request("POST", f"{BASE_URL}/opportunities", opp_data)
        opportunity_id = opp['id']
        log(f"Create Opportunity (ID: {opportunity_id})")
    except:
        log("Create Opportunity Failed", False)

    if opportunity_id:
        try:
            app = make_request("POST", f"{BASE_URL}/applications?opportunity_id={opportunity_id}")
            app_id = app['id']
            log(f"Create Application (ID: {app_id})")
            
            update_data = {
                "narrative_draft": "We fulfill all criteria.",
                "submission_status": "Draft"
            }
            make_request("PUT", f"{BASE_URL}/applications/{app_id}", update_data)
            log("Update Application Content")
        except:
            log("Application Workflow Failed", False)

    # --- ARCHIVES ---
    try:
        assets = make_request("GET", f"{BASE_URL}/projects/{project_id}/assets")
        log(f"List Assets (Count: {len(assets)})")
        # Creating assets requires scanning a real directory, which we can't easily simulation on production without known paths.
        # But we verified the listing endpoint works.
    except:
        log("List Assets Failed", False)

    # --- DASHBOARD ---
    try:
        stats = make_request("GET", f"{BASE_URL}/dashboard/stats")
        counts = stats.get('counts', {})
        if counts.get('projects', 0) > 0 and counts.get('opportunities', 0) > 0:
             log(f"Dashboard Stats (Projects: {counts['projects']}, Opportunities: {counts['opportunities']})")
        else:
             log("Dashboard Stats (Counts seem low/zero?)", False)
    except:
        log("Dashboard Stats Failed", False)

    print("\nSimulation Completed.")

if __name__ == "__main__":
    run_e2e()
