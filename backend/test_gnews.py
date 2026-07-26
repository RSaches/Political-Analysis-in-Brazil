import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

url = "https://news.google.com/rss/search?q=pol%C3%ADtica+brasil+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    xml_data = urllib.request.urlopen(req).read()
    root = ET.fromstring(xml_data)
    for item in root.findall('.//item')[:3]:
        title = item.find('title').text
        link = item.find('link').text
        pubDate = item.find('pubDate').text
        source = item.find('source').text if item.find('source') is not None else ''
        description = item.find('description').text if item.find('description') is not None else ''
        print(f"TITLE: {title}")
        print(f"SOURCE: {source}")
        print(f"DESC: {description}")
        print("-" * 50)
except Exception as e:
    print(f"Error: {e}")
