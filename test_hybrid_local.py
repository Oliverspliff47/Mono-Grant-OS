from duckduckgo_search import DDGS
import json

def test_ddg():
    print("Testing DuckDuckGo Search...")
    query = "hello world"
    region = ""
    full_query = "hello world"
    
    try:
        results = []
        with DDGS() as ddgs:
            # Get only 3 for speed
            ddg_results = list(ddgs.text(full_query, max_results=3))
            for r in ddg_results:
                print(f"- {r['title']}")
                results.append(r)
        
        print(f"\n✅ Found {len(results)} results via DDG.")
        return results
    except Exception as e:
        print(f"\n❌ DDG Error: {e}")
        return []

if __name__ == "__main__":
    test_ddg()
