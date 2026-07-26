import urllib.request, urllib.parse, re, json
url = "https://www.youtube.com/results?search_query=noticias+brasil&sp=CAI%3D"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
match = re.search(r'var ytInitialData = (\{.*?\});</script>', html)
if match:
    data = json.loads(match.group(1))
    contents = data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents']
    for item in contents[:10]:
        if 'videoRenderer' in item:
            vid = item['videoRenderer']
            print(vid['title']['runs'][0]['text'], vid.get('publishedTimeText', {}).get('simpleText', 'Hoje'))
