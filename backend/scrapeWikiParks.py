import urllib.request
import re
import json

def fetch_wiki_images():
    # List of wiki pages about parks
    urls = [
        "https://en.wikipedia.org/wiki/Urban_park",
        "https://en.wikipedia.org/wiki/List_of_urban_parks_by_size",
        "https://en.wikipedia.org/wiki/Central_Park",
        "https://en.wikipedia.org/wiki/Hyde_Park,_London",
        "https://en.wikipedia.org/wiki/Golden_Gate_Park",
        "https://en.wikipedia.org/wiki/Lalbagh_Botanical_Gardens",
        "https://en.wikipedia.org/wiki/Cubbon_Park"
    ]
    
    park_urls = []
    
    for url in urls:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        try:
            html = urllib.request.urlopen(req).read().decode('utf-8')
            
            # Find all image thumbnails
            images = re.findall(r'src="(//upload\.wikimedia\.org/wikipedia/commons/thumb/[^"]+\.(?:jpg|JPG|jpeg|JPEG|png|PNG))/[0-9]+px-[^"]+"', html)
            
            for img in images:
                # Get a larger size (800px) instead of the small thumbnail
                filename = img.split('/')[-1]
                large_url = f"https:{img}/800px-{filename}"
                park_urls.append(large_url)
                
        except Exception as e:
            print(f"Error on {url}: {e}")
            
    # Deduplicate
    unique_urls = list(set(park_urls))
    
    # Filter out icons and very small common elements (usually SVG or weird names)
    final_urls = [u for u in unique_urls if "Flag" not in u and "Icon" not in u and "Map" not in u]
    
    with open("parkPhotos.json", "w") as f:
        json.dump(final_urls, f, indent=2)
        
    print(f"Successfully scraped {len(final_urls)} park images from Wikipedia.")

fetch_wiki_images()
