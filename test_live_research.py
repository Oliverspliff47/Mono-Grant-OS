import asyncio
import httpx
import json
import sys

# Live API URL
API_URL = "https://mono-grant-os-production.up.railway.app/api/v1/opportunities/research"

async def test_research():
    print(f"Testing Research API at: {API_URL}")
    print("Query: arts grants")
    print("Region: South Africa")
    
    params = {
        "query": "arts grants",
        "region": "South Africa"
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(API_URL, params=params)
            
            if response.status_code == 200:
                results = response.json()
                print(f"\n✅ SUCCESS! Found {len(results)} opportunities.")
                for i, opp in enumerate(results, 1):
                    print(f"\n--- Opportunity {i} ---")
                    print(f"Name: {opp.get('programme_name')}")
                    print(f"Funder: {opp.get('funder_name')}")
                    print(f"Deadline: {opp.get('deadline_estimate', opp.get('deadline'))}")
                    print(f"Source: {opp.get('eligibility_criteria', {}).get('source')}...")
            else:
                print(f"\n❌ FAILED. Status: {response.status_code}")
                print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_research())
