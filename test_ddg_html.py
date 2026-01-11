import requests
from bs4 import BeautifulSoup

def search_ddg_html(query):
    print(f"Searching DDG HTML for: {query}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    url = "https://html.duckduckgo.com/html/"
    data = {"q": query}
    
    try:
        response = requests.post(url, data=data, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        soup = BeautifulSoup(response.text, "html.parser")
        results = []
        
        for result in soup.find_all("div", class_="result"):
            title_tag = result.find("a", class_="result__a")
            snippet_tag = result.find("a", class_="result__snippet")
            
            if title_tag and snippet_tag:
                title = title_tag.get_text(strip=True)
                link = title_tag["href"]
                snippet = snippet_tag.get_text(strip=True)
                
                results.append({
                    "title": title,
                    "href": link,
                    "body": snippet
                })
        
        print(f"✅ Found {len(results)} results.")
        for r in results[:3]:
            print(f"- {r['title']}")
            print(f"  {r['body'][:50]}...")
            
        return results

    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    search_ddg_html("arts grants South Africa")
