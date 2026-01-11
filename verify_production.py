import requests
import sys
import time

API_URL = "https://mono-grant-os-production.up.railway.app/api/v1"
# For local testing if needed:
# API_URL = "http://localhost:8000/api/v1"

def test_health():
    print(f"Testing Health Check at {API_URL}/health...")
    try:
        r = requests.get(f"{API_URL}/health", timeout=5)
        if r.status_code == 200:
            print("✅ Health Check Passed")
            return True
        else:
            print(f"❌ Health Check Failed: {r.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

def test_dashboard():
    print(f"\nTesting Dashboard Stats at {API_URL}/dashboard/stats...")
    try:
        r = requests.get(f"{API_URL}/dashboard/stats", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print("✅ Dashboard Stats Loaded")
            print(f"   - Opportunities: {data['counts']['opportunities']}")
            print(f"   - Upcoming Deadlines: {len(data['upcoming_deadlines'])}")
            if 'projects' in data['counts']:
                 print("⚠️ WARNING: 'projects' field unexpectedly found in response")
            return True
        else:
            print(f"❌ Dashboard Failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

def test_funding_list():
    print(f"\nTesting Funding List at {API_URL}/opportunities...")
    try:
        r = requests.get(f"{API_URL}/opportunities", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Funding List Loaded: {len(data)} items")
            return True
        else:
            print(f"❌ Funding List Failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Verifying Funding OS Transition...")
    
    success = True
    if not test_health(): success = False
    if not test_dashboard(): success = False
    if not test_funding_list(): success = False
    
    if success:
        print("\n✨ All systems nominal. Transition successful.")
        sys.exit(0)
    else:
        print("\n🔥 Verification failed.")
        sys.exit(1)
