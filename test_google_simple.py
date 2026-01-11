from googlesearch import search

def test_google():
    print("Testing Google Search...")
    query = "arts grants South Africa"
    
    try:
        results = search(query, num_results=3, advanced=True)
        count = 0
        for r in results:
            print(f"- {r.title} ({r.url})")
            print(f"  {r.description[:100]}...")
            count += 1
            
        print(f"\n✅ Found {count} results via Google.")
    except Exception as e:
        print(f"\n❌ Google Error: {e}")

if __name__ == "__main__":
    test_google()
