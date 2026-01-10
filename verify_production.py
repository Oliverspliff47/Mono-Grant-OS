
import sys
import json
import urllib.request
import urllib.error
import time

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
    print(f"Starting E2E Test against {BASE_URL}...\n")

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

    # 2. Create Project
    try:
        project_data = {
            "title": "E2E_TEST_PROJECT_" + str(int(time.time())),
            "start_date": "2026-01-01"
        }
        project = make_request("POST", f"{BASE_URL}/projects", project_data)
        project_id = project['id']
        log(f"Create Project (ID: {project_id})")
    except:
        log("Create Project Failed", False)
        return

    # 3. Create Section
    try:
        section_data = {
            "title": "Test Section",
            "order_index": 0
        }
        section = make_request("POST", f"{BASE_URL}/projects/{project_id}/sections", section_data)
        section_id = section['id']
        log(f"Create Section (ID: {section_id})")
    except:
        log("Create Section Failed", False)
        return

    # 4. Update Content (Draft)
    try:
        content_data = {"content_text": "This is a draft content for E2E testing."}
        make_request("PUT", f"{BASE_URL}/sections/{section_id}", content_data)
        log("Update Section Content")
    except:
        log("Update Section Content Failed", False)
        return

    # 5. Submit for Review
    try:
        section = make_request("POST", f"{BASE_URL}/sections/{section_id}/submit")
        if section['status'] == "Review":
            log("Submit for Review (Status: Review)")
        else:
            log(f"Submit for Review Failed (Status: {section.get('status')})", False)
            return
    except:
        log("Submit for Review Failed", False)
        return

    # 6. Approve (Lock)
    try:
        section = make_request("POST", f"{BASE_URL}/sections/{section_id}/approve")
        if section['status'] == "Locked":
            log("Approve Section (Status: Locked)")
        else:
            log(f"Approve Section Failed (Status: {section.get('status')})", False)
    except:
        log("Approve Section Failed", False)

    print("\nE2E Test Completed.")

if __name__ == "__main__":
    run_e2e()
