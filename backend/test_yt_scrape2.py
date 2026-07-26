import urllib.request
import urllib.parse
import re
import json

query = "política brasil noticias"
query_encoded = urllib.parse.quote(query)
url = f"https://www.youtube.com/results?search_query={query_encoded}&sp=CAISAhAB"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

match = re.search(r'var ytInitialData = (\{.*?\});</script>', html)
if match:
    data = json.loads(match.group(1))
    contents = data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents']
    for item in contents:
        if 'videoRenderer' in item:
            vid = item['videoRenderer']
            title = vid['title']['runs'][0]['text']
            published = vid.get('publishedTimeText', {}).get('simpleText', '')
            print(f"{title} ({published})")
