from youtubesearchpython import VideosSearch

videosSearch = VideosSearch('política brasil hoje', limit = 10)
results = videosSearch.result()['result']
for r in results:
    print(r.get('title'), r.get('publishedTime'), r.get('link'))
