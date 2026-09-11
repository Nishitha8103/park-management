import urllib.request
import re
import json

def fetch_park_images():
    url = "https://unsplash.com/s/photos/city-park"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        # Find all images.unsplash.com/photo-... links
        matches = re.findall(r'https://images\.unsplash\.com/photo-[a-zA-Z0-9\-]+', html)
        
        # Deduplicate
        unique_urls = list(set(matches))
        
        # Some photos might be people/profiles, but mostly a search for "city park" will yield parks.
        # We'll just take the first 40 unique URLs.
        park_urls = [url + "?w=800&q=80" for url in unique_urls][:40]
        
        with open("parkPhotos.json", "w") as f:
            json.dump(park_urls, f, indent=2)
            
        print(f"Successfully scraped {len(park_urls)} park images.")
    except Exception as e:
        print(f"Error: {e}")

fetch_park_images()
