import urllib.request, urllib.parse, re, json

def parse_time(text):
    text = text.lower().replace('transmitido', '').strip()
    if 'agora' in text or 'hoje' in text: return 0
    match = re.search(r'(\d+)\s+(minuto|hora|dia|semana|mês|mes|ano)', text)
    if not match: return 999999
    val = int(match.group(1))
    unit = match.group(2)
    if 'minuto' in unit: return val
    if 'hora' in unit: return val * 60
    if 'dia' in unit: return val * 60 * 24
    if 'semana' in unit: return val * 60 * 24 * 7
    return val * 60 * 24 * 30

query = "política brasil"
url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}&sp=CAISAhAB"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
match = re.search(r'var ytInitialData = (\{.*?\});</script>', html)
videos = []
if match:
    data = json.loads(match.group(1))
    contents = data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents']
    for item in contents:
        if 'videoRenderer' in item:
            vid = item['videoRenderer']
            title = vid['title']['runs'][0]['text']
            published = vid.get('publishedTimeText', {}).get('simpleText', 'Hoje')
            minutes = parse_time(published)
            videos.append({'title': title, 'pub': published, 'min': minutes})

videos.sort(key=lambda x: x['min'])
for v in videos[:15]:
    print(v['title'], v['pub'])
