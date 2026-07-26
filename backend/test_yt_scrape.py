import urllib.request
import re
import json
from datetime import datetime

url = "https://www.youtube.com/results?search_query=politica+brasil+noticias+hoje&sp=CAI%253D" # CAI= is filter by upload date (most recent)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

video_ids = re.findall(r'"videoId":"(.*?)"', html)
titles = re.findall(r'"title":\{"runs":\[\{"text":"(.*?)"\}\]', html)

seen = set()
results = []
for vid, title in zip(video_ids, titles):
    if vid not in seen and len(title) > 10:
        seen.add(vid)
        results.append({"title": title, "id": vid})
        if len(results) >= 10: break

for r in results:
    print(r)
