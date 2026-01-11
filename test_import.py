import requests
import json
import os

# Use local URL or production URL based on env, defaulting to production for this test
API_URL = "https://mono-grant-os-production.up.railway.app/api/v1/opportunities/import"

SAMPLE_TEXT = """
Hi team, here are some funding opportunities I found:

1. The Whickers Film & TV Funding Award
   - Funder: The Whickers
   - For emerging filmmakers.
   - Funding up to £100,000.
   - Deadline: 31st January 2026.
   - https://www.whickers.com/

2. Sundance Documentary Fund
   - Supports non-fiction filmmakers worldwide.
   - Rolling deadline, but next review is June 2026.
   - https://www.sundance.org/

Let me know if we should apply!
"""

def test_import():
    print(f"Testing Smart Import API at: {API_URL}")
    print("-" * 50)
    print(f"Input Text:\n{SAMPLE_TEXT.strip()}\n")
    print("-" * 50)
    
    try:
        response = requests.post(API_URL, json={"text": SAMPLE_TEXT})
        
        if response.status_code == 200:
            results = response.json()
            print(f"✅ SUCCESS! Imported {len(results)} opportunities:")
            for item in results:
                print(f"\n[ Opportunity ID: {item['id']} ]")
                print(f"  - Program: {item['programme_name']}")
                print(f"  - Funder: {item['funder_name']}")
                print(f"  - Deadline: {item['deadline']}")
                print(f"  - Status: {item['status']}")
        else:
            print(f"❌ FAILED. Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_import_file():
    API_FILE_URL = "https://mono-grant-os-production.up.railway.app/api/v1/opportunities/import/file"
    print(f"\nTesting Smart Import FILE API at: {API_FILE_URL}")
    print("-" * 50)
    
    # Create a dummy PDF-like text file
    files = {
        'file': ('test_grants.txt', SAMPLE_TEXT, 'text/plain')
    }
    
    try:
        response = requests.post(API_FILE_URL, files=files)
        
        if response.status_code == 200:
            results = response.json()
            print(f"✅ SUCCESS! Imported {len(results)} opportunities from FILE:")
            for item in results:
                print(f"\n[ Opportunity ID: {item['id']} ]")
                print(f"  - Program: {item['programme_name']}")
                print(f"  - Funder: {item['funder_name']}")
                print(f"  - Requirements: {item['eligibility_criteria'].get('requirements')}")
                print(f"  - Required Docs: {item['eligibility_criteria'].get('required_documents')}")
        else:
            print(f"❌ FAILED. Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_import()
    test_import_file()
