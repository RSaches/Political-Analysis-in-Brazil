from duckduckgo_search import DDGS
from datetime import datetime

print("Testing DDGS Videos...")
try:
    hoje = datetime.now().strftime("%d/%m/%Y")
    query_canais = f"política brasil {hoje} (CNN Brasil OR GloboNews OR Jovem Pan News OR UOL OR BandNews)"
    print(f"Query: {query_canais}")
    results = list(DDGS().videos(keywords=query_canais, region="br-pt", safesearch="moderate", timelimit="d", max_results=10))
    print(f"Got {len(results)} results.")
    for r in results:
        print(r.get('title'), r.get('published'))
except Exception as e:
    print(f"Error: {e}")
