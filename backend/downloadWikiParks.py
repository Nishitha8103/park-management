import json
import urllib.request
import os
import time

def download_images():
    with open('parkPhotos.json', 'r') as f:
        urls = json.load(f)
        
    # We only need about 30 diverse images to make it look good
    urls_to_download = urls[:30]
    
    out_dir = r"c:\Users\nishi\park_monitoring_system08\frontend\public\parks"
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
        
    downloaded = 0
    for i, url in enumerate(urls_to_download):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            response = urllib.request.urlopen(req)
            data = response.read()
            
            ext = url.split('.')[-1]
            if len(ext) > 4: ext = "jpg"
            
            out_path = os.path.join(out_dir, f"wiki_{i}.{ext}")
            with open(out_path, 'wb') as out_f:
                out_f.write(data)
                
            downloaded += 1
            print(f"Downloaded {i}")
            time.sleep(0.5) # Be nice to wikipedia
        except Exception as e:
            print(f"Failed {i}: {e}")
            
    print(f"Successfully downloaded {downloaded} images!")

download_images()
