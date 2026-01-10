import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def main():
    async with httpx.AsyncClient() as client:
        print("--- Starting Funding Application Simulation ---")
        
        # 1. Create Opportunity
        print("\n[1] Identifying Funding Opportunity...")
        opp_data = {
            "funder_name": "Arts Council England",
            "programme_name": "National Lottery Project Grants",
            "deadline": "2026-05-15"
        }
        resp = await client.post(f"{BASE_URL}/opportunities", json=opp_data)
        if resp.status_code != 201:
            print(f"Error creating opportunity: {resp.text}")
            return
        opp = resp.json()
        print(f"    > Found Opportunity: {opp['funder_name']} - {opp['programme_name']}")
        print(f"    > ID: {opp['id']}")

        # 2. Create Application
        print("\n[2] Initializing Application Package...")
        resp = await client.post(f"{BASE_URL}/applications?opportunity_id={opp['id']}")
        if resp.status_code != 201:
            print(f"Error creating application: {resp.text}")
            return
        app_pkg = resp.json()
        print(f"    > Application Created. Status: {app_pkg['submission_status']}")
        print(f"    > ID: {app_pkg['id']}")

        # 3. Write Draft
        print("\n[3] Drafting Narrative...")
        narrative = (
            "Title: The Digital Archive\n\n"
            "Project Description: We aim to digitize 5,000 rare assets...\n"
            "Beneficiaries: Historians, Artists, Public...\n"
            "Budget: £15,000 for equipment and staff."
        )
        update_data = {
            "narrative_draft": narrative,
            "budget_json": {"equipment": 5000, "staff": 10000},
            "submission_status": "Draft"
        }
        resp = await client.put(f"{BASE_URL}/applications/{app_pkg['id']}", json=update_data)
        app_pkg = resp.json()
        print(f"    > Draft Updated. Word Count: {len(app_pkg['narrative_draft'].split())}")

        # 4. Submit
        print("\n[4] Submitting Application...")
        update_data["submission_status"] = "Submitted"
        resp = await client.put(f"{BASE_URL}/applications/{app_pkg['id']}", json=update_data)
        app_pkg = resp.json()
        print(f"    > Status: {app_pkg['submission_status']}")
        print("    > Success! Application submitted to 'Arts Council England'.")

        print("\n--- Simulation Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
