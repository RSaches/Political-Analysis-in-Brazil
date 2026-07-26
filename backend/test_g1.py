import urllib.request
import xml.etree.ElementTree as ET

url = "https://g1.globo.com/rss/g1/politica/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    xml_data = urllib.request.urlopen(req).read()
    root = ET.fromstring(xml_data)
    for item in root.findall('.//item')[:3]:
        title = item.find('title').text
        link = item.find('link').text
        description = item.find('description').text
        
        # Check for media content (namespace: media="http://search.yahoo.com/mrss/")
        media_content = item.find('{http://search.yahoo.com/mrss/}content')
        img_url = media_content.attrib['url'] if media_content is not None else 'No Image'
        
        print(f"TITLE: {title}")
        print(f"DESC: {description}")
        print(f"IMG: {img_url}")
        print("-" * 50)
except Exception as e:
    print(f"Error: {e}")
